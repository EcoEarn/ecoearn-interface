import { useInterval, useRequest } from 'ahooks';
import {
  cancelSign,
  fetchStakingPoolsData,
  getEarlyStakeInfo,
  getPoolRewards,
  liquidityStake,
  liquidityStakeSign,
  myLiquidity,
} from 'api/request';
import useLoading from 'hooks/useLoading';
import { useWalletService } from 'hooks/useWallet';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { divDecimals, getTargetUnlockTimeStamp, timesDecimals } from 'utils/calculate';
import { PoolType, StakeType } from 'types/stake';
import useNotification from 'hooks/useNotification';
import FaqList from 'components/FaqList';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import StakeWithConfirm, { IStakeWithConfirmProps } from 'components/StakeWithConfirm';
import AmountInfo from 'pageComponents/poolDetail/components/AmountInfo';
import { fixEarlyStakeData } from 'utils/stake';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { getRawTransaction } from 'utils/getRawTransaction';
import { ISendResult } from 'types';
import { matchErrorMsg } from 'utils/formatError';
import { store } from 'redux/store';
import { setConfirmInfo } from 'redux/reducer/info';
import qs from 'qs';
import { TradeConfirmTypeEnum } from 'components/TradeConfrim';
import StakeTokenTitle from 'components/StakeTokenTitle';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import Loading from 'components/Loading';

interface IFetchDataProps {
  withLoading?: boolean;
}

