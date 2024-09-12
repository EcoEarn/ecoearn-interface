import { useModal } from '@ebay/nice-modal-react';
import { singleMessage } from '@portkey/did-ui-react';
import { useInterval } from 'ahooks';
import { message } from 'antd';
import { fetchStakingPoolsData, saveTransaction } from 'api/request';
import { GetBalance } from 'contract/multiToken';
import { GetBalance as GetLpBalance } from 'contract/lpToken';
import StakeModalWithConfirm from 'components/StakeModalWithConfirm';
import { ZERO } from 'constants/index';
import { GetReward, Renew, tokenStake } from 'contract/tokenStaking';
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
import ClaimModal from 'components/ClaimModal';
import UnlockModal from 'components/UnlockModal';
import { IContractError } from 'types';
import { IStakeWithConfirmProps } from 'components/StakeWithConfirm';

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

  const { showLoading, closeLoading } = useLoading();
  const { wallet } = useWalletService();
  const { checkLogin } = useCheckLoginAndToken();
  const { isLogin } = useGetLoginStatus();
  const { curChain, tokensContractAddress } = useGetCmsInfo() || {};
  const [poolInfo, setPoolInfo] = useState<IStakePoolData>();
  const router = useRouter();
  const stakeModal = useModal(StakeModalWithConfirm);
  const operationAmount = useRef('0');
  const { getAddress } = useGetAwakenContract();
  const { stake: earlyStake } = useEarlyStake();
  const claimModal = useModal(ClaimModal);
  const unlockModal = useModal(UnlockModal);
  const [symbolBalance, setSymbolBalance] = useState('0');

  const goStakingPage = useCallback(() => {
    router.replace('/staking');
  }, [router]);

  const initPoolData = useCallback(
    async (props?: IFetchDataProps) => {
      const { withLoading = true } = props || {};
      if (!curChain || !poolId || !poolType || poolType !== PoolType.TOKEN) {
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
        message.error((error as Error)?.message);
        goStakingPage();
      } finally {
        withLoading && closeLoading();
      }
    },
    [closeLoading, curChain, goStakingPage, poolId, poolType, showLoading, wallet?.address],
  );

  useEffect(() => {
    initPoolData();
  }, [initPoolData]);

  useEffect(() => {
    if (!poolId || !poolType || poolType !== PoolType.TOKEN) {
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
    }: {
      stakeSymbol: string;
      rate: number | string;
      decimal: number;
    }): Promise<string | undefined> => {
      try {
        showLoading();
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
        singleMessage.error('get balance error.');
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

  const stakeProps: IStakeWithConfirmProps = useMemo(() => {
    const symbol = formatTokenSymbol(poolInfo?.stakeSymbol || '');
    const balanceDec = getBalanceDec(symbol);
    return {
      poolType: poolType as PoolType,
      isFreezeAmount: false,
      freezeAmount: undefined,
      type: StakeType.STAKE,
      stakeData: poolInfo || {},
      balanceDec,
      balance: symbolBalance,
      fetchBalance: async () =>
        await getSymbolBalance({
          stakeSymbol: poolInfo?.stakeSymbol || '',
          rate: poolInfo?.rate || 0,
          decimal: poolInfo?.decimal || 8,
        }),
      onStake: async (amount: number | string, period: number | string) => {
        // const periodInSeconds = dayjs.duration(Number(period || 0), 'day').asSeconds();
        const periodInSeconds = 120;
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
          try {
            operationAmount.current = timesDecimals(amount, poolInfo?.decimal).toFixed(0);
            const stakeRes = await tokenStake({
              poolId: poolInfo?.poolId || '',
              amount: timesDecimals(amount, poolInfo?.decimal).toFixed(0),
              period: periodInSeconds,
            });
            return stakeRes;
          } catch (error) {
            const { showInModal, errorMessage } = error as any;
            if (!showInModal) message.error(errorMessage.message);
            throw Error(showInModal ? errorMessage.message : '');
          }
        }
      },
      onClose: () => {
        initPoolData();
        initBalance();
      },
      onSuccess: () => {
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
    getBalanceDec,
    getLpTokenContractAddress,
    getSymbolBalance,
    initBalance,
    initPoolData,
    poolInfo,
    poolType,
    symbolBalance,
    tokensContractAddress,
    wallet?.address,
  ]);

  const showStakeModal = useCallback(
    async (type: StakeType, stakeData: IStakePoolData) => {
      const { stakeSymbol = '', decimal = 8, rate = 0.003 } = stakeData;
      if (!stakeSymbol) {
        singleMessage.error('stakeSymbol is required.');
        return;
      }
      let symbolBalance;
      if (type !== StakeType.RENEW) {
        symbolBalance = await getSymbolBalance({
          stakeSymbol,
          rate,
          decimal,
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
          const periodInSeconds = dayjs.duration(Number(period || 0), 'day').asSeconds();
          if (type === StakeType.RENEW) {
            operationAmount.current = stakeData?.staked || '';
            try {
              const renewRes = await Renew({
                poolId: stakeData?.poolId || '',
                period: periodInSeconds,
              });
              return renewRes;
            } catch (error) {
              const { showInModal, errorMessage } = error as any;
              if (!showInModal) message.error(errorMessage.message);
              throw Error(showInModal ? errorMessage.message : '');
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
                const { showInModal, errorMessage } = error as any;
                if (!showInModal) message.error(errorMessage.message);
                throw Error(showInModal ? errorMessage.message : '');
              }
            }
          }
        },
        onClose: () => {
          initPoolData();
        },
        onSuccess: () => {
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
    (stakeData: IStakePoolData) => {
      const {
        earnedSymbol = '--',
        stakeId,
        earned,
        decimal,
        releasePeriod,
        poolId,
        supportEarlyStake,
      } = stakeData;
      claimModal.show({
        amount: earned,
        tokenSymbol: earnedSymbol,
        decimal,
        poolId: String(poolId) || '',
        releasePeriod,
        supportEarlyStake,
        onClose: () => {
          initPoolData();
        },
        onSuccess: () => {
          saveTransaction({
            address: wallet?.address || '',
            amount: String(earned || ''),
            transactionType:
              poolType === 'Token' ? TransactionType.TokenClaim : TransactionType.LpClaim,
          });
        },
        onEarlyStake: () => {
          earlyStake({
            poolType: poolType === 'Token' ? PoolType.TOKEN : PoolType.LP,
            rewardsTokenName: earnedSymbol,
            onSuccess: () => {
              claimModal.remove();
            },
          });
        },
      });
    },
    [claimModal, earlyStake, initPoolData, poolType, wallet?.address],
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
      } = stakeData;
      if (!stakeId || !poolId) {
        singleMessage.error('missing params');
        return;
      }
      try {
        showLoading();
        const { rewardInfos } = await GetReward({
          stakeIds: [String(stakeData.stakeId)],
        });

        closeLoading();
        unlockModal.show({
          amount: divDecimals(staked, decimal || 8).toString(),
          autoClaimAmount: divDecimals(rewardInfos?.[0]?.amount, decimal || 8).toString(),
          amountFromEarlyStake:
            poolType === PoolType.LP
              ? '0'
              : divDecimals(earlyStakedAmount, decimal || 8).toString(),
          amountFromWallet:
            poolType === PoolType.LP
              ? '0'
              : divDecimals(
                  ZERO.plus(staked || 0).minus(earlyStakedAmount || 0),
                  decimal || 8,
                ).toString(),
          tokenSymbol: stakeSymbol,
          rewardsSymbol: earnedSymbol,
          poolId,
          releasePeriod,
          supportEarlyStake,
          onClose: () => {
            initPoolData();
          },
          onSuccess: () => {
            saveTransaction({
              address: wallet?.address || '',
              amount: String(staked || ''),
              transactionType:
                poolType === 'Token'
                  ? TransactionType.TokenStakeUnlock
                  : TransactionType.LpStakeUnlock,
            });
          },
          onEarlyStake: () => {
            earlyStake({
              poolType: poolType === 'Token' ? PoolType.TOKEN : PoolType.LP,
              rewardsTokenName: earnedSymbol,
              onSuccess: () => {
                unlockModal.remove();
              },
            });
          },
        });
      } catch (error) {
        console.error('GetReward error', error);
        singleMessage.error(
          (error as IContractError).errorMessage?.message ||
            'unlock failed, please try again later',
        );
      } finally {
        closeLoading();
      }
    },
    [closeLoading, earlyStake, initPoolData, poolType, showLoading, unlockModal, wallet?.address],
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
          router.push('/liquidity');
        },
      });
      return;
    }
    router.push('/liquidity');
  }, [checkLogin, isLogin, router]);

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
  };
}