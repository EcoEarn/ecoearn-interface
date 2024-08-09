import { cancelSign, earlyStakeSign, getEarlyStakeInfo, getPoolRewards } from 'api/request';
import { useCallback } from 'react';
import { PoolType, StakeType } from 'types/stake';
import { useWalletService } from './useWallet';
import useLoading from './useLoading';
import { message } from 'antd';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { divDecimals } from 'utils/calculate';
import BigNumber from 'bignumber.js';
import { useModal } from '@ebay/nice-modal-react';
import StakeModalWithConfirm from 'components/StakeModalWithConfirm';
import { ZERO } from 'constants/index';
import dayjs from 'dayjs';
import { getRawTransaction } from 'utils/getRawTransaction';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { earlyStake as earlyStakeApi } from 'api/request';
import { ISendResult } from 'types';
import getBalanceTip, { fixEarlyStakeData } from 'utils/stake';
import { getTxResult } from 'utils/aelfUtils';
import { matchErrorMsg } from 'utils/formatError';
import useStakeConfig from './useStakeConfig';
import { formatTokenSymbol } from 'utils/format';

const noAmountErrorTip = 'No amount available for staking. Please try again later.';
const poolIsUnlockedError =
  'Your staking has expired and cannot be added. Please proceed to "Simple Staking" for renewal.';

export interface IEarlyStakeProps {
  onOpen?: () => void;
  onSuccess?: () => void;
  poolType: PoolType;
  rate?: string | number;
  rewardsTokenName?: string;
}

export default function useEarlyStake() {
  const { wallet, walletType } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const { curChain, caContractAddress, rewardsContractAddress } = useGetCmsInfo() || {};
  const config = useGetCmsInfo();
  const stakeModal = useModal(StakeModalWithConfirm);
  const { min } = useStakeConfig();

  const getAmountNotEnoughErrorTip = useCallback(
    (tokenName: string) => {
      return `Insufficient balance for early staking; a minimum of ${min} ${formatTokenSymbol(
        tokenName,
      )} is required. Your current reward is being processed on the blockchain, please try again later.`;
    },
    [min],
  );

  const checkRewardsAmount = useCallback(
    async (poolType: PoolType, rewardsTokenName?: string) => {
      const rewardsData =
        (await getPoolRewards({
          address: wallet.address,
          poolType,
        })) || [];
      const rewardsInfo = rewardsData?.filter(
        (item) => item?.rewardsTokenName === rewardsTokenName,
      )?.[0];

      const { frozen, withdrawable, decimal, claimInfos } = rewardsInfo?.rewardsInfo || {};
      const stakeTotal = divDecimals(ZERO.plus(frozen || 0).plus(withdrawable || 0), decimal || 8);
      if (stakeTotal.gte(min)) {
        return {
          amount: ZERO.plus(frozen || 0)
            .plus(withdrawable || 0)
            .toString(),
          tokenName: rewardsTokenName || '',
          dappId: rewardsInfo?.dappId || '',
          claimInfos: claimInfos || [],
          claimIds: (claimInfos || []).map((item) => {
            return item.claimId;
          }),
          longestReleaseTime:
            claimInfos && claimInfos?.length > 0
              ? claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0
              : 0,
        };
      }
      throw Error(
        stakeTotal.isZero() ? noAmountErrorTip : getAmountNotEnoughErrorTip(rewardsTokenName || ''),
      );
    },
    [getAmountNotEnoughErrorTip, min, wallet.address],
  );

  const stake = useCallback(
    async (params: IEarlyStakeProps) => {
      const { onOpen, poolType, rate = 0, onSuccess, rewardsTokenName } = params || {};
      try {
        showLoading();
        const {
          amount: earlyStakeAmount,
          tokenName,
          dappId = '',
          claimIds = [],
          claimInfos = [],
          longestReleaseTime = 0,
        } = (await checkRewardsAmount(poolType, rewardsTokenName)) || {};
        const earlyStakeData = await getEarlyStakeInfo({
          tokenName: tokenName || '',
          address: wallet.address || '',
          chainId: curChain!,
          poolType: PoolType.TOKEN,
          rate,
        });
        const fixedEarlyStakeData = (
          fixEarlyStakeData(earlyStakeData) as Array<IEarlyStakeInfo>
        )?.[0];
        if (fixedEarlyStakeData) {
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
              const signParams: IEarlyStakeSignParams = {
                amount: Number(earlyStakeAmount),
                poolType,
                address: wallet.address,
                claimInfos,
                dappId,
                poolId: fixedEarlyStakeData?.poolId || '',
                period: periodInSeconds,
                operationPoolIds:
                  poolType === PoolType.POINTS ? [] : [fixedEarlyStakeData?.poolId || ''],
                operationDappIds: poolType === PoolType.POINTS ? [dappId || ''] : [],
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