export default function StakeLiquidityPage() {
  const { rate } = useParams() as { rate: number | string };
  const { wallet, walletType } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const [liquidityData, setLiquidityData] = useState<ILiquidityItem>();
  const notification = useNotification();
  const { curChain } = useGetCmsInfo() || {};
  const [stakeProps, setStakeProps] = useState<IStakeWithConfirmProps>();
  const [poolInfo, setPoolInfo] = useState<IStakePoolData>();
  const config = useGetCmsInfo();
  const { isLogin } = useGetLoginStatus();
  const router = useRouter();
  const [earlyStakeInfoLoaded, setEarlyStakeInfoLoaded] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { data: rewardsData } = useRequest(
    async () => {
      if (!wallet?.address) return;
      try {
        const data = await getPoolRewards({
          address: wallet.address,
          poolType: PoolType.ALL,
        });
        return data;
      } catch (error) {
        console.error('getPoolRewards error', error);
      }
    },
    { pollingInterval: 10000, refreshDeps: [liquidityData] },
  );

  const rewardsSymbol = useMemo(() => {
    //FIXME:
    return 'SGR-1';
  }, []);

  const dappIdToStakeOrRemove = useMemo(() => {
    //FIXME:
    return (
      rewardsData?.filter((item) => item?.rewardsTokenName === rewardsSymbol)?.[0]?.dappId || ''
    );
  }, [rewardsData, rewardsSymbol]);

  const initLiquidityData = useCallback(
    async (props?: { needLoading?: boolean }) => {
      const { needLoading = true } = props || {};
      let list: Array<ILiquidityItem>;
      if (!wallet?.address || !rate) return;
      try {
        needLoading && showLoading();
        list = await myLiquidity({ address: wallet.address });
        needLoading && closeLoading();
        const cur = list?.find((item) => item.rate == rate);
        cur && setLiquidityData(cur);
      } catch (error) {
        console.error('getLiquidityInfo error', error);
      } finally {
        needLoading && closeLoading();
      }
    },
    [closeLoading, rate, showLoading, wallet?.address],
  );

  const initStakeProps = useCallback(async () => {
    if (!liquidityData || !wallet?.address) return;
    const { banlance, lpSymbol, rate, decimal, liquidityIds, lpAmount } = liquidityData;
    let stakeData: any;
    try {
      !earlyStakeInfoLoaded && showLoading();
      stakeData = await getEarlyStakeInfo({
        tokenName: lpSymbol || '',
        address: wallet?.address || '',
        chainId: curChain!,
        poolType: PoolType.LP,
        rate: rate,
      });
      setEarlyStakeInfoLoaded(true);
      !earlyStakeInfoLoaded && closeLoading();
      const fixedEarlyStakeData = (fixEarlyStakeData(stakeData) as Array<IEarlyStakeInfo>)?.[0];
      if (fixedEarlyStakeData) {
        stakeData = fixedEarlyStakeData;
      } else {
        notification.error({ description: 'no pool' });
        return;
      }
    } catch (error) {
      notification.error({ description: 'getPool failed' });
      return;
    } finally {
      !earlyStakeInfoLoaded && closeLoading();
    }
    const { stakeSymbol = '' } = stakeData;
    if (!stakeSymbol) {
      notification.error({ description: 'stakeSymbol is required.' });
      return;
    }
    const typeIsAdd = !BigNumber(stakeData?.staked || 0).isZero();
    const stakeProps: IStakeWithConfirmProps = {
      type: typeIsAdd ? StakeType.ADD : StakeType.STAKE,
      stakeData: {
        ...stakeData,
        stakeInfos: stakeData?.subStakeInfos || [],
      },
      balanceDec: 'It is the amount of LP you hold in EcoEarn',
      balance: String(banlance),
      isEarlyStake: true,
      isFreezeAmount: true,
      isStakeRewards: true,
      freezeAmount: timesDecimals(banlance, decimal).toString(),
      earlyAmount: typeIsAdd ? BigNumber(stakeData?.staked || 0).toNumber() : undefined,
      onStake: async (amount, period) => {
        try {
          // const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
          const periodInSeconds = 5 * 60;
          const signParams: ILiquidityStakeSignParams = {
            lpAmount: String(lpAmount || ''),
            poolId: stakeData?.poolId || '',
            period: periodInSeconds,
            address: wallet?.address || '',
            dappId: dappIdToStakeOrRemove,
            liquidityIds,
          };
          const res = (await liquidityStakeSign(signParams)) || {};
          const { signature, seed, expirationTime } = res?.data || {};
          if (!signature || !seed || !expirationTime) throw Error(res?.message || '');
          const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`];
          let rawTransaction = null;
          try {
            rawTransaction = await getRawTransaction({
              walletInfo: wallet,
              walletType,
              caContractAddress: config?.caContractAddress || '',
              contractAddress: config?.rewardsContractAddress || '',
              methodName: 'StakeLiquidity',
              params: {
                liquidityInput: {
                  liquidityIds,
                  lpAmount,
                  dappId: signParams.dappId,
                  seed,
                  expirationTime,
                },
                poolId: signParams.poolId,
                period: signParams.period,
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
          const { data: TransactionId, message: errorMessage } = await liquidityStake({
            chainId: curChain!,
            rawTransaction: rawTransaction || '',
          });
          if (TransactionId) {
            const hasHistoryStake = !BigNumber(stakeData?.staked || 0).isZero();
            const params: any = {
              poolId: stakeData?.poolId || '',
              poolType: PoolType.LP,
            };
            const fixedParams = qs.stringify(params);
            const targetUrl = `/pool-detail?${fixedParams}`;
            store.dispatch(
              setConfirmInfo({
                backPath: targetUrl,
                poolType: PoolType.LP,
                type: hasHistoryStake ? TradeConfirmTypeEnum.Add : TradeConfirmTypeEnum.Stake,
                isStakeRewards: true,
                isStakeLiquidity: true,
                poolDetailPath: targetUrl,
                content: {
                  amount: divDecimals(lpAmount, decimal || 8).toString(),
                  days: period,
                  unlockDateTimeStamp: hasHistoryStake
                    ? dayjs(stakeData?.unlockTime).add(Number(period), 'day').valueOf()
                    : dayjs().add(Number(period), 'day').valueOf(),
                  tokenSymbol: stakeData?.stakeSymbol || '',
                  poolType: PoolType.LP,
                  rate: rate || 0,
                },
              }),
            );
            return { TransactionId } as ISendResult;
          } else {
            throw Error(errorMessage);
          }
        } catch (error) {
          const errorMsg = (error as Error).message;
          console.error(errorMsg);
          const { matchedErrorMsg, title } = matchErrorMsg(errorMsg, 'StakeLiquidity');
          if (matchedErrorMsg) notification.error({ description: matchedErrorMsg, message: title });
          throw Error(errorMsg);
        }
      },
      onSuccess: () => {
        console.log('===onSuccess');
        setIsPending(true);
      },
    };
    setStakeProps(stakeProps);
  }, [
    closeLoading,
    config,
    curChain,
    dappIdToStakeOrRemove,
    earlyStakeInfoLoaded,
    liquidityData,
    notification,
    showLoading,
    wallet,
    walletType,
  ]);

  const initPoolData = useCallback(
    async (props?: IFetchDataProps) => {
      const { withLoading = true } = props || {};
      if (!curChain || !rate || !wallet?.address) {
        return;
      }
      try {
        withLoading && showLoading();
        const { pools } = await fetchStakingPoolsData({
          poolType: PoolType.LP,
          maxResultCount: 20,
          skipCount: 0,
          address: wallet?.address || '',
          chainId: curChain,
          sorting: '',
          name: '',
        });
        withLoading && closeLoading();
        const poolInfo = (pools || [])
          ?.filter?.((i) => i?.rate == rate)
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
      } finally {
        withLoading && closeLoading();
      }
    },
    [closeLoading, curChain, notification, rate, showLoading, wallet?.address],
  );

  useEffect(() => {
    initPoolData();
  }, [initPoolData]);

  useInterval(
    () => {
      initPoolData({ withLoading: false });
    },
    30000,
    { immediate: false },
  );

  useEffect(() => {
    initLiquidityData();
  }, [initLiquidityData]);

  useEffect(() => {
    initStakeProps();
  }, [initStakeProps]);

  useInterval(
    () => {
      initLiquidityData({ needLoading: false });
    },
    20000,
    { immediate: false },
  );

  useEffect(() => {
    if (!isLogin) {
      router.replace('/staking');
    }
  }, [isLogin, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  return stakeProps ? (
    <div className="flex flex-col gap-6 max-w-[672px] mx-auto mt-6 md:mt-[48px]">
      <div className="bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder flex flex-col gap-6">
        <StakeTokenTitle
          imgs={poolInfo?.icons || []}
          poolType={PoolType.LP}
          tokenSymbol={poolInfo?.stakeSymbol || ''}
          type={'stakeRewards'}
          isAdd={stakeProps?.type === StakeType.ADD}
          rate={poolInfo?.rate || 0}
        />
        <StakeWithConfirm {...stakeProps} />
      </div>
      <AmountInfo poolInfo={poolInfo || {}} poolType={PoolType.LP} />
      <FaqList type="liquidity" />
    </div>
  ) : null;
}
