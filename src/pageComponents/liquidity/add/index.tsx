import { useInterval, useRequest } from 'ahooks';
import { fetchStakingPoolsData, getPoolRewards, liquidityMarket } from 'api/request';
import useLoading from 'hooks/useLoading';
import { useWalletService } from 'hooks/useWallet';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AddLiquidity, { IAddLiquidityProps } from 'components/AddLiquidity';
import useToken from 'hooks/useToken';
import usePair from 'hooks/usePair';
import { TFeeType } from 'hooks/useGetAwakenContract';
import { getPairTokenRatio, getTargetUnlockTimeStamp } from 'utils/calculate';
import { PoolType } from 'types/stake';
import { ZERO } from 'constants/index';
import { isTokenSymbolNeedReverse } from 'utils/format';
import { IContractError } from 'types';
import { max } from 'lodash-es';
import useNotification from 'hooks/useNotification';
import FaqList from 'components/FaqList';
import BackCom from 'pageComponents/poolDetail/components/BackCom';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import StakeWithConfirm, { IStakeWithConfirmProps } from 'components/StakeWithConfirm';
import AmountInfo from 'pageComponents/poolDetail/components/AmountInfo';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import Loading from 'components/Loading';

interface IFetchDataProps {
  withLoading?: boolean;
}

