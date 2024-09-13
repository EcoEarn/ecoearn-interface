import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import { Flex, message } from 'antd';
import FaqList from 'components/FaqList';
import StakeTokenTitle from 'components/StakeTokenTitle';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RewardsTotalItem from './components/RewardsTotalItem';
import { Button, ToolTip } from 'aelf-design';
import RewardsSingleItem from './components/RewardsSingleItem';
import {
  cancelSign,
  fetchStakingPoolsData,
  getEarlyStakeInfo,
  getPoolRewards,
  withdraw,
  withdrawSign,
} from 'api/request';
import { PoolType } from 'types/stake';
import useLoading from 'hooks/useLoading';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { divDecimals, getTargetUnlockTimeStamp } from 'utils/calculate';
import { fixEarlyStakeData } from 'utils/stake';
import { formatTokenPrice, formatTokenSymbol } from 'utils/format';
import BigNumber from 'bignumber.js';
import { DEFAULT_DATE_FORMAT, ZERO } from 'constants/index';
import useStakeConfig from 'hooks/useStakeConfig';
import dayjs from 'dayjs';
import ConfirmModal, { ConfirmModalTypeEnum, IWithDrawContent } from 'components/ConfirmModal';
import { useInterval } from 'ahooks';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { getRawTransaction } from 'utils/getRawTransaction';
import { getTxResult } from 'utils/aelfUtils';
import { matchErrorMsg } from 'utils/formatError';
import useResponsive from 'utils/useResponsive';

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
  const { min } = useStakeConfig();
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

  const poolId = useMemo(() => {
    return searchParams.get('poolId') || '';
  }, [searchParams]);

  const poolType = useMemo(() => {
    return searchParams.get('poolType') || '';
  }, [searchParams]);

  const initRewardsData = useCallback(async () => {
    if (!walletInfo?.address || !poolId || !poolType || poolType !== PoolType.TOKEN) return;
    try {
      showLoading();
      const rewardsList = await getPoolRewards({
        address: walletInfo?.address || '',
        poolType: PoolType.ALL,
      });
      if (rewardsList && rewardsList?.length > 0) {
        const rewardsData = rewardsList?.find(
          (item) => item.poolId === poolId && item.poolType === poolType,
        );
        if (rewardsData) setRewardsInfo(rewardsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      closeLoading();
    }
  }, [closeLoading, poolId, poolType, showLoading, walletInfo?.address]);

  const initPoolData = useCallback(async () => {
    if (!curChain || !poolId || !poolType || poolType !== PoolType.TOKEN) {
      return;
    }
    try {
      showLoading();
      const { pools } = await fetchStakingPoolsData({
        poolType: poolType == PoolType.TOKEN ? 'Token' : 'Lp',
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
      message.error((error as Error)?.message);
    } finally {
      closeLoading();
    }
  }, [closeLoading, curChain, poolId, poolType, showLoading, walletInfo?.address]);

  const initEarlyStakeInfo = useCallback(async () => {
    if (!rewardsInfo || !walletInfo?.address || !curChain) return;
    try {
      showLoading();
      const earlyStakeInfoList = await getEarlyStakeInfo({
        tokenName: rewardsInfo?.rewardsTokenName,
        address: walletInfo?.address || '',
        chainId: curChain,
        poolType,
        rate: rewardsInfo?.rate || 0,
      });
      if (earlyStakeInfoList) {
        const fixedEarlyStakeData = (
          fixEarlyStakeData(earlyStakeInfoList) as Array<IEarlyStakeInfo>
        )?.[0];
        if (fixedEarlyStakeData) setEarlyStakeInfo(fixedEarlyStakeData);
      }
    } catch (err) {
      message.error((err as Error)?.message);
      console.error(err);
    } finally {
      closeLoading();
    }
  }, [closeLoading, curChain, poolType, rewardsInfo, showLoading, walletInfo?.address]);

  useEffect(() => {
    initRewardsData();
  }, [initRewardsData]);

  useEffect(() => {
    initEarlyStakeInfo();
  }, [initEarlyStakeInfo]);

  useEffect(() => {
    initPoolData();
  }, [initPoolData]);

  useEffect(() => {
    if (!poolId || !poolType || poolType !== PoolType.TOKEN) {
      router.replace('/');
    }
  }, [poolId, poolType, router]);

  useInterval(
    () => {
      initRewardsData();
      initPoolData();
      initEarlyStakeInfo();
    },
    30000,
    { immediate: false },
  );

  // useEffect(() => {
  //   if (!isConnected) {
  //     router.push('/');
  //   }
  // });

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

  const stakeEarlyAmountNotEnough = useMemo(() => {
    return ZERO.plus(stakeEarlyTotal).lte(min);
  }, [min, stakeEarlyTotal]);

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
        : `Please stake no less than ${min} ${formatRewardsSymbol}`
      : earlyStakePoolIsUnlock
      ? 'Staking has expired, additional reward staking is not possible. Please renew first.'
      : '';
  }, [
    isConnected,
    stakeEarlyAmountNotEnough,
    stakeEarlyTotal,
    min,
    formatRewardsSymbol,
    earlyStakePoolIsUnlock,
  ]);

  const withdrawAmountNotEnough = useMemo(() => {
    return BigNumber(rewardsData?.withdrawable || 0).isZero();
  }, [rewardsData?.withdrawable]);

  const withdrawDisabled = useMemo(() => {
    return !isConnected || withdrawAmountNotEnough;
  }, [isConnected, withdrawAmountNotEnough]);

  const claimInfos = useMemo(() => {
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
      setConfirmModalVisible(true);
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

  const onWithdraw = useCallback(() => {
    const { withdrawable, decimal, rewardsTokenName } = rewardsData || {};
    initWithdrawModal(
      divDecimals(withdrawable || 0, decimal || 8).toNumber(),
      rewardsTokenName || '',
    );
  }, [initWithdrawModal, rewardsData]);

  const onWithDrawConfirm = useCallback(async () => {
    const data = rewardsInfo;
    if (!data) return;
    const { withdrawable: amount } = data?.rewardsInfo || {};
    try {
      setConfirmModalLoading(true);
      showLoading();
      const claimParams = claimInfos;
      const signParams: IWithdrawSignParams = {
        amount: Number(amount || 0),
        poolType: data?.poolType,
        address: walletInfo?.address || '',
        claimInfos: claimParams?.withdrawableClaimInfos || [],
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
    claimInfos,
    closeLoading,
    config,
    curChain,
    rewardsContractAddress,
    rewardsInfo,
    showLoading,
    walletInfo,
    walletType,
  ]);

  const confirmModalOnConfirm = useCallback(
    async (type: 'earlyStake' | 'withdraw' = 'withdraw') => {
      if (type === 'withdraw') {
        await onWithDrawConfirm();
      }
    },
    [onWithDrawConfirm],
  );

  return (
    <Flex vertical gap={24} className="max-w-[677px] mx-auto mt-6 md:mt-[64px]">
      <div className="bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder flex flex-col gap-6">
        <StakeTokenTitle
          img={poolInfo?.icons?.[0] || ''}
          tokenSymbol={poolInfo?.stakeSymbol || ''}
          type="rewards"
        />
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
            tip="Rewards that have reached the release point."
            amount={rewardsData?.withdrawn || '0'}
            amountUsd={rewardsData?.withdrawnInUsd || '0'}
            decimal={Number(rewardsData?.decimal || 8)}
            tokenSymbol={rewardsInfo?.rewardsTokenName || ''}
          />
        </Flex>
        <Flex gap={isMD ? 8 : 24}>
          {/* {poolInfo?.supportEarlyStake && (
            <ToolTip title={stakeEarlyTip}>
              <Button type="primary" className="!rounded-lg flex-1" disabled={stakeEarlyDisabled}>
                Stake Rewards
              </Button>
            </ToolTip>
          )} */}
          <ToolTip title={withdrawTip}>
            <Button
              onClick={onWithdraw}
              type="primary"
              ghost={poolInfo?.supportEarlyStake}
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
          <RewardsSingleItem label="Staked rewards" tip="" value={stakeEarlyAmountText} />
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
            <RewardsSingleItem
              label="Next release amount"
              value={isAllReleased ? '0' : releaseAmountText}
            />
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
  );
}
