import { cancelSign, earlyStakeSign, getEarlyStakeInfo, getPoolRewards } from 'api/request';
import { useCallback } from 'react';
import { PoolType, StakeType } from 'types/stake';
import { useWalletService } from './useWallet';
import useLoading from './useLoading';
import { message } from 'antd';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { divDecimals, getTargetUnlockTimeStamp } from 'utils/calculate';
import BigNumber from 'bignumber.js';
import { useModal } from '@ebay/nice-modal-react';
import StakeModalWithConfirm from 'components/StakeModalWithConfirm';
import { ZERO } from 'constants/index';
import dayjs from 'dayjs';
import { getRawTransaction } from 'utils/getRawTransaction';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { earlyStake as earlyStakeApi } from 'api/request';
import { ISendResult } from 'types';
import getBalanceTip from 'utils/stake';
import { getTxResult } from 'utils/aelfUtils';
import { matchErrorMsg } from 'utils/formatError';

const noAmountErrorTip = 'No amount available for staking. Please try again later.';
const amountNotEnoughErrorTip =
  'Insufficient balance for early staking; a minimum of 10 SGR is required. Your current reward is being processed on the blockchain, please try again later.';
const poolIsUnlockedError =
  'Your staking has expired and cannot be added. Please proceed to "Simple Staking" for renewal.';

export interface IEarlyStakeProps {
  onOpen?: () => void;
  onSuccess?: () => void;
  poolType: PoolType;
  rate?: string | number;
}

