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
import { matchErrorMsg } from 'utils/formatError';
import { formatTokenSymbol } from 'utils/format';
import qs from 'qs';
import { useRouter } from 'next/navigation';
import useNotification from 'hooks/useNotification';
import { store } from 'redux/store';
import { setConfirmInfo } from 'redux/reducer/info';
import { TradeConfirmTypeEnum } from 'components/TradeConfrim';

const noAmountErrorTip = 'No amount available for staking. Please try again later.';
const poolIsUnlockedError =
  'Your staking has expired and cannot be added. Please proceed to "Simple Staking" for renewal.';

export interface IEarlyStakeProps {
  onOpen?: () => void;
  onSuccess?: () => void;
  beforeLeave?: () => void;
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
  const router = useRouter();
  const notification = useNotification();

  const getAmountNotEnoughErrorTip = useCallback((tokenName: string, min: string | number) => {
    return `Insufficient balance for early staking; a minimum of ${min} ${formatTokenSymbol(
      tokenName,
    )} is required. Your current reward is being processed on the blockchain, please try again later.`;
  }, []);

  const checkRewardsAmount = useCallback(
    async (poolType: PoolType, rewardsTokenName?: string) => {
      const rewardsData =
        (await getPoolRewards({
          address: wallet?.address || '',
          poolType,
        })) || [];
      const rewardsInfo = rewardsData?.filter(
        (item) => item?.rewardsTokenName === rewardsTokenName,
      )?.[0];

      const { frozen, withdrawable, decimal, claimInfos } = rewardsInfo?.rewardsInfo || {};
      console.log(
        'rewardsInfo',
        frozen,
        withdrawable,
        rewardsInfo,
        rewardsTokenName,
        poolType,
        ZERO.plus(frozen || 0)
          .plus(withdrawable || 0)
          .toString(),
      );

      return {
        rewardsInfo,
        decimal,
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
    },
    [wallet?.address],
  );

  const stake = useCallback(
    async (params: IEarlyStakeProps) => {
      const { onOpen, poolType, rate = 0, onSuccess, rewardsTokenName, beforeLeave } = params || {};
      try {
        showLoading();
        const {
          amount: earlyStakeAmount,
          decimal,
          tokenName,
          dappId = '',
          claimIds = [],
          claimInfos = [],
          longestReleaseTime = 0,
          rewardsInfo,
        } = (await checkRewardsAmount(poolType, rewardsTokenName)) || {};
        if (BigNumber(earlyStakeAmount || 0).isZero()) {
          throw Error(noAmountErrorTip);
        }
        const earlyStakeData = await getEarlyStakeInfo({
          tokenName: tokenName || '',
          address: wallet?.address || '',
          chainId: curChain!,
          poolType: PoolType.TOKEN,
          rate,
        });
        const fixedEarlyStakeData = (
          fixEarlyStakeData(earlyStakeData) as Array<IEarlyStakeInfo>
        )?.[0];
        if (fixedEarlyStakeData) {
          const hasHistoryStake = !BigNumber(fixedEarlyStakeData?.staked || 0).isZero();
          if (hasHistoryStake) {
            if (
              BigNumber(earlyStakeAmount).lt(
                BigNumber(fixedEarlyStakeData?.minimalExtendStakeAmount || 0),
              )
            ) {
              throw Error(
                getAmountNotEnoughErrorTip(
                  tokenName,
                  divDecimals(
                    fixedEarlyStakeData?.minimalExtendStakeAmount || 0,
                    decimal || 8,
                  ).toString(),
                ),
              );
            }
          } else {
            if (
              BigNumber(earlyStakeAmount).lt(
                BigNumber(fixedEarlyStakeData?.minimalStakeAmount || 0),
              )
            ) {
              throw Error(
                getAmountNotEnoughErrorTip(
                  tokenName,
                  divDecimals(
                    fixedEarlyStakeData?.minimalStakeAmount || 0,
                    decimal || 8,
                  ).toString(),
                ),
              );
            }
          }
          if (
            !BigNumber(fixedEarlyStakeData?.staked || 0).isZero() &&
            dayjs(fixedEarlyStakeData?.unlockTime || 0).isBefore(dayjs())
          ) {
            throw Error(poolIsUnlockedError);
          }
          if (!hasHistoryStake) {
            const params = {
              poolType: PoolType.TOKEN,
              poolId: fixedEarlyStakeData?.poolId || '',
              stakeRewards: true,
              rewardsFrom: poolType,
              source: 'result',
            };
            const fixedParams = qs.stringify(params);
            beforeLeave?.();
            router.push(`/pool-detail?${fixedParams}`);
            return;
          }
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
              // const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
              const periodInSeconds = 5 * 60;
              const signParams: IEarlyStakeSignParams = {
                amount: Number(earlyStakeAmount),
                poolType,
                address: wallet?.address || '',
                claimInfos,
                dappId,
                poolId: fixedEarlyStakeData?.poolId || '',
                period: periodInSeconds,
                operationPoolIds: poolType === PoolType.POINTS ? [] : [rewardsInfo?.poolId || ''],
                operationDappIds: poolType === PoolType.POINTS ? [dappId || ''] : [],
              };
              try {
                const res = await earlyStakeSign(signParams);
                const { signature, seed, expirationTime } = res?.data || {};
                if (!signature || !seed || !expirationTime) throw Error(res?.message || '');
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
                    methodName: 'StakeRewards',
                    params: {
                      stakeInput: {
                        claimIds,
                        account: wallet?.address,
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
                if (TransactionId) {
                  const params: any = {
                    poolId: fixedEarlyStakeData?.poolId || '',
                    poolType: PoolType.TOKEN,
                  };
                  const fixedParams = qs.stringify(params);
                  const targetUrl = `/pool-detail?${fixedParams}`;
                  store.dispatch(
                    setConfirmInfo({
                      backPath: targetUrl,
                      type: hasHistoryStake ? TradeConfirmTypeEnum.Add : TradeConfirmTypeEnum.Stake,
                      isStakeRewards: true,
                      poolDetailPath: `/pool-detail?poolId=${
                        fixedEarlyStakeData?.poolId || ''
                      }&poolType=Token`,
                      poolType,
                      content: {
                        poolType,
                        amount: divDecimals(earlyStakeAmount || 0, decimal || 8).toString(),
                        days: period,
                        unlockDateTimeStamp: hasHistoryStake
                          ? dayjs(fixedEarlyStakeData.unlockTime)
                              .add(Number(period), 'day')
                              .valueOf()
                          : dayjs().add(Number(period), 'day').valueOf(),
                        tokenSymbol: tokenName || '',
                        rewardsSymbol: rewardsTokenName || '',
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
                  notification.error({ description: matchedErrorMsg, message: title || '' });
                throw Error(errorTip);
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
        notification.error({ description: (error as Error).message });
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
      getAmountNotEnoughErrorTip,
      notification,
      rewardsContractAddress,
      router,
      showLoading,
      stakeModal,
      wallet,
      walletType,
    ],
  );

  const earlyStakeFn = useCallback(
    async ({
      rewardsInfo,
      period,
      poolType,
      earlyStakeInfo,
    }: {
      rewardsInfo: IPoolRewardsItem;
      period: number | string;
      poolType: PoolType;
      earlyStakeInfo: IEarlyStakeInfo;
    }) => {
      // const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
      const periodInSeconds = 5 * 60;
      const { frozen, withdrawable, claimInfos, decimal } = rewardsInfo?.rewardsInfo || {};
      const earlyStakeAmount = ZERO.plus(frozen || 0)
        .plus(withdrawable || 0)
        .toString();
      const claimIds = (claimInfos || []).map((item) => {
        return item.claimId;
      });
      const signParams: IEarlyStakeSignParams = {
        amount: Number(earlyStakeAmount),
        poolType,
        address: wallet?.address || '',
        claimInfos,
        dappId: rewardsInfo?.dappId || '',
        poolId: earlyStakeInfo?.poolId || '',
        period: periodInSeconds,
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
            walletInfo: wallet,
            walletType,
            caContractAddress: caContractAddress || '',
            contractAddress: rewardsContractAddress || '',
            methodName: 'StakeRewards',
            params: {
              stakeInput: {
                claimIds,
                account: wallet?.address,
                amount: earlyStakeAmount,
                seed,
                poolId: earlyStakeInfo?.poolId || '',
                expirationTime,
                period: periodInSeconds,
                dappId: rewardsInfo?.dappId || '',
                longestReleaseTime: BigNumber(longestReleaseTime).div(1000).dp(0).toNumber(),
              },
              signature,
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
          throw Error('');
        }
        const { data: TransactionId, message: errorMessage } = await earlyStakeApi({
          chainId: curChain!,
          rawTransaction: rawTransaction || '',
        });
        if (TransactionId) {
          const hasHistoryStake = BigNumber(earlyStakeInfo?.staked || 0).gt(ZERO);
          const params: any = {
            poolId: earlyStakeInfo?.poolId || '',
            poolType: PoolType.TOKEN,
          };
          const fixedParams = qs.stringify(params);
          const targetUrl = `/pool-detail?${fixedParams}`;
          store.dispatch(
            setConfirmInfo({
              backPath: targetUrl,
              type: hasHistoryStake ? TradeConfirmTypeEnum.Add : TradeConfirmTypeEnum.Stake,
              isStakeRewards: true,
              poolDetailPath: `/pool-detail?poolId=${earlyStakeInfo?.poolId || ''}&poolType=Token`,
              poolType,
              content: {
                poolType,
                amount: divDecimals(earlyStakeAmount || 0, decimal || 8).toString(),
                days: period,
                unlockDateTimeStamp: hasHistoryStake
                  ? dayjs(earlyStakeInfo.unlockTime).add(Number(period), 'day').valueOf()
                  : dayjs().add(Number(period), 'day').valueOf(),
                tokenSymbol: rewardsInfo?.rewardsTokenName || '',
                rewardsSymbol: rewardsInfo?.rewardsTokenName || '',
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
          notification.error({ description: matchedErrorMsg, message: title || '' });
        throw Error(errorTip);
      }
    },
    [caContractAddress, config, curChain, notification, rewardsContractAddress, wallet, walletType],
  );

  return {
    stake,
    earlyStakeFn,
  };
}
