import {
  cancelSign,
  earlyStakeSign,
  getEarlyStakeInfo,
  getPoolRewards,
  withdraw,
  withdrawSign,
} from 'api/request';
import { useCallback, useEffect, useMemo, useState } from 'react';
import StakeModal from 'components/StakeModalWithConfirm';
import { useModal } from '@ebay/nice-modal-react';
import { PoolType, StakeType } from 'types/stake';
import { formatTokenPrice, formatTokenSymbol, formatUSDPrice } from 'utils/format';
import BigNumber from 'bignumber.js';
import { ConfirmModalTypeEnum, IWithDrawContent } from 'components/ConfirmModal';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { useWalletService } from 'hooks/useWallet';
import useLoading from 'hooks/useLoading';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { divDecimals } from 'utils/calculate';
import dayjs from 'dayjs';
import { useInterval } from 'ahooks';
import MiningRewardsModal from 'components/MiningRewardsModal';
import { ZERO } from 'constants/index';
import { getRawTransaction } from 'utils/getRawTransaction';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { earlyStake as earlyStakeApi } from 'api/request';
import { ISendResult } from 'types';
import getBalanceTip, { fixEarlyStakeData } from 'utils/stake';
import { getTxResult } from 'utils/aelfUtils';
import { matchErrorMsg } from 'utils/formatError';
import { message } from 'antd';
import useStakeConfig from 'hooks/useStakeConfig';
import { RewardsTypeEnum } from '..';
import { useRouter } from 'next/navigation';

const stakeEarlyErrorTip =
  'Stake has expired, cannot be added stake. Please renew the staking first.';
const noStakeAmountTip =
  'No amount available for staking. Please check "Details" for more information.';

const withdrawDisabledTip = 'No withdrawable rewards. You can view "Details" for more information.';

export interface IRewardsListDataSource extends IPoolRewardsItem {
  earlyStakeDisabled: boolean;
  earlyStakeTip: string;
  withdrawDisabled: boolean;
  withdrawTip: string;
  amount: any;
}