export default function useEarlyStake() {
  const { wallet, walletType } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const { curChain, caContractAddress, rewardsContractAddress } = useGetCmsInfo() || {};
  const config = useGetCmsInfo();
  const stakeModal = useModal(StakeModalWithConfirm);

  const checkRewardsAmount = useCallback(
    async (poolType: PoolType) => {
      const { pointsPoolAgg, tokenPoolAgg, lpPoolAgg, dappId } = await getPoolRewards({
        address: wallet.address,
      });

      if (poolType === PoolType.POINTS) {
        const { frozen, withdrawable, decimal, claimInfos } = pointsPoolAgg || {};
        const stakeTotal = divDecimals(
          ZERO.plus(frozen || 0).plus(withdrawable || 0),
          decimal || 8,
        );
        if (stakeTotal.gte(10)) {
          return {
            amount: ZERO.plus(frozen).plus(withdrawable).toString(),
            tokenName: pointsPoolAgg?.rewardsTokenName,
            dappId,
            claimInfos: pointsPoolAgg?.claimInfos || [],
            claimIds: (pointsPoolAgg?.claimInfos || []).map((item) => {
              return item.claimId;
            }),
            longestReleaseTime:
              claimInfos && claimInfos?.length > 0
                ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
                : 0,
          };
        }
        throw Error(stakeTotal.isZero() ? noAmountErrorTip : amountNotEnoughErrorTip);
      }
      if (poolType === PoolType.TOKEN) {
        const { frozen, withdrawable, decimal, claimInfos } = tokenPoolAgg || {};
        const stakeTotal = divDecimals(
          ZERO.plus(frozen || 0).plus(withdrawable || 0),
          decimal || 8,
        );
        if (stakeTotal.gte(10)) {
          return {
            amount: ZERO.plus(frozen).plus(withdrawable).toString(),
            tokenName: tokenPoolAgg?.rewardsTokenName,
            dappId,
            claimInfos: tokenPoolAgg?.claimInfos || [],
            claimIds: (tokenPoolAgg?.claimInfos || []).map((item) => {
              return item.claimId;
            }),
            longestReleaseTime:
              claimInfos && claimInfos?.length > 0
                ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
                : 0,
          };
        }
        throw Error(stakeTotal.isZero() ? noAmountErrorTip : amountNotEnoughErrorTip);
      }
      if (poolType === PoolType.LP) {
        const { frozen, withdrawable, decimal, claimInfos } = lpPoolAgg || {};
        const stakeTotal = divDecimals(
          ZERO.plus(frozen || 0).plus(withdrawable || 0),
          decimal || 8,
        );
        if (stakeTotal.gte(10)) {
          return {
            amount: ZERO.plus(frozen).plus(withdrawable).toString(),
            tokenName: lpPoolAgg.rewardsTokenName,
            dappId,
            claimInfos: lpPoolAgg?.claimInfos || [],
            claimIds: (lpPoolAgg?.claimInfos || []).map((item) => {
              return item.claimId;
            }),
            longestReleaseTime:
              claimInfos && claimInfos?.length > 0
                ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
                : 0,
          };
        }
        throw Error(stakeTotal.isZero() ? noAmountErrorTip : amountNotEnoughErrorTip);
      }
    },
    [wallet.address],
  );

  const stake = useCallback(
    async (params: IEarlyStakeProps) => {
      const { onOpen, poolType, rate = 0, onSuccess } = params || {};
      try {
        showLoading();
        const {
          amount: earlyStakeAmount,
          tokenName,
          dappId = '',
          claimIds = [],
          claimInfos = [],
          longestReleaseTime = 0,
        } = (await checkRewardsAmount(poolType)) || {};
        const earlyStakeData = await getEarlyStakeInfo({
          tokenName: tokenName || '',
          address: wallet.address || '',
          chainId: curChain!,
          poolType: PoolType.TOKEN,
          rate,
        });
        if (earlyStakeData) {
          const fixedEarlyStakeData = {
            ...earlyStakeData,
            unlockTime: getTargetUnlockTimeStamp(
              earlyStakeData?.stakingPeriod || 0,
              earlyStakeData?.lastOperationTime || 0,
              earlyStakeData?.unlockWindowDuration || 0,
            ).unlockTime,
          };
          if (
            !BigNumber(fixedEarlyStakeData?.staked || 0).isZero() &&
            dayjs(fixedEarlyStakeData?.unlockTime || 0).isBefore(dayjs())
          ) {
            throw Error(poolIsUnlockedError);
          }
          const hasHistoryStake = !BigNumber(fixedEarlyStakeData?.staked || 0).isZero();
          stakeModal.show({
            isStakeRewards: true,
            isFreezeAmount: true,
            isEarlyStake: true,
            type: hasHistoryStake ? StakeType.ADD : StakeType.STAKE,
            freezeAmount: String(earlyStakeAmount),
            earlyAmount: hasHistoryStake
              ? BigNumber(fixedEarlyStakeData?.staked || 0).toNumber()
              : undefined,
            stakeData: {
              ...fixedEarlyStakeData,
              stakeInfos: fixedEarlyStakeData?.subStakeInfos || [],
              longestReleaseTime,
            },
            balanceDec: getBalanceTip(poolType),
            onStake: async (amount, period = 0, poolId) => {
              const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
              const signParams = {
                amount: Number(earlyStakeAmount),
                poolType,
                address: wallet.address,
                claimInfos,
                dappId,
                poolId: fixedEarlyStakeData?.poolId || '',
                period: periodInSeconds,
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
                        amount: earlyStakeAmount,
                        seed,
                        poolId: fixedEarlyStakeData?.poolId || '',
                        expirationTime,
                        period: periodInSeconds,
                        dappId,
                        longestReleaseTime: BigNumber(longestReleaseTime)
                          .div(1000)
                          .dp(0)
                          .toNumber(),
                      },
                      signature,
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
                const { data: TransactionId, message: errorMessage } = await earlyStakeApi({
                  chainId: curChain!,
                  rawTransaction: rawTransaction || '',
                });
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
                  const { showInModal, matchedErrorMsg } = matchErrorMsg(
                    errorMessage,
                    'EarlyStake',
                  );
                  if (!showInModal) message.error(matchedErrorMsg);
                  throw Error(showInModal ? matchedErrorMsg : '');
                }
              } catch (error) {
                throw Error((error as Error).message);
              }
            },
            onSuccess: () => {
              onSuccess?.();
            },
          });
          onOpen?.();
        } else {
          throw Error('no pool');
        }
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        closeLoading();
      }
    },
    [
      caContractAddress,
      checkRewardsAmount,
      closeLoading,
      config,
      curChain,
      rewardsContractAddress,
      showLoading,
      stakeModal,
      wallet,
      walletType,
    ],
  );

  return {
    stake,
  };
}
