import { useModal } from '@ebay/nice-modal-react';
import { useInterval } from 'ahooks';
import {
  fetchStakingPoolsData,
  getEarlyStakeInfo,
  getPoolRewards,
  saveTransaction,
} from 'api/request';
import { GetBalance } from 'contract/multiToken';
import { GetBalance as GetLpBalance } from 'contract/lpToken';
import StakeModalWithConfirm from 'components/StakeModalWithConfirm';
import { ZERO } from 'constants/index';
import { GetReward, Renew, tokenClaim, tokenStake, tokenUnlock } from 'contract/tokenStaking';
import dayjs from 'dayjs';
import useGetAwakenContract, { TFeeType } from 'hooks/useGetAwakenContract';
import useLoading from 'hooks/useLoading';
import { useCheckLoginAndToken, useWalletService } from 'hooks/useWallet';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { PoolType, StakeType, TransactionType } from 'types/stake';
import { checkAllowanceAndApprove } from 'utils/aelfUtils';
import { divDecimals, getTargetUnlockTimeStamp, timesDecimals } from 'utils/calculate';
import { formatTokenSymbol } from 'utils/format';
import useEarlyStake from 'hooks/useEarlyStake';
import { IContractError } from 'types';
import { IStakeWithConfirmProps } from 'components/StakeWithConfirm';
import { fixEarlyStakeData } from 'utils/stake';
import qs from 'qs';
import { store } from 'redux/store';
import { setConfirmInfo } from 'redux/reducer/info';
import { TradeConfirmTypeEnum } from 'components/TradeConfrim';
import useNotification from 'hooks/useNotification';

interface IFetchDataProps {
  withLoading?: boolean;
}

