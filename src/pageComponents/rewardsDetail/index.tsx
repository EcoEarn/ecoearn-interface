import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import { Flex } from 'antd';
import FaqList from 'components/FaqList';
import StakeTokenTitle from 'components/StakeTokenTitle';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RewardsTotalItem from './components/RewardsTotalItem';
import { Button, ToolTip } from 'aelf-design';
import RewardsSingleItem from './components/RewardsSingleItem';
import { earlyStake as earlyStakeApi } from 'api/request';
import {
  cancelSign,
  earlyStakeSign,
  fetchStakingPoolsData,
  getEarlyStakeInfo,
  getPoolRewards,
  withdraw,
  withdrawSign,
} from 'api/request';
import { PoolType, StakeType } from 'types/stake';
import useLoading from 'hooks/useLoading';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { divDecimals, getTargetUnlockTimeStamp } from 'utils/calculate';
import getBalanceTip, { fixEarlyStakeData } from 'utils/stake';
import { formatTokenPrice, formatTokenSymbol } from 'utils/format';
import BigNumber from 'bignumber.js';
import { DEFAULT_DATE_FORMAT, ZERO } from 'constants/index';
import dayjs from 'dayjs';
import ConfirmModal, { ConfirmModalTypeEnum, IWithDrawContent } from 'components/ConfirmModal';
import { useInterval } from 'ahooks';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { getRawTransaction } from 'utils/getRawTransaction';
import { matchErrorMsg } from 'utils/formatError';
import useResponsive from 'utils/useResponsive';
import qs from 'qs';
import { useModal } from '@ebay/nice-modal-react';
import StakeModal from 'components/StakeModalWithConfirm';
import useNotification from 'hooks/useNotification';
import { store } from 'redux/store';
import { setConfirmInfo } from 'redux/reducer/info';
import { TradeConfirmTypeEnum } from 'components/TradeConfrim';
import { ISendResult } from 'types';
import SkeletonImage from 'components/SkeletonImage';
import Loading from 'components/Loading';
export default function RewardsDetailPage() {
  const router = useRouter();
  const { isConnected, walletInfo, walletType } = useConnectWallet();
  const [rewardsInfo, setRewardsInfo] = useState<IPoolRewardsItem>();
  const searchParams = useSearchParams();
  const { showLoading, closeLoading } = useLoading();
  const { curChain, caContractAddress, rewardsContractAddress } = useGetCmsInfo() || {};
  const [poolInfo, setPoolInfo] = useState<IStakePoolData>();
  const config = useGetCmsInfo();
  const [earlyStakeInfo, setEarlyStakeInfo] = useState<IEarlyStakeInfo>();
  const stakeModal = useModal(StakeModal);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalLoading, setConfirmModalLoading] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState<IWithDrawContent>();
  const [confirmModalStatus, setConfirmModalStatus] = useState<'normal' | 'success' | 'error'>(
    'normal',
  );
  const [confirmModalTransactionId, setConfirmModalTransactionId] = useState<string>('');
  const [confirmModalErrorTip, setConfirmModalErrorTip] = useState('');
  const [confirmModalType, setConfirmModalType] = useState<ConfirmModalTypeEnum>();
  const { isMD } = useResponsive();
  const notification = useNotification();
  const [isPending, setIsPending] = useState(false);

  const poolId = useMemo(() => {
    return searchParams.get('poolId') || '';
  }, [searchParams]);

  const poolType = useMemo(() => {
    return searchParams.get('poolType') || '';
  }, [searchParams]);

  const dappId = useMemo(() => {
    return searchParams.get('dappId') || '';
  }, [searchParams]);

  const initEarlyStakeInfo = useCallback(
    async (props?: { rewardsInfo: IPoolRewardsItem; needLoading?: boolean }) => {
      const { needLoading = true, rewardsInfo } = props || {};
      if (!rewardsInfo || !walletInfo?.address || !curChain) return;
      try {
        needLoading && showLoading();
        const earlyStakeInfoList = await getEarlyStakeInfo({
          tokenName: rewardsInfo?.rewardsTokenName,
          address: walletInfo?.address || '',
          chainId: curChain,
          poolType: PoolType.TOKEN,
          rate: 0,
        });
        if (earlyStakeInfoList) {
          const fixedEarlyStakeData = (
            fixEarlyStakeData(earlyStakeInfoList) as Array<IEarlyStakeInfo>
          )?.[0];
          if (fixedEarlyStakeData) setEarlyStakeInfo(fixedEarlyStakeData);
        }
      } catch (err) {
        notification.error({ description: (err as Error)?.message });
        console.error(err);
      } finally {
        needLoading && closeLoading();
      }
    },
    [closeLoading, curChain, notification, showLoading, walletInfo?.address],
  );

  const initRewardsData = useCallback(
    async (props?: { needLoading?: boolean }) => {
      const { needLoading = true } = props || {};
      if (!walletInfo?.address || !poolId || !poolType || (poolType === PoolType.POINTS && !dappId))
        return;
      try {
        needLoading && showLoading();
        const rewardsList = await getPoolRewards({
          address: walletInfo?.address || '',
          poolType: PoolType.ALL,
        });
        if (rewardsList && rewardsList?.length > 0) {
          const rewardsData = rewardsList?.find((item) => {
            if (poolType === PoolType.POINTS) {
              return item.dappId === dappId && item.poolType === poolType;
            } else {
              return item.poolId === poolId && item.poolType === poolType;
            }
          });
          if (rewardsData) {
            setRewardsInfo(rewardsData);
            initEarlyStakeInfo({ needLoading, rewardsInfo: rewardsData });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        needLoading && closeLoading();
      }
    },
    [closeLoading, dappId, initEarlyStakeInfo, poolId, poolType, showLoading, walletInfo?.address],
  );

  const initPoolData = useCallback(
    async (props?: { needLoading?: boolean }) => {
      const { needLoading = true } = props || {};
      if (poolType === PoolType.POINTS) return;
      if (!curChain || !poolId || !poolType) {
        return;
      }
      try {
        needLoading && showLoading();
        const { pools } = await fetchStakingPoolsData({
          poolType: poolType == PoolType.LP ? 'Lp' : 'Token',
          maxResultCount: 20,
          skipCount: 0,
          address: walletInfo?.address || '',
          chainId: curChain,
          sorting: '',
          name: '',
        });
        const poolInfo = (pools || [])
          ?.filter?.((i) => i?.poolId === poolId)
          ?.map((item, index) => {
            return {
              ...item,
              unlockTime: getTargetUnlockTimeStamp(
                item?.stakingPeriod || 0,
                item?.lastOperationTime || 0,
                item?.unlockWindowDuration || 0,
              ).unlockTime,
            };
          });
        if (poolInfo?.length === 1) {
          setPoolInfo(poolInfo?.[0]);
        } else {
          throw new Error('Pool not found');
        }
      } catch (error) {
        notification.error({ description: (error as Error)?.message });
      } finally {
        needLoading && closeLoading();
      }
    },
    [closeLoading, curChain, notification, poolId, poolType, showLoading, walletInfo?.address],
  );

  useEffect(() => {
    initRewardsData();
  }, [initRewardsData]);

  useEffect(() => {
    initPoolData();
  }, [initPoolData]);

  useEffect(() => {
    if (!poolId || !poolType || (poolType === PoolType.POINTS && !dappId)) {
      router.replace('/');
    }
  }, [dappId, poolId, poolType, router]);

  useInterval(
    () => {
      initRewardsData({ needLoading: false });
      initPoolData({ needLoading: false });
    },
    30000,
    { immediate: false },
  );

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const rewardsData = useMemo(() => {
    return rewardsInfo?.rewardsInfo;
  }, [rewardsInfo?.rewardsInfo]);

  const formatRewardsSymbol = useMemo(() => {
    return formatTokenSymbol(rewardsInfo?.rewardsTokenName || '');
  }, [rewardsInfo?.rewardsTokenName]);

  const frozenValueText = useMemo(() => {
    const { frozen, decimal } = rewardsData || {};
    return !isConnected
      ? '--'
      : frozen
      ? `${formatTokenPrice(divDecimals(frozen, decimal || 8)).toString()} ${formatRewardsSymbol}`
      : '0.00';
  }, [rewardsData, isConnected, formatRewardsSymbol]);

  const withdrawableValueText = useMemo(() => {
    const { withdrawable, decimal } = rewardsData || {};
    return !isConnected
      ? '--'
      : withdrawable
      ? `${formatTokenPrice(
          divDecimals(withdrawable, decimal || 8),
        ).toString()} ${formatRewardsSymbol}`
      : '0.00';
  }, [formatRewardsSymbol, isConnected, rewardsData]);

  const stakeEarlyTotal = useMemo(() => {
    const { frozen, withdrawable, decimal } = rewardsData || {};
    return divDecimals(
      BigNumber(frozen || 0)
        .plus(BigNumber(withdrawable || 0))
        .toString(),
      decimal || 8,
    ).toString();
  }, [rewardsData]);

  const isAddStake = useMemo(() => {
    return BigNumber(earlyStakeInfo?.staked || 0).gt(ZERO);
  }, [earlyStakeInfo?.staked]);

  const minStakeAmount = useMemo(() => {
    return divDecimals(
      earlyStakeInfo?.minimalStakeAmount || 0,
      rewardsData?.decimal || 8,
    ).toString();
  }, [earlyStakeInfo?.minimalStakeAmount, rewardsData?.decimal]);

  const minAddStakeAmount = useMemo(() => {
    return divDecimals(
      earlyStakeInfo?.minimalExtendStakeAmount || 0,
      rewardsData?.decimal || 8,
    ).toString();
  }, [earlyStakeInfo?.minimalExtendStakeAmount, rewardsData?.decimal]);

  const stakeEarlyAmountNotEnough = useMemo(() => {
    return ZERO.plus(stakeEarlyTotal).lt(isAddStake ? minAddStakeAmount : minStakeAmount);
  }, [isAddStake, minAddStakeAmount, minStakeAmount, stakeEarlyTotal]);

  const earlyStakePoolIsUnlock = useMemo(() => {
    if (earlyStakeInfo?.staked && !BigNumber(earlyStakeInfo?.staked || 0).isZero()) {
      return dayjs(earlyStakeInfo?.unlockTime).isBefore(dayjs());
    } else {
      return false;
    }
  }, [earlyStakeInfo?.staked, earlyStakeInfo?.unlockTime]);

  const stakeEarlyDisabled = useMemo(() => {
    return !isConnected || stakeEarlyAmountNotEnough || earlyStakePoolIsUnlock;
  }, [earlyStakePoolIsUnlock, isConnected, stakeEarlyAmountNotEnough]);

  const stakeEarlyTip = useMemo(() => {
    return !isConnected
      ? ''
      : stakeEarlyAmountNotEnough
      ? ZERO.plus(stakeEarlyTotal || 0).isZero()
        ? 'No rewards to stake'
        : `Please stake no less than ${
            isAddStake ? minAddStakeAmount : minStakeAmount
          } ${formatRewardsSymbol}`
      : earlyStakePoolIsUnlock
      ? 'Staking has expired, additional reward staking is not possible. Please renew first.'
      : '';
  }, [
    isConnected,
    stakeEarlyAmountNotEnough,
    stakeEarlyTotal,
    isAddStake,
    minAddStakeAmount,
    minStakeAmount,
    formatRewardsSymbol,
    earlyStakePoolIsUnlock,
  ]);

  const withdrawAmountNotEnough = useMemo(() => {
    return BigNumber(rewardsData?.withdrawable || 0).isZero();
  }, [rewardsData?.withdrawable]);

  const withdrawDisabled = useMemo(() => {
    return !isConnected || withdrawAmountNotEnough;
  }, [isConnected, withdrawAmountNotEnough]);

  const claimInfosData = useMemo(() => {
    const { claimInfos, withdrawableClaimInfos } = rewardsData || {};
    const claimIds = (claimInfos || [])?.map((item) => {
      return item.claimId;
    });
    const withdrawClaimIds = (withdrawableClaimInfos || [])?.map((item) => {
      return item.claimId;
    });
    return {
      claimInfos,
      claimIds,
      withdrawableClaimInfos,
      withdrawClaimIds,
    };
  }, [rewardsData]);

  const withdrawTip = useMemo(() => {
    return !isConnected ? '' : withdrawAmountNotEnough ? 'No withdrawable rewards.' : '';
  }, [isConnected, withdrawAmountNotEnough]);

  const stakeEarlyAmountText = useMemo(() => {
    const { earlyStakedAmount, decimal } = rewardsData || {};
    return `${formatTokenPrice(
      BigNumber(divDecimals(earlyStakedAmount || 0, decimal || 8)),
    ).toString()} ${formatRewardsSymbol}`;
  }, [formatRewardsSymbol, rewardsData]);

  const showStakeEarlyAmount = useMemo(() => {
    const { earlyStakedAmount } = rewardsData || {};
    return !BigNumber(earlyStakedAmount || 0).isZero();
  }, [rewardsData]);

  const isAllReleased = useMemo(() => {
    const { claimInfos } = rewardsData || {};
    return dayjs(claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0).isBefore(dayjs());
  }, [rewardsData]);

  const showLastReleaseModule = useMemo(() => {
    const { totalRewards, claimInfos, allRewardsRelease } = rewardsData || {};
    if (!isConnected) return false;
    if (!BigNumber(totalRewards || 0).isZero()) {
      if (!claimInfos || !claimInfos?.length) {
        if (allRewardsRelease) return true;
        return false;
      }
      return true;
    }
    return false;
  }, [isConnected, rewardsData]);

  const releaseAmountText = useMemo(() => {
    const { nextRewardsReleaseAmount, decimal, rewardsTokenName } = rewardsData || {};
    return !isConnected || !nextRewardsReleaseAmount
      ? '--'
      : `${formatTokenPrice(
          divDecimals(nextRewardsReleaseAmount, decimal || 8),
        ).toString()} ${formatTokenSymbol(rewardsTokenName || '')}`;
  }, [isConnected, rewardsData]);

  const releaseTime = useMemo(() => {
    const { nextRewardsRelease } = rewardsData || {};
    return !isConnected || !nextRewardsRelease
      ? '--'
      : dayjs(nextRewardsRelease).format(DEFAULT_DATE_FORMAT);
  }, [isConnected, rewardsData]);

  const initModalState = useCallback(() => {
    setConfirmModalStatus('normal');
    setConfirmModalTransactionId('');
  }, []);

  const initWithdrawModal = useCallback(
    (amount: number, symbol: string) => {
      initModalState();
      setConfirmModalType(ConfirmModalTypeEnum.WithDraw);
      setConfirmModalContent({
        amount: amount || 0,
        tokenSymbol: formatTokenSymbol(symbol),
      });
    },
    [initModalState],
  );

  const confirmModalOnClose = useCallback(() => {
    setConfirmModalVisible(false);
    setConfirmModalContent(undefined);
    setConfirmModalLoading(false);
    setConfirmModalStatus('normal');
    setConfirmModalTransactionId('');
    setConfirmModalType(undefined);
    initRewardsData();
    initPoolData();
    initEarlyStakeInfo();
  }, [initEarlyStakeInfo, initPoolData, initRewardsData]);

  const onWithDrawConfirm = useCallback(async () => {
    const data = rewardsInfo;
    if (!data) return;
    const { withdrawable: amount } = data?.rewardsInfo || {};
    try {
      setConfirmModalLoading(true);
      showLoading({ type: 'block' });
      const claimParams = claimInfosData;
      const signParams: IWithdrawSignParams = {
        amount: Number(amount || 0),
        poolType: data?.poolType,
        address: walletInfo?.address || '',
        claimInfos: claimParams?.withdrawableClaimInfos || [],
        dappId: data?.dappId || '',
        operationPoolIds: data?.poolType === PoolType.POINTS ? [] : [data?.poolId || ''],
        operationDappIds: data?.poolType === PoolType.POINTS ? [data?.dappId || ''] : [],
      };
      const res = (await withdrawSign(signParams)) || {};
      const { signature, seed, expirationTime } = res?.data || {};
      if (!signature || !seed || !expirationTime) throw Error(res?.message || '');
      const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`];
      let rawTransaction = null;
      try {
        rawTransaction = await getRawTransaction({
          walletInfo,
          walletType,
          caContractAddress: caContractAddress || '',
          contractAddress: rewardsContractAddress || '',
          methodName: 'Withdraw',
          params: {
            claimIds: claimParams?.withdrawClaimIds || [],
            account: walletInfo?.address || '',
            amount,
            seed,
            signature,
            expirationTime,
            dappId: data?.dappId || '',
          },
          rpcUrl,
          chainId: curChain!,
        });
      } catch (error) {
        await cancelSign(signParams);
        throw Error((error as Error)?.message || '');
      }
      console.log('rawTransaction', rawTransaction);
      if (!rawTransaction) {
        await cancelSign(signParams);
        throw Error();
      }
      const { data: TransactionId, message: errorMessage } = await withdraw({
        chainId: curChain!,
        rawTransaction: rawTransaction || '',
      });
      closeLoading();
      if (TransactionId) {
        setIsPending(true);
        store.dispatch(
          setConfirmInfo({
            backPath: '/rewards',
            type: TradeConfirmTypeEnum.WithDraw,
            content: {
              amount: divDecimals(amount, data?.rewardsInfo?.decimal || 8).toString(),
              tokenSymbol: data?.rewardsTokenName || '',
              rewardsSymbol: data?.rewardsTokenName || '',
            },
          }),
        );
        router.push(`/tx/${TransactionId}`);
      } else {
        throw Error(errorMessage);
      }
    } catch (error) {
      const errorTip = (error as Error).message;
      const { matchedErrorMsg, title } = matchErrorMsg(errorTip, 'Withdraw');
      matchedErrorMsg &&
        notification.error({
          description: matchedErrorMsg,
          message: title || '',
        });
    } finally {
      closeLoading();
    }
  }, [
    caContractAddress,
    claimInfosData,
    closeLoading,
    config,
    curChain,
    notification,
    rewardsContractAddress,
    rewardsInfo,
    router,
    showLoading,
    walletInfo,
    walletType,
  ]);

  const onWithdraw = useCallback(() => {
    onWithDrawConfirm();
  }, [onWithDrawConfirm]);

  const confirmModalOnConfirm = useCallback(
    async (type: 'earlyStake' | 'withdraw' = 'withdraw') => {
      if (type === 'withdraw') {
        await onWithDrawConfirm();
      }
    },
    [onWithDrawConfirm],
  );

  const freeAmount = useMemo(() => {
    const { frozen, withdrawable } = rewardsData || {};
    return ZERO.plus(frozen || 0)
      .plus(withdrawable || 0)
      .toString();
  }, [rewardsData]);

  const longestReleaseTime = useMemo(() => {
    const { claimInfos } = rewardsData || {};
    return claimInfos && claimInfos?.length > 0
      ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
      : 0;
  }, [rewardsData]);

  const toPoolDetail = useCallback(() => {
    const params: any = {
      poolId: earlyStakeInfo?.poolId || '',
      poolType: PoolType.TOKEN,
      dappId,
      stakeRewards: true,
      rewardsFrom: poolType,
      source: 'detail',
    };
    const fixedParams = qs.stringify(params);
    router.push(`/pool-detail?${fixedParams}`);
  }, [dappId, earlyStakeInfo?.poolId, poolType, router]);

  const earlyStake = useCallback(async () => {
    try {
      const { claimIds, claimInfos } = claimInfosData;
      const hasHistoryStake = !BigNumber(earlyStakeInfo?.staked || 0).isZero();
      console.log('earlyStakeData', earlyStakeInfo);
      stakeModal.show({
        isStakeRewards: true,
        isFreezeAmount: true,
        isEarlyStake: true,
        type: hasHistoryStake ? StakeType.ADD : StakeType.STAKE,
        balanceDec: getBalanceTip(poolType as PoolType),
        freezeAmount: freeAmount,
        earlyAmount: hasHistoryStake
          ? BigNumber(earlyStakeInfo?.staked || 0).toNumber()
          : undefined,
        stakeData: {
          ...earlyStakeInfo,
          stakeInfos: earlyStakeInfo?.subStakeInfos,
          longestReleaseTime: longestReleaseTime || 0,
        },
        onStake: async (amount, period = 0, poolId) => {
          // const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
          const periodInSeconds = 5 * 60;
          const stakeAmount = freeAmount;
          const signParams: IEarlyStakeSignParams = {
            amount: Number(stakeAmount),
            poolType: poolType as PoolType,
            address: walletInfo?.address || '',
            dappId: rewardsInfo?.dappId || '',
            period: periodInSeconds,
            poolId: earlyStakeInfo?.poolId || '',
            claimInfos: claimInfos || [],
            operationPoolIds: poolType === PoolType.POINTS ? [] : [rewardsInfo?.poolId || ''],
            operationDappIds: poolType === PoolType.POINTS ? [rewardsInfo?.dappId || ''] : [],
          };
          try {
            const res = (await earlyStakeSign(signParams)) || {};
            const { signature, seed, expirationTime } = res?.data || {};
            if (!signature || !seed || !expirationTime) throw Error(res?.message || '');
            const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`];
            const longestReleaseTime =
              claimInfos && claimInfos?.length > 0
                ? claimInfos?.[claimInfos?.length - 1]?.releaseTime
                : 0;
            let rawTransaction = null;
            try {
              rawTransaction = await getRawTransaction({
                walletInfo,
                walletType,
                caContractAddress: caContractAddress || '',
                contractAddress: rewardsContractAddress || '',
                methodName: 'StakeRewards',
                params: {
                  stakeInput: {
                    claimIds,
                    account: walletInfo?.address || '',
                    amount: stakeAmount,
                    seed,
                    poolId: earlyStakeInfo?.poolId || '',
                    expirationTime,
                    period: periodInSeconds,
                    dappId: rewardsInfo?.dappId || '',
                    longestReleaseTime: BigNumber(longestReleaseTime).div(1000).dp(0).toNumber(),
                  },
                  signature,
                },
                rpcUrl: (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`],
                chainId: curChain!,
              });
            } catch (error) {
              await cancelSign(signParams);
              throw Error((error as Error)?.message || '');
            }
            console.log('rawTransaction', rawTransaction);
            if (!rawTransaction) {
              await cancelSign(signParams);
              throw Error();
            }
            const { data: TransactionId, message: errorMessage } = await earlyStakeApi({
              chainId: curChain!,
              rawTransaction: rawTransaction || '',
            });
            console.log('====TransactionId', TransactionId);
            if (TransactionId) {
              const hasHistoryStake = !BigNumber(earlyStakeInfo?.staked || 0).isZero();
              const params: any = {
                poolId: earlyStakeInfo?.poolId || '',
                poolType: PoolType.TOKEN,
              };
              const fixedParams = qs.stringify(params);
              const targetUrl = `/pool-detail?${fixedParams}`;
              store.dispatch(
                setConfirmInfo({
                  backPath: targetUrl,
                  poolType: poolType as PoolType,
                  type: hasHistoryStake ? TradeConfirmTypeEnum.Add : TradeConfirmTypeEnum.Stake,
                  isStakeRewards: true,
                  poolDetailPath: `/pool-detail?poolId=${
                    earlyStakeInfo?.poolId || ''
                  }&poolType=Token`,
                  content: {
                    amount: divDecimals(stakeAmount, rewardsData?.decimal || 8).toString(),
                    days: period,
                    unlockDateTimeStamp: hasHistoryStake
                      ? dayjs(earlyStakeInfo?.unlockTime).add(Number(period), 'day').valueOf()
                      : dayjs().add(Number(period), 'day').valueOf(),
                    tokenSymbol: rewardsData?.rewardsTokenName || '',
                    rewardsSymbol: rewardsData?.rewardsTokenName || '',
                    poolType: poolType as PoolType,
                  },
                }),
              );
              return { TransactionId } as ISendResult;
            } else {
              throw Error(errorMessage);
            }
          } catch (error) {
            const errorTip = (error as Error).message;
            const { matchedErrorMsg, title } = matchErrorMsg(errorTip, 'EarlyStake');
            matchedErrorMsg &&
              notification.error({
                description: matchedErrorMsg,
                message: title || '',
              });
            throw Error(errorTip);
          }
        },
        onSuccess: () => {
          setIsPending(true);
          initRewardsData();
          initEarlyStakeInfo();
          initPoolData();
        },
      });
    } catch (error) {
      console.error('earlyStake error', error);
    } finally {
      closeLoading();
    }
  }, [
    caContractAddress,
    claimInfosData,
    closeLoading,
    config,
    curChain,
    earlyStakeInfo,
    freeAmount,
    initEarlyStakeInfo,
    initPoolData,
    initRewardsData,
    longestReleaseTime,
    notification,
    poolType,
    rewardsContractAddress,
    rewardsData?.decimal,
    rewardsData?.rewardsTokenName,
    rewardsInfo?.dappId,
    rewardsInfo?.poolId,
    stakeModal,
    walletInfo,
    walletType,
  ]);

  const handleEarlyStake = useCallback(() => {
    if (BigNumber(earlyStakeInfo?.staked || 0).isZero()) {
      toPoolDetail();
    } else {
      earlyStake();
    }
  }, [earlyStake, earlyStakeInfo?.staked, toPoolDetail]);

  const showInfo = useMemo(() => {
    return poolType === PoolType.POINTS
      ? rewardsInfo && (rewardsInfo?.supportEarlyStake ? earlyStakeInfo : true)
      : rewardsInfo && poolInfo && (rewardsInfo?.supportEarlyStake ? earlyStakeInfo : true);
  }, [earlyStakeInfo, poolInfo, poolType, rewardsInfo]);

  if (isPending) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <>
      {!showInfo ? null : (
        <Flex vertical gap={24} className="max-w-[672px] mx-auto mt-6 md:mt-[64px]">
          <div className="bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder flex flex-col gap-6">
            {poolType === PoolType.POINTS ? (
              <Flex vertical align="center" gap={16}>
                {rewardsInfo?.tokenIcon?.[0] && (
                  <SkeletonImage
                    img={rewardsInfo?.tokenIcon?.[0]}
                    width={64}
                    height={64}
                    className="!rounded-lg  flex-shrink-0 !overflow-hidden"
                  />
                )}
                <span className="text-2xl font-[600] text-neutralTitle">
                  {`${formatTokenSymbol(rewardsInfo?.poolName || '')} Rewards`}
                </span>
              </Flex>
            ) : (
              <StakeTokenTitle
                imgs={poolInfo?.icons || []}
                tokenSymbol={poolInfo?.stakeSymbol || ''}
                type="rewards"
                poolType={poolType as PoolType}
                rate={poolInfo?.rate || 0}
              />
            )}
            <Flex gap={isMD ? 8 : 24}>
              <RewardsTotalItem
                label="Total Rewards"
                tip="All rewards earned by staking in this pool."
                amount={rewardsData?.totalRewards || '0'}
                amountUsd={rewardsData?.totalRewardsInUsd || '0'}
                decimal={Number(rewardsData?.decimal || 8)}
                tokenSymbol={rewardsInfo?.rewardsTokenName || ''}
              />
              <RewardsTotalItem
                label="Withdrawn"
                tip="Rewards already withdrawn to the wallet."
                amount={rewardsData?.withdrawn || '0'}
                amountUsd={rewardsData?.withdrawnInUsd || '0'}
                decimal={Number(rewardsData?.decimal || 8)}
                tokenSymbol={rewardsInfo?.rewardsTokenName || ''}
              />
            </Flex>
            <Flex gap={isMD ? 8 : 24}>
              {rewardsInfo?.supportEarlyStake && (
                <ToolTip title={stakeEarlyTip}>
                  <Button
                    type="primary"
                    onClick={handleEarlyStake}
                    className="!rounded-lg flex-1"
                    disabled={stakeEarlyDisabled}
                  >
                    Stake Rewards
                  </Button>
                </ToolTip>
              )}
              <ToolTip title={withdrawTip}>
                <Button
                  onClick={onWithdraw}
                  type="primary"
                  ghost={rewardsInfo?.supportEarlyStake && !withdrawDisabled}
                  className="!rounded-lg flex-1"
                  disabled={withdrawDisabled}
                >
                  Withdraw
                </Button>
              </ToolTip>
            </Flex>
            <Flex
              className="rounded-xl p-6 bg-[#F9FCFF] border-solid border-[1px] border-[#F4F9FE]"
              gap={16}
              vertical
            >
              <RewardsSingleItem
                label="Frozen"
                tip="Before the release point, the rewards are frozen. If you stake or add liquidity early, the amount of frozen rewards needs to be deducted accordingly."
                value={frozenValueText}
              />
              <RewardsSingleItem
                label="Withdrawable"
                tip="After reaching the release point, the rewards can be withdrawn to the wallet. If you stake or add liquidity early, the amount of withdrawable rewards will be deducted accordingly."
                value={withdrawableValueText}
              />
              {showStakeEarlyAmount && (
                <RewardsSingleItem label="Staked rewards" tip="" value={stakeEarlyAmountText} />
              )}
            </Flex>
            {showLastReleaseModule && (
              <Flex
                className="rounded-xl p-6 bg-[#F9FCFF] border-solid border-[1px] border-[#F4F9FE]"
                gap={16}
                vertical
              >
                <RewardsSingleItem
                  label="Next rewards release"
                  value={isAllReleased ? 'All released' : releaseTime}
                />
                {!isAllReleased && (
                  <RewardsSingleItem
                    label="Next release amount"
                    value={isAllReleased ? '0' : releaseAmountText}
                  />
                )}
              </Flex>
            )}
          </div>
          <FaqList type="rewards" />
          <ConfirmModal
            type={confirmModalType}
            content={confirmModalContent}
            errorTip={confirmModalErrorTip}
            status={confirmModalStatus}
            loading={confirmModalLoading}
            visible={confirmModalVisible}
            onClose={confirmModalOnClose}
            onConfirm={() => {
              confirmModalOnConfirm();
            }}
            transactionId={confirmModalTransactionId}
          />
        </Flex>
      )}
    </>
  );
}
