import { getEarlyStakeInfo, getPoolRewards } from 'api/request';
import { useCallback, useEffect, useMemo, useState } from 'react';
import StakeModal from 'components/StakeModalWithConfirm';
import { useModal } from '@ebay/nice-modal-react';
import { StakeType } from 'types/stack';
import { formatTokenPrice, formatUSDPrice } from 'utils/format';
import BigNumber from 'bignumber.js';
import { EarlyStake, Withdraw } from 'contract/pointsStaking';
import { tokenWithdraw as tokenWithdrawContract } from 'contract/tokenStaking';
import { ConfirmModalTypeEnum, IWithDrawContent } from 'components/ConfirmModal';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { useWalletService } from 'hooks/useWallet';
import useLoading from 'hooks/useLoading';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { divDecimals } from 'utils/calculate';
import dayjs from 'dayjs';

export default function useRewardsAggregation() {
  const [data, setData] = useState<IPoolRewardsData>();
  const [earlyStakeData, setEarlyStakeData] = useState<IEarlyStakeInfo>();
  const stakeModal = useModal(StakeModal);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalLoading, setConfirmModalLoading] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState<IWithDrawContent>();
  const [confirmModalStatus, setConfirmModalStatus] = useState<'normal' | 'success' | 'error'>(
    'normal',
  );
  const [confirmModalTransactionId, setConfirmModalTransactionId] = useState<string>('');
  const [confirmModalType, setConfirmModalType] = useState<ConfirmModalTypeEnum>();

  const [curTrigger, setCurTrigger] = useState<'pointsWithdraw' | 'tokenWithdraw' | 'LPWithdraw'>();

  const { isLogin } = useGetLoginStatus();

  const { wallet } = useWalletService();

  const { showLoading, closeLoading } = useLoading();

  const { curChain } = useGetCmsInfo() || {};

  const formatTokenWith2DecimalPlaces = (
    amount: string | number | BigNumber | undefined,
    isUsd?: boolean,
  ) => {
    return isUsd
      ? formatUSDPrice(amount || 0, { decimalPlaces: 2 })
      : formatTokenPrice(amount || 0, { decimalPlaces: 2 });
  };

  const pointsPoolsAmount = useMemo(() => {
    const { total, rewardsTotal, rewardsTotalInUsd, totalInUsd, rewardsTokenName, decimal } =
      data?.pointsPoolAgg || {};
    return {
      stakeTotal: formatTokenWith2DecimalPlaces(divDecimals(total, decimal || 8)),
      stakeTotalUSD: formatTokenWith2DecimalPlaces(divDecimals(totalInUsd, decimal || 8), true),
      rewardsTotal: formatTokenWith2DecimalPlaces(divDecimals(rewardsTotal, decimal || 8)),
      rewardsTotalUSD: formatTokenWith2DecimalPlaces(
        divDecimals(rewardsTotalInUsd, decimal || 8),
        true,
      ),
      rewardsTokenName,
    };
  }, [data?.pointsPoolAgg]);

  const pointsEarlyStakeDisabled = useMemo(() => {
    if (BigNumber(pointsPoolsAmount.stakeTotal || 0).lt(10)) {
      return true;
    }

    if (earlyStakeData?.staked && !BigNumber(earlyStakeData?.staked).isZero()) {
      return dayjs(earlyStakeData?.unlockTime).isBefore(dayjs());
    } else {
      return false;
    }
  }, [earlyStakeData?.staked, earlyStakeData?.unlockTime, pointsPoolsAmount.stakeTotal]);

  const tokenPoolsAmount = useMemo(() => {
    const { rewardsTotal, rewardsTotalInUsd, rewardsTokenName, decimal } = data?.tokenPoolAgg || {};
    return {
      rewardsTotal: formatTokenWith2DecimalPlaces(divDecimals(rewardsTotal, decimal || 8)),
      rewardsTotalUSD: formatTokenWith2DecimalPlaces(
        divDecimals(rewardsTotalInUsd, decimal || 8),
        true,
      ),
      rewardsTokenName,
    };
  }, [data?.tokenPoolAgg]);

  const LpPoolsAmount = useMemo(() => {
    const { rewardsTotal, rewardsTokenName, rewardsTotalInUsd, decimal } = data?.lpPoolAgg || {};
    return {
      rewardsTotal: formatTokenWith2DecimalPlaces(divDecimals(rewardsTotal, decimal || 8)),
      rewardsTotalUSD: formatTokenWith2DecimalPlaces(
        divDecimals(rewardsTotalInUsd, decimal || 8),
        true,
      ),
      rewardsTokenName,
    };
  }, [data?.lpPoolAgg]);

  const fetchData = useCallback(async () => {
    if (!isLogin) return;
    showLoading();
    try {
      const data = await getPoolRewards({ address: wallet.address || '' });
      if (data) {
        setData(data);
        const rewardsTokenName = data?.pointsPoolAgg?.rewardsTokenName || '';
        const stakeTotal = data?.pointsPoolAgg?.total || 0;
        if (rewardsTokenName && !BigNumber(stakeTotal).isZero()) {
          const earlyStakeData = await getEarlyStakeInfo({
            tokenName: rewardsTokenName,
            address: wallet.address || '',
            chainId: curChain!,
          });
          setEarlyStakeData(earlyStakeData || {});
        }
      }
    } catch (error) {
      console.error('getPoolRewards error', error);
    } finally {
      closeLoading();
    }
  }, [closeLoading, curChain, isLogin, showLoading, wallet.address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const confirmModalOnClose = useCallback(() => {
    setConfirmModalVisible(false);
    setConfirmModalContent(undefined);
    setConfirmModalLoading(false);
    setConfirmModalStatus('normal');
    setConfirmModalTransactionId('');
    setConfirmModalType(undefined);
  }, []);

  const pointsState = useCallback(async () => {
    try {
      const hasHistoryStake = !BigNumber(earlyStakeData?.staked || 0).isZero();
      console.log('earlyStakeData', earlyStakeData);
      stakeModal.show({
        isFreezeAmount: true,
        type: hasHistoryStake ? StakeType.ADD : StakeType.STAKE,
        freezeAmount: hasHistoryStake ? earlyStakeData?.staked : undefined,
        stakeData: {
          period: hasHistoryStake ? earlyStakeData?.period : undefined,
          poolId: earlyStakeData?.poolId,
          staked: String(data?.pointsPoolAgg?.total),
          unlockTime: hasHistoryStake ? earlyStakeData?.unlockTime : undefined,
          stakeApr: hasHistoryStake ? earlyStakeData?.stakeApr : undefined,
          stakeSymbol: data?.pointsPoolAgg?.rewardsTokenName,
          yearlyRewards: earlyStakeData?.yearlyRewards,
        },
        onStake: async (amount, period = 0) => {
          const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
          const result = await EarlyStake({
            period: periodInSeconds,
            poolId: earlyStakeData?.poolId || '',
            claimIds: data?.pointsPoolAgg?.stakeClaimIds || [],
          });
          return result;
        },
        onSuccess: () => {
          fetchData();
        },
      });
    } catch (error) {
      console.error('getEarlyStakeInfo error', error);
    } finally {
      closeLoading();
    }
  }, [
    closeLoading,
    data?.pointsPoolAgg?.rewardsTokenName,
    data?.pointsPoolAgg?.stakeClaimIds,
    data?.pointsPoolAgg?.total,
    earlyStakeData,
    fetchData,
    stakeModal,
  ]);

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
        tokenSymbol: symbol,
      });
      setConfirmModalVisible(true);
    },
    [initModalState],
  );

  const pointsWithdraw = useCallback(async () => {
    setCurTrigger('pointsWithdraw');
    initWithdrawModal(
      divDecimals(
        data?.pointsPoolAgg?.rewardsTotal || 0,
        data?.pointsPoolAgg?.decimal || 8,
      ).toNumber(),
      data?.pointsPoolAgg?.rewardsTokenName || '',
    );
  }, [
    data?.pointsPoolAgg?.decimal,
    data?.pointsPoolAgg?.rewardsTokenName,
    data?.pointsPoolAgg?.rewardsTotal,
    initWithdrawModal,
  ]);

  const tokenWithdraw = useCallback(() => {
    setCurTrigger('tokenWithdraw');
    initWithdrawModal(
      divDecimals(
        data?.tokenPoolAgg?.rewardsTotal || 0,
        data?.tokenPoolAgg?.decimal || 8,
      ).toNumber(),
      data?.tokenPoolAgg?.rewardsTokenName || '',
    );
  }, [
    data?.tokenPoolAgg?.decimal,
    data?.tokenPoolAgg?.rewardsTokenName,
    data?.tokenPoolAgg?.rewardsTotal,
    initWithdrawModal,
  ]);

  const LPWithdraw = useCallback(() => {
    setCurTrigger('LPWithdraw');
    initWithdrawModal(
      divDecimals(data?.lpPoolAgg?.rewardsTotal || 0, data?.lpPoolAgg?.decimal || 8).toNumber(),
      data?.lpPoolAgg?.rewardsTokenName || '',
    );
  }, [
    data?.lpPoolAgg?.decimal,
    data?.lpPoolAgg?.rewardsTokenName,
    data?.lpPoolAgg?.rewardsTotal,
    initWithdrawModal,
  ]);

  const pointsWithdrawConfirm = useCallback(async () => {
    try {
      const { TransactionId } = await Withdraw({
        claimIds: data?.pointsPoolAgg?.withDrawClaimIds || [],
      });
      if (TransactionId) {
        setConfirmModalTransactionId(TransactionId);
        setConfirmModalStatus('success');
        fetchData();
      }
    } catch (error) {
      console.error('pointsWithdraw error', error);
      setConfirmModalTransactionId('');
      setConfirmModalStatus('error');
    }
  }, [data?.pointsPoolAgg?.withDrawClaimIds, fetchData]);

  const tokenWithdrawConfirm = useCallback(async () => {
    try {
      const { TransactionId } = await tokenWithdrawContract({
        claimIds: data?.tokenPoolAgg?.withDrawClaimIds || [],
      });
      if (TransactionId) {
        setConfirmModalTransactionId(TransactionId);
        setConfirmModalStatus('success');
        fetchData();
      }
    } catch (error) {
      console.error('pointsWithdraw error', error);
      setConfirmModalTransactionId('');
      setConfirmModalStatus('error');
    }
  }, [data?.tokenPoolAgg?.withDrawClaimIds, fetchData]);

  const LPWithdrawConfirm = useCallback(async () => {
    try {
      const { TransactionId } = await tokenWithdrawContract({
        claimIds: data?.lpPoolAgg?.withDrawClaimIds || [],
      });
      if (TransactionId) {
        setConfirmModalTransactionId(TransactionId);
        setConfirmModalStatus('success');
        fetchData();
      }
    } catch (error) {
      console.error('pointsWithdraw error', error);
      setConfirmModalTransactionId('');
      setConfirmModalStatus('error');
    }
  }, [data?.lpPoolAgg?.withDrawClaimIds, fetchData]);

  const confirmModalOnConfirm = useCallback(async () => {
    setConfirmModalLoading(true);
    if (curTrigger === 'pointsWithdraw') {
      await pointsWithdrawConfirm();
    } else if (curTrigger === 'LPWithdraw') {
      await LPWithdrawConfirm();
    } else {
      await tokenWithdrawConfirm();
    }
    setConfirmModalLoading(false);
  }, [LPWithdrawConfirm, curTrigger, pointsWithdrawConfirm, tokenWithdrawConfirm]);

  return {
    data,
    pointsState,
    pointsWithdraw,
    tokenWithdraw,
    LPWithdraw,
    pointsPoolsAmount,
    tokenPoolsAmount,
    LpPoolsAmount,
    confirmModalContent,
    confirmModalLoading,
    confirmModalOnClose,
    confirmModalOnConfirm,
    confirmModalStatus,
    confirmModalTransactionId,
    confirmModalVisible,
    confirmModalType,
    pointsEarlyStakeDisabled,
  };
}