export default function AddLiquidityPage() {
  const { rate } = useParams() as { rate: number | string };
  const { wallet } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const [liquidityData, setLiquidityData] = useState<ILiquidityItem>();
  const [addLiquidityProps, setAddLiquidityProps] = useState<IAddLiquidityProps>();
  const { getPrice, getBalance } = useToken();
  const { getPairInfo } = usePair();
  const notification = useNotification();
  const [onConfirmStep, setOnConfirmStep] = useState(false);
  const { curChain } = useGetCmsInfo() || {};
  const [stakeProps, setStakeProps] = useState<IStakeWithConfirmProps>();
  const [poolInfo, setPoolInfo] = useState<IStakePoolData>();
  const { isLogin } = useGetLoginStatus();
  const router = useRouter();
  const [priceLoaded, setPriceLoaded] = useState(false);
  const { isConnected } = useConnectWallet();
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

  const rewardsInfoToStake = useMemo(() => {
    return rewardsData?.filter(
      (item) =>
        item.rewardsTokenName === rewardsSymbol &&
        ZERO.plus(item?.rewardsInfo?.frozen || 0)
          .plus(item?.rewardsInfo?.withdrawable || 0)
          .gt(0),
    );
  }, [rewardsData, rewardsSymbol]);

  const totalEarlyStakeAmount = useMemo(() => {
    if (!rewardsInfoToStake) return 0;
    let total = ZERO;
    rewardsInfoToStake?.forEach((rewardsItem) => {
      const { withdrawable, frozen } = rewardsItem?.rewardsInfo || {};
      total = total.plus(withdrawable || 0).plus(frozen || 0);
    });
    return total.toString();
  }, [rewardsInfoToStake]);

  const claimInfosToStake = useMemo(() => {
    const claimInfos: Array<any> = [];
    rewardsInfoToStake?.forEach((item) => {
      claimInfos.push(...(item?.rewardsInfo?.claimInfos || []));
    });
    return claimInfos;
  }, [rewardsInfoToStake]);

  const poolIdsToStake = useMemo(() => {
    return rewardsInfoToStake?.map((item) => item?.poolId)?.filter((i) => i);
  }, [rewardsInfoToStake]);

  const dappIdToStake = useMemo(() => {
    //FIXME:
    const pointsPoolsIds = rewardsInfoToStake
      ?.filter((item) => item?.poolType === PoolType.POINTS)
      ?.map((item) => item?.dappId);
    return pointsPoolsIds && pointsPoolsIds?.length > 0 ? pointsPoolsIds : [];
  }, [rewardsInfoToStake]);

  const dappId = useMemo(() => {
    //FIXME:
    return rewardsInfoToStake?.[0]?.dappId || '';
  }, [rewardsInfoToStake]);

  const longestReleaseTime = useMemo(() => {
    let longestReleaseTime = 0;
    rewardsInfoToStake?.forEach((item) => {
      const claimInfos = item?.rewardsInfo?.claimInfos || [];
      longestReleaseTime =
        max([longestReleaseTime, claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0]) || 0;
    });
    return longestReleaseTime;
  }, [rewardsInfoToStake]);

  const initLiquidityData = useCallback(
    async (props?: { needLoading?: boolean }) => {
      const { needLoading = true } = props || {};
      let list: Array<ILiquidityItem>;
      if (!wallet?.address) return;
      try {
        needLoading && showLoading();
        list = await liquidityMarket({ address: wallet.address });
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

  const initAddLiquidityProps = useCallback(async () => {
    if (!liquidityData || !rewardsData || !isConnected) return;
    const {
      lpSymbol,
      icons,
      rate,
      tokenASymbol,
      tokenBSymbol,
      decimal,
      usdDecimal,
      banlance,
      tokenAAmount,
      tokenBAmount,
      ecoEarnBanlance,
      ecoEarnTokenAAmount,
      ecoEarnTokenBAmount,
      ecoEarnTokenAUnStakingAmount,
      ecoEarnTokenBUnStakingAmount,
      tokenAUnStakingAmount,
      tokenBUnStakingAmount,
    } = liquidityData;
    const pair = lpSymbol?.split(' ')?.[1];
    const defaultTokens = [
      {
        symbol: tokenASymbol,
        balance: tokenAAmount,
        ecoBalance: ecoEarnTokenAAmount || 0,
        marketUnStakingAmount: ecoEarnTokenAUnStakingAmount,
        unStakingAmount: tokenAUnStakingAmount,
      },
      {
        symbol: tokenBSymbol,
        balance: tokenBAmount,
        ecoBalance: ecoEarnTokenBAmount || 0,
        marketUnStakingAmount: ecoEarnTokenBUnStakingAmount,
        unStakingAmount: tokenBUnStakingAmount,
      },
    ];
    const tokens = tokenASymbol === rewardsSymbol ? defaultTokens : [...defaultTokens].reverse();
    const decimals = [
      tokens[0].symbol === 'USDT' ? usdDecimal || 6 : decimal || 8,
      tokens[1].symbol === 'USDT' ? usdDecimal || 6 : decimal || 8,
    ];
    try {
      !priceLoaded && showLoading();
      const [tokenAPrice, tokenBPrice, tokenBBalance, pairInfo] = await Promise.all([
        getPrice(tokens[0].symbol),
        getPrice(tokens[1].symbol),
        getBalance(tokens[1].symbol),
        getPairInfo(String(rate) as TFeeType, pair, lpSymbol),
      ]);
      setPriceLoaded(true);
      !priceLoaded && closeLoading();
      const per1 = getPairTokenRatio({
        tokenA: {
          decimal: decimals[0],
          symbol: tokens[0].symbol,
        },
        tokenB: {
          decimal: decimals[1],
          symbol: tokens[1].symbol,
        },
        reserves: pairInfo.reserves,
      });
      const per2 = getPairTokenRatio({
        tokenA: {
          decimal: decimals[1],
          symbol: tokens[1].symbol,
        },
        tokenB: {
          decimal: decimals[0],
          symbol: tokens[0].symbol,
        },
        reserves: pairInfo.reserves,
      });
      const liquidityProps: IAddLiquidityProps = {
        tokenA: {
          resource: 'rewards',
          balance: String(totalEarlyStakeAmount),
          decimal: decimals[0],
          usdPrice: tokenAPrice || '0',
          icon: isTokenSymbolNeedReverse(lpSymbol || '') ? icons?.[1] || '' : icons?.[0] || '',
          symbol: tokens[0].symbol,
          position: String(tokens[0].marketUnStakingAmount),
        },
        tokenB: {
          resource: 'wallet',
          balance: String(tokenBBalance),
          decimal: decimals[1],
          usdPrice: tokenBPrice || '0',
          icon: isTokenSymbolNeedReverse(lpSymbol || '') ? icons?.[0] || '' : icons?.[1] || '',
          symbol: tokens[1].symbol,
          position: String(tokens[1].marketUnStakingAmount),
        },
        lpToken: {
          icons,
          symbol: lpSymbol,
          rate: String(rate),
          balance: String(pairInfo.balance || 0),
          decimal: decimal,
          position: String(ecoEarnBanlance || 0),
        },
        per1,
        per2,
        reserves: pairInfo?.reserves || {},
        totalSupply: pairInfo?.totalSupply || '0',
        dappId: dappId || '',
        poolIdsToStake: poolIdsToStake || [],
        dappIdsToStake: dappIdToStake || [],
        claimInfos: claimInfosToStake || [],
        longestReleaseTime,
        onSuccess: () => {
          console.log('===onSuccess');
          setIsPending(true);
        },
        onNext: (data) => {
          setStakeProps(data);
          setOnConfirmStep(true);
        },
      };
      setAddLiquidityProps(liquidityProps);
    } catch (error) {
      console.error('onAddAndStake error', error);
      const errorTip = (error as IContractError)?.errorMessage?.message;
      errorTip && notification.error({ description: errorTip });
    } finally {
      !priceLoaded && closeLoading();
    }
  }, [
    claimInfosToStake,
    closeLoading,
    dappId,
    dappIdToStake,
    getBalance,
    getPairInfo,
    getPrice,
    isConnected,
    liquidityData,
    longestReleaseTime,
    notification,
    poolIdsToStake,
    priceLoaded,
    rewardsData,
    rewardsSymbol,
    showLoading,
    totalEarlyStakeAmount,
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
          address: wallet.address,
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
    initAddLiquidityProps();
  }, [initAddLiquidityProps]);

  useEffect(() => {
    if (!isLogin) {
      router.replace('/staking');
    }
  }, [isLogin, router]);

  useInterval(
    () => {
      initLiquidityData({ needLoading: false });
    },
    20000,
    { immediate: false },
  );

  if (isPending) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return addLiquidityProps ? (
    <div className="flex flex-col gap-6 max-w-[672px] mx-auto mt-6 md:mt-[48px]">
      {onConfirmStep && (
        <BackCom
          onClick={() => {
            setOnConfirmStep(false);
          }}
        />
      )}
      {onConfirmStep ? (
        stakeProps ? (
          <div className="bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder flex flex-col gap-8">
            <p className="text-neutralTitle font-[600] text-2xl">You will receive LP & stake</p>
            <StakeWithConfirm {...stakeProps} />
          </div>
        ) : null
      ) : (
        <AddLiquidity {...addLiquidityProps} />
      )}
      {onConfirmStep && <AmountInfo poolInfo={poolInfo || {}} poolType={PoolType.LP} />}
      <FaqList type="liquidity" />
    </div>
  ) : null;
}