export default function useRewardsAggregation({ currentType }: { currentType: RewardsTypeEnum }) {
  const [data, setData] = useState<Array<IPoolRewardsItem>>();
  const [earlyStakeData, setEarlyStakeData] = useState<Array<IEarlyStakeInfo>>();
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
  const { isLogin } = useGetLoginStatus();
  const { wallet, walletType } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const { curChain, caContractAddress, rewardsContractAddress } = useGetCmsInfo() || {};
  const config = useGetCmsInfo();
  const rewardsDetailModal = useModal(MiningRewardsModal);
  const { min } = useStakeConfig();
  const [curItem, setCurItem] = useState<IRewardsListDataSource>();
  const router = useRouter();

  const poolType = useMemo(() => {
    if (currentType === RewardsTypeEnum.Points) return PoolType.POINTS;
    else if (currentType === RewardsTypeEnum.Simple) return PoolType.TOKEN;
    else if (currentType === RewardsTypeEnum.Farms) return PoolType.LP;
    else return PoolType.ALL;
  }, [currentType]);

  const fetchData = useCallback(
    async (props?: { needLoading?: boolean }) => {
      const { needLoading = true } = props || {};
      if (!isLogin || !curChain) return;
      needLoading && showLoading();
      try {
        const data = await getPoolRewards({
          address: wallet?.address || '',
          poolType,
        });
        if (data && data?.length > 0) {
          setData(data);
          try {
            const earlyStakeData = await getEarlyStakeInfo({
              tokenName: '',
              address: wallet?.address || '',
              chainId: curChain!,
              rate: 0,
              poolType: PoolType.TOKEN,
            });
            needLoading && closeLoading();
            const fixedEarlyStakeData = fixEarlyStakeData(
              earlyStakeData || [],
            ) as Array<IEarlyStakeInfo>;
            setEarlyStakeData(fixedEarlyStakeData);
          } catch (error) {
            console.error('getEarlyStakeInfo error', error);
          } finally {
            needLoading && closeLoading();
          }
        } else {
          setData([]);
        }
        closeLoading();
      } catch (error) {
        console.error('getPoolRewards error', error);
      } finally {
        needLoading && closeLoading();
      }
    },
    [closeLoading, curChain, isLogin, poolType, showLoading, wallet?.address],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useInterval(
    () => {
      fetchData({ needLoading: false });
    },
    30000,
    { immediate: false },
  );

  const confirmModalOnClose = useCallback(() => {
    setConfirmModalVisible(false);
    setConfirmModalContent(undefined);
    setConfirmModalLoading(false);
    setConfirmModalStatus('normal');
    setConfirmModalTransactionId('');
    setConfirmModalType(undefined);
    fetchData();
  }, [fetchData]);

  const getEarlyStakeAmount = useCallback((data: IRewardsListDataSource) => {
    const { frozen, withdrawable } = data?.rewardsInfo || {};
    return ZERO.plus(frozen || 0)
      .plus(withdrawable || 0)
      .toString();
  }, []);

  const getClaimInfos = useCallback((data: IRewardsListDataSource) => {
    const claimInfos = data?.rewardsInfo?.claimInfos || [];
    const withdrawClaimInfos = data?.rewardsInfo?.withdrawableClaimInfos || [];
    const claimIds = claimInfos.map((item) => {
      return item.claimId;
    });
    const withdrawClaimIds = withdrawClaimInfos.map((item) => {
      return item.claimId;
    });
    return {
      claimInfos,
      claimIds,
      withdrawClaimInfos,
      withdrawClaimIds,
    };
  }, []);

  const getFreeAmount = useCallback((data: IRewardsListDataSource) => {
    const { frozen, withdrawable } = data?.rewardsInfo || {};
    return ZERO.plus(frozen || 0)
      .plus(withdrawable || 0)
      .toString();
  }, []);

  const getLongestReleaseTime = useCallback((data: IRewardsListDataSource) => {
    const { claimInfos } = data?.rewardsInfo || {};
    return claimInfos && claimInfos?.length > 0
      ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
      : 0;
  }, []);

  const earlyStake = useCallback(
    async (data: IRewardsListDataSource) => {
      try {
        const { claimIds, claimInfos } = getClaimInfos(data);
        const earlyStakePoolData = earlyStakeData?.filter(
          (poolData) => poolData?.earnedSymbol === data?.rewardsTokenName,
        )?.[0];

        const hasHistoryStake = !BigNumber(earlyStakePoolData?.staked || 0).isZero();
        console.log('earlyStakeData', earlyStakePoolData);
        stakeModal.show({
          isStakeRewards: true,
          isFreezeAmount: true,
          isEarlyStake: true,
          type: hasHistoryStake ? StakeType.ADD : StakeType.STAKE,
          balanceDec: getBalanceTip(data?.poolType),
          freezeAmount: getFreeAmount(data),
          earlyAmount: hasHistoryStake
            ? BigNumber(earlyStakePoolData?.staked || 0).toNumber()
            : undefined,
          stakeData: {
            ...earlyStakePoolData,
            stakeInfos: earlyStakePoolData?.subStakeInfos,
            longestReleaseTime: getLongestReleaseTime(data) || 0,
          },
          onStake: async (amount, period = 0, poolId) => {
            // const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
            const periodInSeconds = 5 * 60;
            const stakeAmount = getEarlyStakeAmount(data);
            const signParams: IEarlyStakeSignParams = {
              amount: Number(stakeAmount),
              poolType: data?.poolType,
              address: wallet?.address || '',
              dappId: data?.dappId || '',
              period: periodInSeconds,
              poolId: earlyStakePoolData?.poolId || '',
              claimInfos,
              operationPoolIds: data?.poolType === PoolType.POINTS ? [] : [data?.poolId || ''],
              operationDappIds: data?.poolType === PoolType.POINTS ? [data?.dappId || ''] : [],
            };
            const { signature, seed, expirationTime } = (await earlyStakeSign(signParams)) || {};
            if (!signature || !seed || !expirationTime) throw Error();
            try {
              const rpcUrl = (config as Partial<ICMSInfo>)[
                `rpcUrl${curChain?.toLocaleUpperCase()}`
              ];
              const longestReleaseTime =
                claimInfos && claimInfos?.length > 0
                  ? claimInfos?.[claimInfos?.length - 1]?.releaseTime
                  : 0;
              let rawTransaction = null;
              try {
                rawTransaction = await getRawTransaction({
                  walletInfo: wallet,
                  walletType,
                  caContractAddress: caContractAddress || '',
                  contractAddress: rewardsContractAddress || '',
                  methodName: 'EarlyStake',
                  params: {
                    stakeInput: {
                      claimIds,
                      account: wallet?.address || '',
                      amount: stakeAmount,
                      seed,
                      poolId: earlyStakePoolData?.poolId || '',
                      expirationTime,
                      period: periodInSeconds,
                      dappId: data?.dappId || '',
                      longestReleaseTime: BigNumber(longestReleaseTime).div(1000).dp(0).toNumber(),
                    },
                    signature,
                  },
                  rpcUrl: (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`],
                  chainId: curChain!,
                });
              } catch (error) {
                await cancelSign(signParams);
                throw Error();
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
                const { TransactionId: resultTransactionId } = await getTxResult(
                  TransactionId,
                  rpcUrl,
                  curChain!,
                );
                if (resultTransactionId) {
                  return { TransactionId: resultTransactionId } as ISendResult;
                } else {
                  throw Error();
                }
              } else {
                const { showInModal, matchedErrorMsg } = matchErrorMsg(errorMessage, 'EarlyStake');
                if (!showInModal) message.error(matchedErrorMsg);
                throw Error(showInModal ? matchedErrorMsg : '');
              }
            } catch (error) {
              throw Error((error as Error).message);
            }
          },
          onSuccess: () => {
            fetchData();
          },
        });
      } catch (error) {
        console.error('earlyStake error', error);
      } finally {
        closeLoading();
      }
    },
    [
      caContractAddress,
      closeLoading,
      config,
      curChain,
      earlyStakeData,
      fetchData,
      getClaimInfos,
      getEarlyStakeAmount,
      getFreeAmount,
      getLongestReleaseTime,
      rewardsContractAddress,
      stakeModal,
      wallet,
      walletType,
    ],
  );

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
      setConfirmModalVisible(true);
    },
    [initModalState],
  );

  const onWithdraw = useCallback(
    (data: IRewardsListDataSource) => {
      setCurItem(data);
      const { withdrawable, decimal, rewardsTokenName } = data?.rewardsInfo || {};
      initWithdrawModal(
        divDecimals(withdrawable || 0, decimal || 8).toNumber(),
        rewardsTokenName || '',
      );
    },
    [initWithdrawModal],
  );

  const onWithDrawConfirm = useCallback(async () => {
    const data = curItem;
    if (!data) return;
    const { withdrawable: amount } = data?.rewardsInfo || {};
    try {
      setConfirmModalLoading(true);
      showLoading();
      const claimParams = getClaimInfos(data);
      const signParams: IWithdrawSignParams = {
        amount: Number(amount || 0),
        poolType: data?.poolType,
        address: wallet?.address || '',
        claimInfos: claimParams?.withdrawClaimInfos || [],
        dappId: data?.dappId || '',
        operationPoolIds: data?.poolType === PoolType.POINTS ? [] : [data?.poolId || ''],
        operationDappIds: data?.poolType === PoolType.POINTS ? [data?.dappId || ''] : [],
      };
      const { signature, seed, expirationTime } = (await withdrawSign(signParams)) || {};
      if (!signature || !seed || !expirationTime) throw Error();
      const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`];
      let rawTransaction = null;
      try {
        rawTransaction = await getRawTransaction({
          walletInfo: wallet,
          walletType,
          caContractAddress: caContractAddress || '',
          contractAddress: rewardsContractAddress || '',
          methodName: 'Withdraw',
          params: {
            claimIds: claimParams?.withdrawClaimIds || [],
            account: wallet?.address || '',
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
        throw Error();
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
        const { TransactionId: resultTransactionId } = await getTxResult(
          TransactionId,
          rpcUrl,
          curChain!,
        );
        if (resultTransactionId) {
          setConfirmModalTransactionId(resultTransactionId);
          setConfirmModalStatus('success');
        } else {
          throw Error();
        }
      } else {
        const { showInModal, matchedErrorMsg } = matchErrorMsg(errorMessage, 'Withdraw');
        if (!showInModal) message.error(matchedErrorMsg);
        throw Error(showInModal ? matchedErrorMsg : '');
      }
    } catch (error) {
      const errorTip = (error as Error).message;
      console.error('WithDraw error', errorTip);
      setConfirmModalTransactionId('');
      errorTip && setConfirmModalErrorTip(errorTip);
      setConfirmModalStatus('error');
    } finally {
      closeLoading();
      setConfirmModalLoading(false);
    }
  }, [
    caContractAddress,
    closeLoading,
    config,
    curChain,
    curItem,
    getClaimInfos,
    rewardsContractAddress,
    showLoading,
    wallet,
    walletType,
  ]);

  const getRewardsAmount = useCallback((rewardsItem: IPoolRewardsItem) => {
    const { totalRewards, totalRewardsInUsd, decimal, rewardsTokenName } =
      rewardsItem?.rewardsInfo || {};
    return {
      totalRewards: formatTokenPrice(divDecimals(totalRewards, decimal)),
      totalRewardsUsd: formatUSDPrice(divDecimals(totalRewardsInUsd, decimal)),
      rewardsTokenName: formatTokenSymbol(rewardsTokenName || ''),
    };
  }, []);

  const isWithdrawDisabled = useCallback((rewardsItem: IPoolRewardsItem) => {
    const { withdrawable } = rewardsItem?.rewardsInfo || {};
    return BigNumber(withdrawable || 0).isZero();
  }, []);

  const getWithdrawTip = useCallback((isWithdrawDisabled: boolean) => {
    return isWithdrawDisabled ? withdrawDisabledTip : '';
  }, []);

  const getEarlyStakeTip = useCallback(
    ({
      isAmountEnough,
      isPoolUnlocked,
      rewardsItem,
    }: {
      isAmountEnough: boolean;
      isPoolUnlocked: boolean;
      rewardsItem: IPoolRewardsItem;
    }) => {
      const { frozen, withdrawable, rewardsTokenName } = rewardsItem?.rewardsInfo || {};
      return !isAmountEnough
        ? BigNumber(ZERO.plus(frozen || 0).plus(withdrawable || 0)).gt(ZERO)
          ? `Min staking ${min} ${formatTokenSymbol(rewardsTokenName || '')}`
          : noStakeAmountTip
        : isPoolUnlocked
        ? stakeEarlyErrorTip
        : '';
    },
    [min],
  );

  const isEarlyStakeAmountNotEnough = useCallback(
    (rewardsItem: IPoolRewardsItem) => {
      const { frozen, withdrawable, decimal } = rewardsItem?.rewardsInfo || {};
      return divDecimals(ZERO.plus(frozen || 0).plus(withdrawable || 0), decimal).lt(min);
    },
    [min],
  );

  const isEarlyStakePoolIsUnlock = useCallback((earlyStakeData?: IEarlyStakeInfo) => {
    if (earlyStakeData?.staked && !BigNumber(earlyStakeData?.staked).isZero()) {
      return dayjs(earlyStakeData?.unlockTime).isBefore(dayjs());
    } else {
      return false;
    }
  }, []);

  const dataSource: Array<IRewardsListDataSource> = useMemo(() => {
    return (data || []).map((rewardsItem) => {
      const earlyStakePoolData = earlyStakeData?.filter(
        (data) => data?.earnedSymbol === rewardsItem?.rewardsTokenName,
      )?.[0];
      const earlyStakeAmountNotEnough = isEarlyStakeAmountNotEnough(rewardsItem);
      const earlyStakePoolIsUnlock = isEarlyStakePoolIsUnlock(earlyStakePoolData);
      const withdrawDisabled = isWithdrawDisabled(rewardsItem);
      return {
        ...rewardsItem,
        earlyStakeDisabled:
          !earlyStakePoolData || earlyStakeAmountNotEnough || earlyStakePoolIsUnlock,
        earlyStakeTip: getEarlyStakeTip({
          isAmountEnough: !earlyStakeAmountNotEnough,
          isPoolUnlocked: earlyStakePoolIsUnlock,
          rewardsItem,
        }),
        withdrawDisabled,
        withdrawTip: getWithdrawTip(withdrawDisabled),
        amount: getRewardsAmount(rewardsItem),
      };
    });
  }, [
    data,
    earlyStakeData,
    getEarlyStakeTip,
    getRewardsAmount,
    getWithdrawTip,
    isEarlyStakeAmountNotEnough,
    isEarlyStakePoolIsUnlock,
    isWithdrawDisabled,
  ]);

  const handleDetail = useCallback(
    async (data: IRewardsListDataSource) => {
      await fetchData();
      showLoading();
      const {
        totalRewards,
        totalRewardsInUsd,
        frozen,
        frozenInUsd,
        withdrawable,
        withdrawableInUsd,
        withdrawn,
        withdrawnInUsd,
        nextRewardsRelease,
        nextRewardsReleaseAmount,
        rewardsTokenName,
        earlyStakedAmount,
        earlyStakedAmountInUsd,
        claimInfos,
        allRewardsRelease,
        decimal,
      } = data?.rewardsInfo || {};
      const isAllReleased = dayjs(claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0).isBefore(
        dayjs(),
      );
      const earlyStakePoolData = earlyStakeData?.filter(
        (earlyData) => earlyData?.earnedSymbol === data?.rewardsTokenName,
      )?.[0];
      const earlyStakePoolIsUnlock = isEarlyStakePoolIsUnlock(earlyStakePoolData);
      closeLoading();
      rewardsDetailModal.show({
        symbol: data?.poolName,
        decimal: Number(decimal || 8),
        totalAmount: totalRewards,
        totalAmountUsd: totalRewardsInUsd,
        frozenAmount: frozen,
        frozenAmountUsd: frozenInUsd,
        withdrawnAmount: withdrawn,
        withdrawnAmountUsd: withdrawnInUsd,
        claimableAmount: withdrawable,
        claimableAmountUsd: withdrawableInUsd,
        nextReleaseAmount: nextRewardsReleaseAmount,
        rewardsSymbol: rewardsTokenName,
        nextReleaseTime: nextRewardsRelease,
        earlyStakedAmount,
        earlyStakedAmountInUsd,
        earlyStakedPoolIsUnLock: earlyStakePoolIsUnlock,
        isAllReleased,
        allRewardsRelease,
        claimInfos,
        showEarlyStake: data?.supportEarlyStake,
        onEarlyStake: () => {
          earlyStake(data);
        },
      });
    },
    [
      closeLoading,
      earlyStake,
      earlyStakeData,
      fetchData,
      isEarlyStakePoolIsUnlock,
      rewardsDetailModal,
      showLoading,
    ],
  );

  const confirmModalOnConfirm = useCallback(
    async (type: 'earlyStake' | 'withdraw' = 'withdraw') => {
      if (type === 'withdraw') {
        await onWithDrawConfirm();
      }
    },
    [onWithDrawConfirm],
  );

  const onClickEmptyBtn = useCallback(() => {
    if (poolType === PoolType.POINTS) {
      router.push('/');
    } else if (poolType === PoolType.LP) {
      router.push('/farms');
    } else {
      router.push('/simple');
    }
  }, [poolType, router]);

  return {
    data,
    earlyStake,
    confirmModalContent,
    confirmModalErrorTip,
    confirmModalLoading,
    confirmModalOnClose,
    confirmModalStatus,
    confirmModalTransactionId,
    confirmModalVisible,
    confirmModalType,
    fetchData,
    dataSource,
    handleDetail,
    onWithdraw,
    onWithDrawConfirm,
    confirmModalOnConfirm,
    onClickEmptyBtn,
  };
}
