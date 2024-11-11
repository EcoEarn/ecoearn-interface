import { useCheckLoginAndToken, useWalletService } from 'hooks/useWallet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import StakeModalWithConfirm from 'components/StakeModalWithConfirm';
import { useModal } from '@ebay/nice-modal-react';
import ClaimModal from 'components/ClaimModal';
import { singleMessage } from '@portkey/did-ui-react';
import { PoolType, StakeType, TransactionType } from 'types/stake';
import { GetReward, Renew, tokenStake } from 'contract/tokenStaking';
import UnlockModal from 'components/UnlockModal';
import { IContractError } from 'types';
import { fetchStakingPoolsData, saveTransaction } from 'api/request';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import dayjs from 'dayjs';
import { GetBalance } from 'contract/multiToken';
import { GetBalance as GetLpBalance } from 'contract/lpToken';
import { divDecimals, getTargetUnlockTimeStamp, timesDecimals } from 'utils/calculate';
import { checkAllowanceAndApprove } from 'utils/aelfUtils';
import useLoading from 'hooks/useLoading';
import { useInterval } from 'ahooks';
import useEarlyStake from 'hooks/useEarlyStake';
import { useRouter } from 'next/navigation';
import { formatTokenSymbol } from 'utils/format';
import useGetAwakenContract, { TFeeType } from 'hooks/useGetAwakenContract';
import { ZERO } from 'constants/index';
import { message } from 'antd';
import useNotification from 'hooks/useNotification';
import { getDomain } from 'utils/common';

interface IFetchDataProps {
  withLoading?: boolean;
}

export default function useSimpleStakeListService({ poolType }: { poolType: 'Token' | 'Lp' }) {
  const { isLogin } = useGetLoginStatus();
  const { checkLogin } = useCheckLoginAndToken();
  const [stakeData, setStakeData] = useState<Array<IStakePoolData>>([]);
  const [renewText, setRenewText] = useState<Array<IRenewText>>();
  const stakeModal = useModal(StakeModalWithConfirm);
  const claimModal = useModal(ClaimModal);
  const unlockModal = useModal(UnlockModal);
  const { wallet } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const router = useRouter();
  const { curChain, tokensContractAddress } = useGetCmsInfo() || {};
  const { stake: earlyStake } = useEarlyStake();
  const { getAddress } = useGetAwakenContract();
  const operationAmount = useRef('0');
  const notification = useNotification();
  const [loading, setLoading] = useState(false);

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

  const getStakeData = useCallback(
    async (props?: IFetchDataProps) => {
      const { withLoading = true } = props || {};
      withLoading && setLoading(true);
      try {
        const { pools, textNodes } =
          (await fetchStakingPoolsData({
            poolType,
            sorting: '',
            name: '',
            skipCount: 0,
            maxResultCount: 20,
            address: wallet?.address || '',
            chainId: curChain!,
          })) || {};
        const stakeData = (pools || [])?.map((item, index) => {
          return {
            ...item,
            unlockTime: getTargetUnlockTimeStamp(
              item?.stakingPeriod || 0,
              item?.lastOperationTime || 0,
              item?.unlockWindowDuration || 0,
            ).unlockTime,
          };
        });
        setStakeData(stakeData);
        setRenewText(textNodes || []);
      } catch (error) {
        console.error('getStakeData error', error);
      } finally {
        withLoading && setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [curChain, poolType, isLogin],
  );

  useInterval(
    () => {
      getStakeData({ withLoading: false });
    },
    30000,
    { immediate: false },
  );

  useEffect(() => {
    getStakeData();
  }, [getStakeData]);

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
          getStakeData();
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
    [claimModal, earlyStake, getStakeData, poolType, wallet?.address],
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
        notification.error({ description: 'missing params' });
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
            getStakeData();
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
        notification.error({
          description:
            (error as IContractError).errorMessage?.message ||
            'unlock failed, please try again later',
        });
      } finally {
        closeLoading();
      }
    },
    [
      closeLoading,
      earlyStake,
      getStakeData,
      notification,
      poolType,
      showLoading,
      unlockModal,
      wallet?.address,
    ],
  );

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
        (poolType === 'Lp' && !getLpTokenContractAddress(fee)) ||
        (poolType === 'Token' && !tokensContractAddress)
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
        if (poolType === 'Lp') {
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
        notification.error({ description: 'get balance error.' });
        console.error('GetBalance error', error);
        return;
      } finally {
        closeLoading();
      }
    },
    [closeLoading, getLpTokenContractAddress, notification, poolType, showLoading, wallet?.address],
  );

  const showStakeModal = useCallback(
    async (type: StakeType, stakeData: IStakePoolData) => {
      const { stakeSymbol = '', decimal = 8, rate = 0.003 } = stakeData;
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
        });
        if (!symbolBalance) return;
      }
      const symbol = formatTokenSymbol(stakeData?.stakeSymbol || '');
      const balanceDec =
        poolType === 'Token'
          ? `It is the amount of ${symbol} held in your wallet`
          : `It is the amount of LP you hold in AwakenSwap`;
      stakeModal.show({
        poolType: poolType === 'Token' ? PoolType.TOKEN : PoolType.LP,
        isFreezeAmount: type === StakeType.RENEW ? true : false,
        freezeAmount: type === StakeType.RENEW ? String(stakeData.staked) : undefined,
        type,
        stakeData,
        balanceDec,
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
              const { errorMessage } = error as any;
              const { message, title } = errorMessage;
              if (message) notification.error({ description: message, message: title });
              throw Error(message);
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
                contractType: poolType === 'Lp' ? 'Lp' : 'Token',
                contractAddress: getLpTokenContractAddress(rate as TFeeType),
              });
            } catch (error) {
              throw new Error();
            }
            if (checked) {
              try {
                const domain = getDomain();
                operationAmount.current =
                  type !== StakeType.EXTEND
                    ? timesDecimals(amount, decimal).toFixed(0)
                    : stakeData?.staked || '';
                const stakeRes = await tokenStake({
                  poolId: stakeData?.poolId || '',
                  amount: type !== StakeType.EXTEND ? timesDecimals(amount, decimal).toFixed(0) : 0,
                  period: periodInSeconds,
                  domain,
                });
                return stakeRes;
              } catch (error) {
                const { errorMessage } = error as any;
                const { message, title } = errorMessage;
                if (message) notification.error({ description: message, message: title });
                throw Error(message);
              }
            }
          }
        },
        onClose: () => {
          getStakeData();
        },
        onSuccess: () => {
          saveTransaction({
            transactionType:
              poolType === 'Token'
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
      poolType,
      stakeModal,
      notification,
      getSymbolBalance,
      checkApproveParams,
      tokensContractAddress,
      wallet?.address,
      curChain,
      getLpTokenContractAddress,
      getStakeData,
    ],
  );

  const onStake = useCallback(
    (stakeData: IStakePoolData) => {
      console.log('onStake');
      if (!isLogin) {
        return checkLogin();
      }
      showStakeModal(StakeType.STAKE, stakeData);
    },
    [checkLogin, isLogin, showStakeModal],
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

  return {
    stakeData,
    onClaim,
    onUnlock,
    onExtend,
    onAdd,
    onStake,
    isLogin,
    onRenewal,
    renewText,
    earlyStake,
    goLiquidity,
    loading,
  };
}
