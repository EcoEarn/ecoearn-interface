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
import { formatTokenPrice, formatUSDPrice } from 'utils/format';
import BigNumber from 'bignumber.js';
import { ConfirmModalTypeEnum, IWithDrawContent } from 'components/ConfirmModal';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { useWalletService } from 'hooks/useWallet';
import useLoading from 'hooks/useLoading';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { divDecimals, getTargetUnlockTimeStamp } from 'utils/calculate';
import dayjs from 'dayjs';
import { useInterval } from 'ahooks';
import MiningRewardsModal from 'components/MiningRewardsModal';
import { ZERO } from 'constants/index';
import { getRawTransaction } from 'utils/getRawTransaction';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { earlyStake as earlyStakeApi } from 'api/request';
import { ISendResult } from 'types';
import getBalanceTip from 'utils/stake';
import { getTxResult } from 'utils/aelfUtils';
import { matchErrorMsg } from 'utils/formatError';
import { message } from 'antd';

const stakeEarlyErrorTip =
  'Stake has expired, cannot be added stake. Please renew the staking first.';
const noStakeAmountTip =
  'No amount available for staking. Please check "Details" for more information.';

const withdrawDisabledTip = 'No withdrawable rewards. You can view "Details" for more information.';

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
  const [confirmModalErrorTip, setConfirmModalErrorTip] = useState('');
  const [confirmModalType, setConfirmModalType] = useState<ConfirmModalTypeEnum>();
  const [curTrigger, setCurTrigger] = useState<'pointsWithdraw' | 'tokenWithdraw' | 'LPWithdraw'>();
  const { isLogin } = useGetLoginStatus();
  const { wallet, walletType } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const { curChain, caContractAddress, rewardsContractAddress } = useGetCmsInfo() || {};
  const config = useGetCmsInfo();
  const rewardsDetailModal = useModal(MiningRewardsModal);

  const earlyStakedPoolIsUnLock = useMemo(() => {
    if (earlyStakeData?.staked && !BigNumber(earlyStakeData?.staked).isZero()) {
      return dayjs(earlyStakeData?.unlockTime).isBefore(dayjs());
    } else {
      return false;
    }
  }, [earlyStakeData?.staked, earlyStakeData?.unlockTime]);

  const pointsEarlyStakeNotEnough = useMemo(() => {
    const { frozen, withdrawable } = data?.pointsPoolAgg || {};
    return divDecimals(
      ZERO.plus(frozen || 0).plus(withdrawable || 0),
      data?.pointsPoolAgg?.decimal,
    ).lt(10);
  }, [data?.pointsPoolAgg]);

  const pointsEarlyStakeDisabled = useMemo(() => {
    return !earlyStakeData || pointsEarlyStakeNotEnough || earlyStakedPoolIsUnLock;
  }, [earlyStakeData, earlyStakedPoolIsUnLock, pointsEarlyStakeNotEnough]);

  const tokenEarlyStakeNotEnough = useMemo(() => {
    const { frozen, withdrawable } = data?.tokenPoolAgg || {};
    return divDecimals(
      ZERO.plus(frozen || 0).plus(withdrawable || 0),
      data?.tokenPoolAgg?.decimal,
    ).lt(10);
  }, [data?.tokenPoolAgg]);

  const tokenEarlyStakeDisabled = useMemo(() => {
    return !earlyStakeData || tokenEarlyStakeNotEnough || earlyStakedPoolIsUnLock;
  }, [earlyStakeData, earlyStakedPoolIsUnLock, tokenEarlyStakeNotEnough]);

  const lpEarlyStakeNotEnough = useMemo(() => {
    const { frozen, withdrawable } = data?.lpPoolAgg || {};
    return divDecimals(ZERO.plus(frozen || 0).plus(withdrawable || 0), data?.lpPoolAgg?.decimal).lt(
      10,
    );
  }, [data?.lpPoolAgg]);

  const lpEarlyStakeDisabled = useMemo(() => {
    return !earlyStakeData || lpEarlyStakeNotEnough || earlyStakedPoolIsUnLock;
  }, [earlyStakeData, earlyStakedPoolIsUnLock, lpEarlyStakeNotEnough]);

  const fetchData = useCallback(
    async (props?: { needLoading?: boolean }) => {
      const { needLoading = true } = props || {};
      if (!isLogin) return;
      needLoading && showLoading();
      try {
        const data = await getPoolRewards({ address: wallet.address || '' });
        if (data) {
          setData(data);
          try {
            needLoading && showLoading();
            const earlyStakeData = await getEarlyStakeInfo({
              tokenName: data?.pointsPoolAgg?.rewardsTokenName,
              address: wallet.address || '',
              chainId: curChain!,
              rate: 0,
              poolType: PoolType.TOKEN,
            });
            needLoading && closeLoading();
            if (earlyStakeData) {
              const fixedEarlyStakeData = {
                ...earlyStakeData,
                unlockTime: getTargetUnlockTimeStamp(
                  earlyStakeData?.stakingPeriod || 0,
                  earlyStakeData?.lastOperationTime || 0,
                  earlyStakeData?.unlockWindowDuration || 0,
                ).unlockTime,
              };
              setEarlyStakeData(fixedEarlyStakeData);
            }
          } catch (error) {
            console.error('getEarlyStakeInfo error', error);
          } finally {
            needLoading && closeLoading();
          }
        }
      } catch (error) {
        console.error('getPoolRewards error', error);
      } finally {
        needLoading && closeLoading();
      }
    },
    [closeLoading, curChain, isLogin, showLoading, wallet.address],
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

  const getEarlyStakeAmount = useCallback(
    (type: PoolType) => {
      const { pointsPoolAgg, tokenPoolAgg, lpPoolAgg } = data || {};
      if (type === PoolType.POINTS) {
        return ZERO.plus(pointsPoolAgg?.frozen || 0)
          .plus(pointsPoolAgg?.withdrawable || 0)
          .toString();
      } else if (type === PoolType.TOKEN) {
        return ZERO.plus(tokenPoolAgg?.frozen || 0)
          .plus(tokenPoolAgg?.withdrawable || 0)
          .toString();
      } else {
        return ZERO.plus(lpPoolAgg?.frozen || 0)
          .plus(lpPoolAgg?.withdrawable || 0)
          .toString();
      }
    },
    [data],
  );

  const getClaimInfos = useCallback(
    (type: PoolType) => {
      const claimInfos =
        (type === PoolType.POINTS
          ? data?.pointsPoolAgg?.claimInfos
          : type === PoolType.TOKEN
          ? data?.tokenPoolAgg?.claimInfos
          : data?.lpPoolAgg?.claimInfos) || [];
      const withdrawClaimInfos =
        (type === PoolType.POINTS
          ? data?.pointsPoolAgg?.withdrawableClaimInfos
          : type === PoolType.TOKEN
          ? data?.tokenPoolAgg?.withdrawableClaimInfos
          : data?.lpPoolAgg?.withdrawableClaimInfos) || [];
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
    },
    [
      data?.lpPoolAgg?.claimInfos,
      data?.lpPoolAgg?.withdrawableClaimInfos,
      data?.pointsPoolAgg?.claimInfos,
      data?.pointsPoolAgg?.withdrawableClaimInfos,
      data?.tokenPoolAgg?.claimInfos,
      data?.tokenPoolAgg?.withdrawableClaimInfos,
    ],
  );

  const getFreeAmount = useCallback(
    (type: PoolType) => {
      return type === PoolType.POINTS
        ? ZERO.plus(data?.pointsPoolAgg?.frozen || 0)
            .plus(data?.pointsPoolAgg?.withdrawable || 0)
            .toString()
        : type === PoolType.TOKEN
        ? ZERO.plus(data?.tokenPoolAgg?.frozen || 0)
            .plus(data?.tokenPoolAgg?.withdrawable || 0)
            .toString()
        : ZERO.plus(data?.lpPoolAgg?.frozen || 0)
            .plus(data?.lpPoolAgg?.withdrawable || 0)
            .toString();
    },
    [
      data?.lpPoolAgg?.frozen,
      data?.lpPoolAgg?.withdrawable,
      data?.pointsPoolAgg?.frozen,
      data?.pointsPoolAgg?.withdrawable,
      data?.tokenPoolAgg?.frozen,
      data?.tokenPoolAgg?.withdrawable,
    ],
  );

  const getLongestReleaseTime = useCallback(
    (type: PoolType) => {
      const { pointsPoolAgg, lpPoolAgg, tokenPoolAgg } = data || {};
      if (type === PoolType.POINTS) {
        const { claimInfos } = pointsPoolAgg || {};
        return claimInfos && claimInfos?.length > 0
          ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
          : 0;
      } else if (type === PoolType.TOKEN) {
        const { claimInfos } = tokenPoolAgg || {};
        return claimInfos && claimInfos?.length > 0
          ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
          : 0;
      } else {
        const { claimInfos } = lpPoolAgg || {};
        return claimInfos && claimInfos?.length > 0
          ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
          : 0;
      }
    },
    [data],
  );

  const earlyStake = useCallback(
    async (type: PoolType) => {
      try {
        const claimInfos = getClaimInfos(type)?.claimInfos || [];
        const claimIds = getClaimInfos(type)?.claimIds || [];
        const hasHistoryStake = !BigNumber(earlyStakeData?.staked || 0).isZero();
        console.log('earlyStakeData', earlyStakeData);
        stakeModal.show({
          isStakeRewards: true,
          isFreezeAmount: true,
          isEarlyStake: true,
          type: hasHistoryStake ? StakeType.ADD : StakeType.STAKE,
          balanceDec: getBalanceTip(type),
          freezeAmount: getFreeAmount(type),
          earlyAmount: hasHistoryStake
            ? BigNumber(earlyStakeData?.staked || 0).toNumber()
            : undefined,
          stakeData: {
            ...earlyStakeData,
            stakeInfos: earlyStakeData?.subStakeInfos,
            longestReleaseTime: getLongestReleaseTime(type) || 0,
          },
          onStake: async (amount, period = 0, poolId) => {
            // const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
            const periodInSeconds = 15 * 60;
            const stakeAmount = getEarlyStakeAmount(type);
            const signParams = {
              amount: Number(stakeAmount),
              poolType: type,
              address: wallet.address,
              dappId: data?.dappId || '',
              period: periodInSeconds,
              poolId: earlyStakeData?.poolId || '',
              claimInfos,
            };
            const { signature, seed, expirationTime } = await earlyStakeSign(signParams);
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
                      account: wallet.address,
                      amount: stakeAmount,
                      seed,
                      poolId: earlyStakeData?.poolId || '',
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
      data?.dappId,
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
        data?.pointsPoolAgg?.withdrawable || 0,
        data?.pointsPoolAgg?.decimal || 8,
      ).toNumber(),
      data?.pointsPoolAgg?.rewardsTokenName || '',
    );
  }, [
    data?.pointsPoolAgg?.decimal,
    data?.pointsPoolAgg?.rewardsTokenName,
    data?.pointsPoolAgg?.withdrawable,
    initWithdrawModal,
  ]);

  const tokenWithdraw = useCallback(() => {
    setCurTrigger('tokenWithdraw');
    initWithdrawModal(
      divDecimals(
        data?.tokenPoolAgg?.withdrawable || 0,
        data?.tokenPoolAgg?.decimal || 8,
      ).toNumber(),
      data?.tokenPoolAgg?.rewardsTokenName || '',
    );
  }, [
    data?.tokenPoolAgg?.decimal,
    data?.tokenPoolAgg?.rewardsTokenName,
    data?.tokenPoolAgg?.withdrawable,
    initWithdrawModal,
  ]);

  const LPWithdraw = useCallback(() => {
    setCurTrigger('LPWithdraw');
    initWithdrawModal(
      divDecimals(data?.lpPoolAgg?.withdrawable || 0, data?.lpPoolAgg?.decimal || 8).toNumber(),
      data?.lpPoolAgg?.rewardsTokenName || '',
    );
  }, [
    data?.lpPoolAgg?.decimal,
    data?.lpPoolAgg?.rewardsTokenName,
    data?.lpPoolAgg?.withdrawable,
    initWithdrawModal,
  ]);

  const withDrawConfirm = useCallback(
    async (poolType: PoolType, amount: string | number) => {
      try {
        showLoading();
        const claimParams = getClaimInfos(poolType);
        const signParams = {
          amount: Number(amount),
          poolType,
          address: wallet.address,
          claimInfos: claimParams?.withdrawClaimInfos || [],
          dappId: data?.dappId || '',
        };
        const { signature, seed, expirationTime } = await withdrawSign(signParams);
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
              account: wallet.address,
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
      }
    },
    [
      caContractAddress,
      closeLoading,
      config,
      curChain,
      data?.dappId,
      getClaimInfos,
      rewardsContractAddress,
      showLoading,
      wallet,
      walletType,
    ],
  );

  const pointsWithdrawConfirm = useCallback(async () => {
    withDrawConfirm(PoolType.POINTS, data?.pointsPoolAgg?.withdrawable || '');
  }, [data?.pointsPoolAgg?.withdrawable, withDrawConfirm]);

  const tokenWithdrawConfirm = useCallback(async () => {
    withDrawConfirm(PoolType.TOKEN, data?.tokenPoolAgg?.withdrawable || '');
  }, [data?.tokenPoolAgg?.withdrawable, withDrawConfirm]);

  const LPWithdrawConfirm = useCallback(async () => {
    withDrawConfirm(PoolType.LP, data?.lpPoolAgg?.withdrawable || '');
  }, [data?.lpPoolAgg?.withdrawable, withDrawConfirm]);

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

  const handleRewardsDetail = useCallback(
    async (type: PoolType) => {
      await fetchData();
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
      } =
        (type === PoolType.POINTS
          ? data?.pointsPoolAgg
          : type === PoolType.TOKEN
          ? data?.tokenPoolAgg
          : data?.lpPoolAgg) || {};
      const isAllReleased = dayjs(claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0).isBefore(
        dayjs(),
      );
      rewardsDetailModal.show({
        symbol: type === PoolType.POINTS ? 'XPSGR' : type === PoolType.TOKEN ? 'SGR' : 'Lp',
        decimal: Number(
          (type === PoolType.POINTS
            ? data?.pointsPoolAgg?.decimal
            : type === PoolType.TOKEN
            ? data?.tokenPoolAgg?.decimal
            : data?.lpPoolAgg?.decimal) || 0,
        ),
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
        earlyStakedPoolIsUnLock,
        isAllReleased,
        allRewardsRelease,
        claimInfos,
        onEarlyStake: () => {
          earlyStake(type);
        },
      });
    },
    [
      data?.lpPoolAgg,
      data?.pointsPoolAgg,
      data?.tokenPoolAgg,
      earlyStake,
      earlyStakedPoolIsUnLock,
      fetchData,
      rewardsDetailModal,
    ],
  );

  const handlePointsDetail = useCallback(() => {
    handleRewardsDetail(PoolType.POINTS);
  }, [handleRewardsDetail]);

  const handleTokenDetail = useCallback(() => {
    handleRewardsDetail(PoolType.TOKEN);
  }, [handleRewardsDetail]);

  const handleLpDetail = useCallback(() => {
    handleRewardsDetail(PoolType.LP);
  }, [handleRewardsDetail]);

  const pointsPoolsAmount = useMemo(() => {
    const { totalRewards, totalRewardsInUsd, decimal, rewardsTokenName } =
      data?.pointsPoolAgg || {};
    return {
      totalRewards: formatTokenPrice(divDecimals(totalRewards, decimal)),
      totalRewardsUsd: formatUSDPrice(divDecimals(totalRewardsInUsd, decimal)),
      rewardsTokenName,
    };
  }, [data?.pointsPoolAgg]);

  const tokenPoolsAmount = useMemo(() => {
    const { totalRewards, totalRewardsInUsd, decimal, rewardsTokenName } = data?.tokenPoolAgg || {};
    return {
      totalRewards: formatTokenPrice(divDecimals(totalRewards, decimal)),
      totalRewardsUsd: formatUSDPrice(divDecimals(totalRewardsInUsd, decimal)),
      rewardsTokenName,
    };
  }, [data?.tokenPoolAgg]);

  const lpPoolsAmount = useMemo(() => {
    const { totalRewards, totalRewardsInUsd, decimal, rewardsTokenName } = data?.lpPoolAgg || {};
    return {
      totalRewards: formatTokenPrice(divDecimals(totalRewards, decimal)),
      totalRewardsUsd: formatUSDPrice(divDecimals(totalRewardsInUsd, decimal)),
      rewardsTokenName,
    };
  }, [data?.lpPoolAgg]);

  const pointsWithdrawDisabled = useMemo(() => {
    return BigNumber(data?.pointsPoolAgg?.withdrawable || 0).isZero();
  }, [data?.pointsPoolAgg?.withdrawable]);

  const pointsWithdrawTip = useMemo(() => {
    return pointsWithdrawDisabled ? withdrawDisabledTip : '';
  }, [pointsWithdrawDisabled]);

  const tokenWithdrawDisabled = useMemo(() => {
    return BigNumber(data?.tokenPoolAgg?.withdrawable || 0).isZero();
  }, [data?.tokenPoolAgg?.withdrawable]);

  const tokenWithdrawTip = useMemo(() => {
    return tokenWithdrawDisabled ? withdrawDisabledTip : '';
  }, [tokenWithdrawDisabled]);

  const lpWithdrawDisabled = useMemo(() => {
    return BigNumber(data?.lpPoolAgg?.withdrawable || 0).isZero();
  }, [data?.lpPoolAgg?.withdrawable]);

  const lpWithdrawTip = useMemo(() => {
    return lpWithdrawDisabled ? withdrawDisabledTip : '';
  }, [lpWithdrawDisabled]);

  const pointsStakeDisabledTip = useMemo(() => {
    const { frozen, withdrawable, rewardsTokenName } = data?.pointsPoolAgg || {};
    return pointsEarlyStakeNotEnough
      ? BigNumber(ZERO.plus(frozen || 0).plus(withdrawable || 0)).gt(ZERO)
        ? `Min staking 10 ${rewardsTokenName}`
        : noStakeAmountTip
      : earlyStakedPoolIsUnLock
      ? stakeEarlyErrorTip
      : undefined;
  }, [data?.pointsPoolAgg, earlyStakedPoolIsUnLock, pointsEarlyStakeNotEnough]);

  const tokenStakeDisabledTip = useMemo(() => {
    const { frozen, withdrawable, rewardsTokenName } = data?.tokenPoolAgg || {};
    return tokenEarlyStakeNotEnough
      ? BigNumber(ZERO.plus(frozen || 0).plus(withdrawable || 0)).gt(ZERO)
        ? `Min staking 10 ${rewardsTokenName}`
        : noStakeAmountTip
      : earlyStakedPoolIsUnLock
      ? stakeEarlyErrorTip
      : undefined;
  }, [data?.tokenPoolAgg, earlyStakedPoolIsUnLock, tokenEarlyStakeNotEnough]);

  const lpStakeDisabledTip = useMemo(() => {
    const { frozen, withdrawable, rewardsTokenName } = data?.lpPoolAgg || {};
    return lpEarlyStakeNotEnough
      ? BigNumber(ZERO.plus(frozen || 0).plus(withdrawable || 0)).gt(ZERO)
        ? `Min staking 10 ${rewardsTokenName}`
        : noStakeAmountTip
      : earlyStakedPoolIsUnLock
      ? stakeEarlyErrorTip
      : undefined;
  }, [data?.lpPoolAgg, earlyStakedPoolIsUnLock, lpEarlyStakeNotEnough]);

  return {
    data,
    earlyStake,
    pointsWithdraw,
    tokenWithdraw,
    LPWithdraw,
    pointsPoolsAmount,
    tokenPoolsAmount,
    lpPoolsAmount,
    confirmModalContent,
    confirmModalErrorTip,
    confirmModalLoading,
    confirmModalOnClose,
    confirmModalOnConfirm,
    confirmModalStatus,
    confirmModalTransactionId,
    confirmModalVisible,
    confirmModalType,
    pointsEarlyStakeDisabled,
    tokenEarlyStakeDisabled,
    lpEarlyStakeDisabled,
    fetchData,
    handleLpDetail,
    handlePointsDetail,
    handleTokenDetail,
    tokenStakeDisabledTip,
    pointsStakeDisabledTip,
    lpStakeDisabledTip,
    pointsWithdrawDisabled,
    tokenWithdrawDisabled,
    lpWithdrawDisabled,
    pointsWithdrawTip,
    tokenWithdrawTip,
    lpWithdrawTip,
  };
}
