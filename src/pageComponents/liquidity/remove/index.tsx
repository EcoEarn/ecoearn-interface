import { useInterval, useRequest } from 'ahooks';
import { getPoolRewards, getSwapTransactionFee, myLiquidity } from 'api/request';
import useLoading from 'hooks/useLoading';
import { useWalletService } from 'hooks/useWallet';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import usePair from 'hooks/usePair';
import { TFeeType } from 'hooks/useGetAwakenContract';
import { getPairTokenRatio, timesDecimals } from 'utils/calculate';
import { PoolType } from 'types/stake';
import { isTokenSymbolNeedReverse } from 'utils/format';
import FaqList from 'components/FaqList';
import BackCom from 'pageComponents/poolDetail/components/BackCom';
import RemoveLiquidity, { IRemoveLiquidityProps } from 'components/RemoveLiquidity';
import Receive, { IReceiveProps } from 'components/Receive';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import Loading from 'components/Loading';

export default function RemoveLiquidityPage() {
  const { rate } = useParams() as { rate: number | string };
  const { wallet } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const [liquidityData, setLiquidityData] = useState<ILiquidityItem>();
  const [removeLiquidityProps, setRemoveLiquidityProps] = useState<IRemoveLiquidityProps>();
  const { getPairInfo } = usePair();
  const [onConfirmStep, setOnConfirmStep] = useState(false);
  const [receiveProps, setReceiveProps] = useState<IReceiveProps>();
  const { isLogin } = useGetLoginStatus();
  const router = useRouter();
  const { isConnected } = useConnectWallet();
  const [isPriceLoaded, setIsPriceLoaded] = useState(false);
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

  const initRemoveLiquidityProps = useCallback(async () => {
    if (!liquidityData || !isConnected) return;
    const {
      lpSymbol,
      icons,
      rate,
      tokenAAmount,
      tokenBAmount,
      tokenASymbol,
      tokenBSymbol,
      banlance,
      decimal,
      value,
      liquidityIds,
      usdDecimal,
      lpAmount,
    } = liquidityData;
    const pair = lpSymbol?.split(' ')?.[1];
    const defaultTokens = [
      { symbol: tokenASymbol, amount: tokenAAmount },
      { symbol: tokenBSymbol, amount: tokenBAmount },
    ];
    const tokens = tokenASymbol === rewardsSymbol ? defaultTokens : [...defaultTokens].reverse();
    const decimals = [
      tokens[0].symbol === 'USDT' ? usdDecimal || 6 : decimal || 8,
      tokens[1].symbol === 'USDT' ? usdDecimal || 6 : decimal || 8,
    ];
    try {
      !isPriceLoaded && showLoading();
      const [pairInfo, transactionFee] = await Promise.all([
        getPairInfo(String(rate) as TFeeType, pair, lpSymbol),
        getSwapTransactionFee(),
      ]);
      setIsPriceLoaded(true);
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
      const removeLiquidityProps: IRemoveLiquidityProps = {
        tokenA: {
          amount: timesDecimals(tokens[0].amount, decimals[0]).toString(),
          decimal: decimals[0],
          icon: isTokenSymbolNeedReverse(lpSymbol || '') ? icons?.[1] || '' : icons?.[0] || '',
          symbol: tokens[0].symbol,
          fromRewards: true,
        },
        tokenB: {
          amount: timesDecimals(tokens[1].amount, decimals[1]).toString(),
          decimal: decimals[1],
          icon: isTokenSymbolNeedReverse(lpSymbol || '') ? icons?.[0] || '' : icons?.[1] || '',
          symbol: tokens[1].symbol,
        },
        lpToken: {
          icons,
          symbol: lpSymbol,
          amount: timesDecimals(banlance, decimal).toString(),
          usdAmount: timesDecimals(value, decimal).toString(),
          decimal: decimal,
          rate: String(rate),
        },
        per1,
        per2,
        reserves: pairInfo.reserves || {},
        fee: transactionFee?.transactionFee || '0',
        liquidityIds,
        dappId: dappIdToStakeOrRemove || '',
        totalSupply: pairInfo?.totalSupply || '0',
        lpAmount: lpAmount || '0',
        onSuccess: () => {
          console.log('===onSuccess');
          setIsPending(true);
        },
        onNext: (data) => {
          setReceiveProps(data);
          setOnConfirmStep(true);
        },
      };
      setRemoveLiquidityProps(removeLiquidityProps);
    } catch (error) {
      console.error('onRemove error', error);
    } finally {
      !isPriceLoaded && closeLoading();
    }
  }, [
    closeLoading,
    dappIdToStakeOrRemove,
    getPairInfo,
    isConnected,
    isPriceLoaded,
    liquidityData,
    rewardsSymbol,
    showLoading,
  ]);

  useEffect(() => {
    initLiquidityData();
  }, [initLiquidityData]);

  useEffect(() => {
    initRemoveLiquidityProps();
  }, [initRemoveLiquidityProps]);

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
      <div className="flex justify-center items-center w-full h-full">
        <Loading />
      </div>
    );
  }

  return removeLiquidityProps ? (
    <div className="flex flex-col gap-6 max-w-[672px] mx-auto mt-6 md:mt-[48px]">
      {onConfirmStep && (
        <BackCom
          onClick={() => {
            setOnConfirmStep(false);
          }}
        />
      )}
      {onConfirmStep ? (
        receiveProps ? (
          <Receive {...receiveProps} />
        ) : null
      ) : (
        <RemoveLiquidity {...removeLiquidityProps} />
      )}
      <FaqList type="liquidity" />
    </div>
  ) : null;
}