export default function usePoolDetailService() {
  const searchParams = useSearchParams();

  const poolId = useMemo(() => {
    return searchParams.get('poolId') || '';
  }, [searchParams]);

  const poolType = useMemo(() => {
    return searchParams.get('poolType') || '';
  }, [searchParams]);

  const dappId = useMemo(() => {
    return searchParams.get('dappId') || '';
  }, [searchParams]);

  const stakeRewards = useMemo(() => {
    return searchParams.get('stakeRewards') || '';
  }, [searchParams]);

  const rewardsFrom = useMemo(() => {
    return searchParams.get('rewardsFrom') || '';
  }, [searchParams]);

  const source = useMemo(() => {
    return searchParams.get('source') || '';
  }, [searchParams]);

  const { showLoading, closeLoading, visible } = useLoading();
  const { wallet } = useWalletService();
  const { checkLogin } = useCheckLoginAndToken();
  const { isLogin } = useGetLoginStatus();
  const { curChain, tokensContractAddress } = useGetCmsInfo() || {};
  const [poolInfo, setPoolInfo] = useState<IStakePoolData>();
  const router = useRouter();
  const stakeModal = useModal(StakeModalWithConfirm);
  const operationAmount = useRef('0');
  const { getAddress } = useGetAwakenContract();
  const { stake: earlyStake, earlyStakeFn } = useEarlyStake();
  const [symbolBalance, setSymbolBalance] = useState('0');
  const [earlyStakeInfo, setEarlyStakeInfo] = useState<IEarlyStakeInfo>();
  const [rewardsInfo, setRewardsInfo] = useState<IPoolRewardsItem>();
  const notification = useNotification();
  const [isPending, setIsPending] = useState(false);

  console.log('====rewardsInfo', rewardsInfo);

  const goStakingPage = useCallback(() => {
    router.replace('/staking');
  }, [router]);

  const initEarlyStakeInfo = useCallback(async () => {
    if (!wallet?.address || !curChain || !stakeRewards) return;
    try {
      showLoading();
      let earlyStakeInfoList = await getEarlyStakeInfo({
        tokenName: '',
        address: wallet?.address || '',
        chainId: curChain,
        poolType: PoolType.TOKEN,
        rate: 0,
      });
      earlyStakeInfoList = earlyStakeInfoList?.filter((item) => item.poolId === poolId);
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
      closeLoading();
    }
  }, [closeLoading, curChain, notification, poolId, showLoading, stakeRewards, wallet?.address]);

  console.log('===searchParams', rewardsFrom, poolId, dappId);

  const initRewardsData = useCallback(async () => {
    if (
      !earlyStakeInfo ||
      !wallet?.address ||
      (rewardsFrom !== PoolType.POINTS && !poolId) ||
      !rewardsFrom
    )
      return;
    try {
      showLoading();
      const rewardsList = await getPoolRewards({
        address: wallet?.address || '',
        poolType: rewardsFrom as PoolType,
      });
      if (rewardsList && rewardsList?.length > 0) {
        const rewardsData = rewardsList?.find((item) => {
          return item.rewardsTokenName === earlyStakeInfo?.stakeSymbol;
        });
        if (rewardsData) setRewardsInfo(rewardsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      closeLoading();
    }
  }, [closeLoading, earlyStakeInfo, poolId, rewardsFrom, showLoading, wallet?.address]);

  useEffect(() => {
    initEarlyStakeInfo();
  }, [initEarlyStakeInfo]);

  useEffect(() => {
    initRewardsData();
  }, [initRewardsData]);

  const initPoolData = useCallback(
    async (props?: IFetchDataProps) => {
      const { withLoading = true } = props || {};
      if (!curChain || !poolId || !poolType) {
        return;
      }
      try {
        withLoading && showLoading();
        const { pools } = await fetchStakingPoolsData({
          poolType: poolType == PoolType.TOKEN ? 'Token' : 'Lp',
          maxResultCount: 20,
          skipCount: 0,
          address: wallet?.address || '',
          chainId: curChain,
          sorting: '',
          name: '',
        });
        withLoading && closeLoading();
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
        goStakingPage();
      } finally {
        withLoading && closeLoading();
      }
    },
    [
      closeLoading,
      curChain,
      goStakingPage,
      notification,
      poolId,
      poolType,
      showLoading,
      wallet?.address,
    ],
  );

  useEffect(() => {
    initPoolData();
  }, [initPoolData]);

  useEffect(() => {
    if ((poolType !== PoolType.POINTS && !poolId) || !poolType) {
      goStakingPage();
    }
  }, [goStakingPage, poolId, poolType]);

  useInterval(
    () => {
      initPoolData({ withLoading: false });
    },
    30000,
    { immediate: false },
  );

  const isFirstStake = useMemo(() => {
    return !ZERO.plus(poolInfo?.staked || 0).gt(ZERO);
  }, [poolInfo?.staked]);

  const getLpTokenContractAddress = useCallback(
    (feeType: TFeeType): string | undefined => {
      return getAddress(feeType)?.token;
    },
    [getAddress],
  );

  const checkApproveParams = useCallback(
    async (fee: TFeeType) => {
      if (
        !curChain ||
        (poolType === PoolType.LP && !getLpTokenContractAddress(fee)) ||
        (poolType === PoolType.TOKEN && !tokensContractAddress)
      ) {
        throw new Error();
      }
    },
    [curChain, getLpTokenContractAddress, poolType, tokensContractAddress],
  );

  const getSymbolBalance = useCallback(
    async ({
      stakeSymbol,
      rate,
      decimal,
      loadingStyle = 'default',
    }: {
      stakeSymbol: string;
      rate: number | string;
      decimal: number;
      loadingStyle?: 'block' | 'default';
    }): Promise<string | undefined> => {
      try {
        showLoading({ type: loadingStyle });
        let balance = 0;
        const balanceParams = {
          symbol: stakeSymbol,
          owner: wallet?.address || '',
        };
        if (poolType === PoolType.LP) {
          balance = (
            await GetLpBalance(
              balanceParams,
              getLpTokenContractAddress(rate as unknown as TFeeType) || '',
            )
          ).amount;
        } else {
          balance = (await GetBalance(balanceParams)).balance;
        }
        return divDecimals(balance || 0, decimal).toFixed(4);
      } catch (error) {
        console.error('GetBalance error', error);
        return;
      } finally {
        closeLoading();
      }
    },
    [closeLoading, getLpTokenContractAddress, poolType, showLoading, wallet?.address],
  );

  const initBalance = useCallback(async () => {
    console.log('====initBalance');

    if (!isFirstStake || !isLogin || !poolInfo?.stakeSymbol) return;
    const symbolBalance = await getSymbolBalance({
      stakeSymbol: poolInfo?.stakeSymbol || '',
      rate: poolInfo?.rate || 0,
      decimal: poolInfo?.decimal || 8,
    });
    if (symbolBalance) setSymbolBalance(symbolBalance);
  }, [
    getSymbolBalance,
    isFirstStake,
    isLogin,
    poolInfo?.decimal,
    poolInfo?.rate,
    poolInfo?.stakeSymbol,
  ]);

  useEffect(() => {
    initBalance();
  }, [initBalance]);

  const getBalanceDec = useCallback(
    (symbol: string) => {
      return poolType === 'Token'
        ? `It is the amount of ${symbol} held in your wallet`
        : `It is the amount of LP you hold in AwakenSwap`;
    },
    [poolType],
  );

  const freeAmount = useMemo(() => {
    const { frozen, withdrawable } = rewardsInfo?.rewardsInfo || {};
    return ZERO.plus(frozen || 0)
      .plus(withdrawable || 0)
      .toString();
  }, [rewardsInfo?.rewardsInfo]);

  const longestReleaseTime = useMemo(() => {
    const { claimInfos } = rewardsInfo?.rewardsInfo || {};
    return claimInfos && claimInfos?.length > 0
      ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
      : 0;
  }, [rewardsInfo?.rewardsInfo]);

  const stakeProps: IStakeWithConfirmProps = useMemo(() => {
    const symbol = formatTokenSymbol(poolInfo?.stakeSymbol || '');
    const balanceDec = getBalanceDec(symbol);
    return {
      isStakeRewards: !!stakeRewards,
      isEarlyStake: !!stakeRewards,
      poolType: poolType as PoolType,
      isFreezeAmount: !!stakeRewards,
      freezeAmount: stakeRewards ? freeAmount : undefined,
      earlyAmount: undefined,
      type: StakeType.STAKE,
      stakeData: !stakeRewards
        ? poolInfo || {}
        : {
            ...earlyStakeInfo,
            stakeInfos: earlyStakeInfo?.subStakeInfos,
            longestReleaseTime: longestReleaseTime || 0,
          },
      balanceDec,
      balance: symbolBalance,
      fetchBalance: async () =>
        await getSymbolBalance({
          stakeSymbol: poolInfo?.stakeSymbol || '',
          rate: poolInfo?.rate || 0,
          decimal: poolInfo?.decimal || 8,
        }),
      onStake: async (amount: number | string, period: number | string) => {
        if (stakeRewards) {
          if (!rewardsInfo || !earlyStakeInfo) {
            notification.error({ description: 'missing params' });
            return;
          }
          return await earlyStakeFn({
            rewardsInfo: rewardsInfo,
            poolType: rewardsFrom as PoolType,
            earlyStakeInfo,
            period,
          });
        }
        const periodInSeconds = dayjs.duration(Number(period || 0), 'day').asSeconds();
        // const periodInSeconds = stakeRewards
        //   ? 5 * 60
        //   : dayjs.duration(Number(period || 0), 'day').asSeconds();
        await checkApproveParams(poolInfo?.rate as TFeeType);
        let checked = false;
        try {
          checked = await checkAllowanceAndApprove({
            spender: tokensContractAddress || '',
            address: wallet?.address || '',
            chainId: curChain,
            symbol: poolInfo?.stakeSymbol,
            decimals: poolInfo?.decimal,
            amount: String(amount),
            contractType: poolType === PoolType.LP ? 'Lp' : 'Token',
            contractAddress: getLpTokenContractAddress(poolInfo?.rate as TFeeType),
          });
        } catch (error) {
          throw new Error();
        }
        if (checked) {
          store.dispatch(
            setConfirmInfo({
              backPath: location.href,
              type: TradeConfirmTypeEnum.Stake,
              content: {
                rate: poolInfo?.rate || 0,
                poolType: poolType as PoolType,
                amount,
                days: period,
                unlockDateTimeStamp: dayjs().add(Number(period), 'day').valueOf(),
                tokenSymbol: poolInfo?.stakeSymbol || '',
                rewardsSymbol: poolInfo?.earnedSymbol || '',
              },
            }),
          );
          try {
            operationAmount.current = timesDecimals(amount, poolInfo?.decimal).toFixed(0);
            const stakeRes = await tokenStake({
              poolId: poolInfo?.poolId || '',
              amount: timesDecimals(amount, poolInfo?.decimal).toFixed(0),
              period: periodInSeconds,
            });
            return stakeRes;
          } catch (error) {
            const { errorMessage } = error as any;
            errorMessage &&
              notification.error({
                description: errorMessage.message,
                message: errorMessage.title || '',
              });
            throw Error(errorMessage.message);
          }
        }
      },
      onClose: (isSuccess) => {
        initPoolData();
        initBalance();
        if (stakeRewards && isSuccess) {
          const params = {
            poolId,
            poolType,
          };
          const replaceParams = qs.stringify(params);
          router.replace(`/pool-detail?${replaceParams}`);
        }
      },
      onSuccess: () => {
        setIsPending(true);
        saveTransaction({
          transactionType:
            poolType === PoolType.TOKEN ? TransactionType.TokenStake : TransactionType.LpStake,
          address: wallet?.address || '',
          amount: operationAmount.current,
        });
      },
    };
  }, [
    checkApproveParams,
    curChain,
    earlyStakeFn,
    earlyStakeInfo,
    freeAmount,
    getBalanceDec,
    getLpTokenContractAddress,
    getSymbolBalance,
    initBalance,
    initPoolData,
    longestReleaseTime,
    notification,
    poolId,
    poolInfo,
    poolType,
    rewardsFrom,
    rewardsInfo,
    router,
    stakeRewards,
    symbolBalance,
    tokensContractAddress,
    wallet?.address,
  ]);

  const showStakeModal = useCallback(
    async (type: StakeType, stakeData: IStakePoolData) => {
      const { stakeSymbol = '', decimal = 8, rate = 0, unlockTime, earnedSymbol } = stakeData;
      if (!stakeSymbol) {
        notification.error({ description: 'stakeSymbol is required.' });
        return;
      }
      let symbolBalance;
      if (type !== StakeType.RENEW) {
        symbolBalance = await getSymbolBalance({
          stakeSymbol,
          rate,
          decimal,
          loadingStyle: 'block',
        });
        if (!symbolBalance) return;
      }
      const symbol = formatTokenSymbol(stakeData?.stakeSymbol || '');
      stakeModal.show({
        poolType: poolType as PoolType,
        isFreezeAmount: type === StakeType.RENEW ? true : false,
        freezeAmount: type === StakeType.RENEW ? String(stakeData.staked) : undefined,
        type,
        stakeData,
        balanceDec: getBalanceDec(symbol),
        balance: symbolBalance,
        fetchBalance: async () =>
          await getSymbolBalance({
            stakeSymbol,
            rate,
            decimal,
          }),
        onStake: async (amount, period) => {
          const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
          if (type === StakeType.RENEW) {
            store.dispatch(
              setConfirmInfo({
                type: TradeConfirmTypeEnum.Renew,
                backPath: location.href,
                content: {
                  rate,
                  amount,
                  days: period,
                  unlockDateTimeStamp: dayjs().add(Number(period), 'day').valueOf(),
                  tokenSymbol: stakeSymbol,
                  rewardsSymbol: earnedSymbol,
                },
              }),
            );
            operationAmount.current = stakeData?.staked || '';
            try {
              const renewRes = await Renew({
                poolId: stakeData?.poolId || '',
                period: periodInSeconds,
              });
              return renewRes;
            } catch (error) {
              const { errorMessage } = error as any;
              errorMessage &&
                notification.error({
                  description: errorMessage.message,
                  message: errorMessage.title || '',
                });
              throw Error(errorMessage.message);
            }
          } else {
            await checkApproveParams(rate as TFeeType);
            let checked = false;
            try {
              checked = await checkAllowanceAndApprove({
                spender: tokensContractAddress || '',
                address: wallet?.address || '',
                chainId: curChain,
                symbol: stakeSymbol,
                decimals: decimal,
                amount: String(amount),
                contractType: poolType === PoolType.LP ? 'Lp' : 'Token',
                contractAddress: getLpTokenContractAddress(rate as TFeeType),
              });
            } catch (error) {
              throw new Error();
            }
            if (checked) {
              store.dispatch(
                setConfirmInfo({
                  backPath: location.href,
                  type:
                    type === StakeType.ADD
                      ? TradeConfirmTypeEnum.Add
                      : type === StakeType.EXTEND
                      ? TradeConfirmTypeEnum.Extend
                      : TradeConfirmTypeEnum.Stake,
                  content: {
                    rate,
                    poolType: poolType as PoolType,
                    amount,
                    days: period,
                    unlockDateTimeStamp:
                      type === StakeType.ADD || type === StakeType.EXTEND
                        ? dayjs(unlockTime).add(Number(period), 'day').valueOf()
                        : dayjs().add(Number(period), 'day').valueOf(),
                    tokenSymbol: stakeSymbol,
                    rewardsSymbol: earnedSymbol,
                  },
                }),
              );
              try {
                operationAmount.current =
                  type !== StakeType.EXTEND
                    ? timesDecimals(amount, decimal).toFixed(0)
                    : stakeData?.staked || '';
                const stakeRes = await tokenStake({
                  poolId: stakeData?.poolId || '',
                  amount: type !== StakeType.EXTEND ? timesDecimals(amount, decimal).toFixed(0) : 0,
                  period: periodInSeconds,
                });
                return stakeRes;
              } catch (error) {
                const { errorMessage } = error as any;
                if (errorMessage)
                  notification.error({
                    description: errorMessage.message,
                    message: errorMessage.title || '',
                  });
                throw Error(errorMessage.message);
              }
            }
          }
        },
        onClose: () => {
          initPoolData();
        },
        onSuccess: () => {
          setIsPending(true);
          saveTransaction({
            transactionType:
              poolType === PoolType.TOKEN
                ? type === StakeType.STAKE
                  ? TransactionType.TokenStake
                  : type === StakeType.ADD
                  ? TransactionType.TokenAddStake
                  : type === StakeType.RENEW
                  ? TransactionType.TokenStakeRenew
                  : TransactionType.TokenStakeExtend
                : type === StakeType.STAKE
                ? TransactionType.LpStake
                : type === StakeType.ADD
                ? TransactionType.LpAddStake
                : type === StakeType.RENEW
                ? TransactionType.LpStakeRenew
                : TransactionType.LpStakeExtend,
            address: wallet?.address || '',
            amount: operationAmount.current,
          });
        },
      });
    },
    [
      stakeModal,
      poolType,
      getBalanceDec,
      getSymbolBalance,
      notification,
      checkApproveParams,
      tokensContractAddress,
      wallet?.address,
      curChain,
      getLpTokenContractAddress,
      initPoolData,
    ],
  );

  const onStake = useCallback(
    (stakeData: IStakePoolData) => {
      console.log('onStake');
      showStakeModal(StakeType.STAKE, stakeData);
    },
    [showStakeModal],
  );

  const onClaim = useCallback(
    async (stakeData: IStakePoolData) => {
      const {
        earnedSymbol = '--',
        stakeId,
        earned,
        decimal,
        releasePeriod,
        poolId,
        supportEarlyStake,
      } = stakeData;
      try {
        if (!poolId) return;
        showLoading({ type: 'block' });
        const { TransactionId } = await tokenClaim(poolId);
        if (TransactionId) {
          setIsPending(true);
          saveTransaction({
            address: wallet?.address || '',
            amount: String(earned || ''),
            transactionType:
              poolType === 'Token' ? TransactionType.TokenClaim : TransactionType.LpClaim,
          });
          store.dispatch(
            setConfirmInfo({
              backPath: '/rewards',
              type: TradeConfirmTypeEnum.Claim,
              poolType: poolType as PoolType,
              content: {
                amount: divDecimals(earned, decimal).toString(),
                releasePeriod,
                supportEarlyStake,
                tokenSymbol: earnedSymbol,
                rewardsSymbol: earnedSymbol,
                poolType: poolType as PoolType,
              },
            }),
          );
          router.push(`/tx/${TransactionId}`);
        }
      } catch (error) {
        const { errorMessage } = error as any;
        const errorTip = errorMessage?.message;
        errorTip &&
          notification.error({ description: errorTip, message: errorMessage?.title || '' });
      } finally {
        closeLoading();
      }
    },
    [closeLoading, notification, poolType, router, showLoading, wallet?.address],
  );

  const onUnlock = useCallback(
    async (stakeData: IStakePoolData) => {
      const {
        stakeId = '',
        staked,
        earlyStakedAmount,
        stakeSymbol,
        earnedSymbol,
        poolId = '',
        decimal,
        releasePeriod,
        supportEarlyStake,
        rate,
      } = stakeData;
      if (!stakeId || !poolId) {
        notification.error({ description: 'missing params' });
        return;
      }
      try {
        showLoading({ type: 'block' });
        const { rewardInfos } = await GetReward({
          stakeIds: [String(stakeData.stakeId)],
        });
        console.log(
          '==rewardInfos',
          rewardInfos,
          divDecimals(rewardInfos?.[0]?.amount, decimal || 8).toString(),
        );
        try {
          if (!poolId) {
            notification.error({ description: 'missing params poolId' });
            return;
          }
          const { TransactionId } = await tokenUnlock(poolId);
          if (TransactionId) {
            setIsPending(true);
            saveTransaction({
              address: wallet?.address || '',
              amount: String(staked || ''),
              transactionType:
                poolType === 'Token'
                  ? TransactionType.TokenStakeUnlock
                  : TransactionType.LpStakeUnlock,
            });
            store.dispatch(
              setConfirmInfo({
                type: TradeConfirmTypeEnum.Unstake,
                backPath: '/rewards',
                poolType: poolType as PoolType,
                content: {
                  rate,
                  poolType: poolType as PoolType,
                  autoClaimAmount: divDecimals(rewardInfos?.[0]?.amount, decimal || 8).toString(),
                  amountFromEarlyStake: divDecimals(earlyStakedAmount, decimal || 8).toString(),
                  amountFromWallet: divDecimals(
                    ZERO.plus(staked || 0).minus(earlyStakedAmount || 0),
                    decimal || 8,
                  ).toString(),
                  tokenSymbol: stakeSymbol,
                  rewardsSymbol: earnedSymbol,
                  releasePeriod,
                  supportEarlyStake,
                },
              }),
            );
            router.push(`/tx/${TransactionId}`);
          }
        } catch (error) {
          const { errorMessage } = error as any;
          const errorTip = errorMessage?.message;
          console.log('tokenUnlock error', errorTip);
          errorTip &&
            notification.error({ description: errorTip, message: errorMessage?.title || '' });
        } finally {
          closeLoading();
        }
      } catch (error) {
        console.error('GetReward error', error);
        notification.error({
          description:
            (error as IContractError).errorMessage?.message ||
            'unlock failed, please try again later',
        });
      } finally {
        closeLoading();
      }
    },
    [closeLoading, notification, poolType, router, showLoading, wallet?.address],
  );

  const onAdd = useCallback(
    (stakeData: IStakePoolData) => {
      showStakeModal(StakeType.ADD, stakeData);
    },
    [showStakeModal],
  );

  const onExtend = useCallback(
    (stakeData: IStakePoolData) => {
      showStakeModal(StakeType.EXTEND, stakeData);
    },
    [showStakeModal],
  );

  const onRenewal = useCallback(
    (stakeData: IStakePoolData) => {
      showStakeModal(StakeType.RENEW, stakeData);
    },
    [showStakeModal],
  );

  const goLiquidity = useCallback(() => {
    if (!isLogin) {
      checkLogin({
        onSuccess: () => {
          //FIXME: web-login
          router.push('/liquidity');
        },
      });
      return;
    }
    router.push('/liquidity');
  }, [checkLogin, isLogin, router]);

  const onBack = useCallback(() => {
    if (source === 'result') {
      router.replace('/staking');
      return;
    }
    router.back();
  }, [router, source]);

  return {
    poolInfo,
    isFirstStake,
    onRenewal,
    onStake,
    onExtend,
    onAdd,
    earlyStake,
    goLiquidity,
    onClaim,
    onUnlock,
    stakeProps,
    stakeRewards,
    loading: visible,
    poolType,
    onBack,
    isPending,
  };
}
