import { useModal } from '@ebay/nice-modal-react';
import { singleMessage } from '@portkey/did-ui-react';
import { WebLoginEvents, useWebLoginEvent } from 'aelf-web-login';
import { useInterval, useRequest } from 'ahooks';
import { message } from 'antd';
import {
  cancelSign,
  getEarlyStakeInfo,
  getPoolRewards,
  getSwapTransactionFee,
  liquidityMarket,
  liquidityStake,
  liquidityStakeSign,
  myLiquidity,
} from 'api/request';
import BigNumber from 'bignumber.js';
import AddLiquidityModal from 'components/AddLiquidityModal';
import RemoveLiquidityModal from 'components/RemoveLiquidityModal';
import StakeModalWithConfirm from 'components/StakeModalWithConfirm';
import { ZERO } from 'constants/index';
import { StakeLiquidity } from 'contract/rewards';
import dayjs from 'dayjs';
import { TFeeType } from 'hooks/useGetAwakenContract';
import useLoading from 'hooks/useLoading';
import usePair from 'hooks/usePair';
import useToken from 'hooks/useToken';
import { useWalletService } from 'hooks/useWallet';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { IContractError, ISendResult } from 'types';
import { PoolType, StakeType } from 'types/stake';
import { getTxResult } from 'utils/aelfUtils';
import {
  divDecimals,
  getPairTokenRatio,
  getTargetUnlockTimeStamp,
  timesDecimals,
} from 'utils/calculate';
import { matchErrorMsg } from 'utils/formatError';
import { getRawTransaction } from 'utils/getRawTransaction';
import useResponsive from 'utils/useResponsive';

export enum LiquidityListTypeEnum {
  My = 'My',
  Market = 'Market',
}

export default function useLiquidityListService() {
  const [data, setData] = useState<Array<ILiquidityItem>>([]);
  const { isLG } = useResponsive();
  const [currentList, setCurrentList] = useState<LiquidityListTypeEnum>(LiquidityListTypeEnum.My);
  const addModal = useModal(AddLiquidityModal);
  const removeModal = useModal(RemoveLiquidityModal);
  const { getPrice, getBalance } = useToken();
  const { getPairInfo } = usePair();
  const { showLoading, closeLoading } = useLoading();
  const { curChain, caContractAddress, rewardsContractAddress } = useGetCmsInfo() || {};
  const config = useGetCmsInfo();
  const { wallet, walletType } = useWalletService();
  const stakeModal = useModal(StakeModalWithConfirm);
  const router = useRouter();

  const { data: rewardsData } = useRequest(
    async () => {
      if (!wallet.address) return;
      try {
        const data = await getPoolRewards({
          address: wallet.address,
        });
        return data;
      } catch (error) {
        console.error('getPoolRewards error', error);
      }
    },
    { pollingInterval: 10000, refreshDeps: [data] },
  );

  const rewardsSymbol = useMemo(() => {
    return rewardsData?.pointsPoolAgg?.rewardsTokenName || '';
  }, [rewardsData?.pointsPoolAgg?.rewardsTokenName]);

  const getEarlyStakeInfoParams: Array<IGetEarlyStakeInfoParams> = useMemo(() => {
    return data.map((item) => {
      return {
        tokenName: item?.lpSymbol || '',
        address: wallet?.address || '',
        chainId: curChain!,
        poolType: PoolType.LP,
        rate: item?.rate || 0,
      };
    });
  }, [curChain, data, wallet?.address]);

  const { data: earlyStakeInfos } = useRequest(
    async () => {
      if (!wallet.address) return;
      try {
        const data = Promise.all(
          getEarlyStakeInfoParams.map((item) => {
            return getEarlyStakeInfo(item);
          }),
        );
        return (await (data || [])).map((item) => {
          return {
            ...item,
            unlockTime: getTargetUnlockTimeStamp(
              item?.stakingPeriod || 0,
              item?.lastOperationTime || 0,
              item?.unlockWindowDuration || 0,
            ).unlockTime,
          };
        });
      } catch (error) {
        console.error('getEarlyStakeInfos error', error);
      }
    },
    { pollingInterval: 10000, refreshDeps: [data] },
  );

  console.log('=====earlyStakeInfos', earlyStakeInfos);

  useWebLoginEvent(WebLoginEvents.LOGOUT, () => {
    router.replace('/farms');
  });

  const totalEarlyStakeAmount = useMemo(() => {
    if (!rewardsData) return 0;
    const { pointsPoolAgg, tokenPoolAgg, lpPoolAgg } = rewardsData;
    return ZERO.plus(pointsPoolAgg?.frozen || 0)
      .plus(pointsPoolAgg?.withdrawable || 0)
      .plus(tokenPoolAgg?.frozen || 0)
      .plus(tokenPoolAgg?.withdrawable || 0)
      .plus(lpPoolAgg?.frozen || 0)
      .plus(lpPoolAgg?.withdrawable || 0)
      .toString();
  }, [rewardsData]);

  const totalStakeAmount = useMemo(() => {
    return divDecimals(totalEarlyStakeAmount, rewardsData?.pointsPoolAgg?.decimal || 8).toString();
  }, [rewardsData?.pointsPoolAgg?.decimal, totalEarlyStakeAmount]);

  const totalStakeAmountNotEnough = useMemo(() => {
    return BigNumber(totalStakeAmount).lt(10);
  }, [totalStakeAmount]);

  console.log('=====totalStakeAmountNotEnough', totalStakeAmountNotEnough);

  const isAddBtnDisabled = useCallback(
    ({ index }: { index: number }) => {
      return (
        totalStakeAmountNotEnough ||
        (!BigNumber(earlyStakeInfos?.[index]?.staked || 0).isZero() &&
          dayjs(earlyStakeInfos?.[index]?.unlockTime || 0).isBefore(dayjs()))
      );
    },
    [earlyStakeInfos, totalStakeAmountNotEnough],
  );

  const isStakeBtnDisabled = useCallback(
    ({ index }: { index: number }) => {
      return (
        BigNumber(data?.[index]?.banlance || 0).isZero() ||
        (!BigNumber(earlyStakeInfos?.[index]?.staked || 0).isZero() &&
          dayjs(earlyStakeInfos?.[index]?.unlockTime || 0).isBefore(dayjs()))
      );
    },
    [data, earlyStakeInfos],
  );

  const isRemoveBtnDisabled = useCallback(
    ({ index }: { index: number }) => {
      return BigNumber(data?.[index]?.banlance || 0).isZero();
    },
    [data],
  );

  const getAddBtnTip = useCallback(
    ({ index }: { index: number }) => {
      const bigValue = BigNumber(totalStakeAmount || 0);
      return bigValue.isZero()
        ? 'You currently have no SGR rewards available for adding liquidity.'
        : bigValue.lt(10)
        ? 'The reward amount for adding liquidity can not be less than 10 SGR.'
        : !BigNumber(earlyStakeInfos?.[index]?.staked || 0).isZero() &&
          dayjs(earlyStakeInfos?.[index]?.unlockTime || 0).isBefore(dayjs())
        ? 'Your staking has expired and cannot be added. Please proceed to "Farms(LP Staking)" for renewal.'
        : '';
    },
    [earlyStakeInfos, totalStakeAmount],
  );

  const getStakeBtnTip = useCallback(
    ({ index }: { index: number }) => {
      if (BigNumber(data?.[index]?.banlance || 0).isZero()) {
        return 'No LP amount available for staking.';
      }
      return !BigNumber(earlyStakeInfos?.[index]?.staked || 0).isZero() &&
        dayjs(earlyStakeInfos?.[index]?.unlockTime || 0).isBefore(dayjs())
        ? 'Your staking has expired and cannot be added. Please proceed to "Farms(LP Staking)" for renewal.'
        : '';
    },
    [data, earlyStakeInfos],
  );

  const getRemoveBtnTip = useCallback(
    ({ index }: { index: number }) => {
      return BigNumber(data?.[index]?.banlance || 0).isZero()
        ? 'No LP amount available for removal.'
        : '';
    },
    [data],
  );

  console.log('totalEarlyStakeAmount', totalEarlyStakeAmount);

  const mobileDataList = useMemo(() => {
    return (data || []).map((item, index) => {
      return {
        ...item,
        addBtnDisabled: isAddBtnDisabled({ index }),
        stakeBtnDisabled: isStakeBtnDisabled({ index }),
        removeBtnDisabled: isRemoveBtnDisabled({ index }),
        addBtnTip: getAddBtnTip({ index }),
        stakeBtnTip: getStakeBtnTip({ index }),
        removeBtnTip: getRemoveBtnTip({ index }),
      };
    });
  }, [
    data,
    getAddBtnTip,
    getRemoveBtnTip,
    getStakeBtnTip,
    isAddBtnDisabled,
    isRemoveBtnDisabled,
    isStakeBtnDisabled,
  ]);

  const fetchData = useCallback(
    async (props?: { needLoading?: boolean }) => {
      const { needLoading = true } = props || {};
      let list: Array<ILiquidityItem>;
      if (!wallet.address) return;
      try {
        needLoading && showLoading();
        if (currentList === LiquidityListTypeEnum.My) {
          list = await myLiquidity({ address: wallet.address });
        } else {
          list = await liquidityMarket({ address: wallet.address });
        }
        needLoading && closeLoading();
        setData(list || []);
      } catch (error) {
        console.error('getLiquidityList error', error);
      } finally {
        needLoading && closeLoading();
      }
    },
    [closeLoading, currentList, showLoading, wallet.address],
  );

  const lpPoolLongestReleaseTime = useMemo(() => {
    const { lpPoolAgg } = rewardsData || {};
    const { claimInfos } = lpPoolAgg || {};
    if (claimInfos && claimInfos?.length > 0) {
      return claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0;
    }
    return 0;
  }, [rewardsData]);

  const onAddAndStake = useCallback(
    async ({
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
    }: ILiquidityItem) => {
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
      const tokens = tokenASymbol === rewardsSymbol ? defaultTokens : defaultTokens.reverse();
      const decimals = [
        tokens[0].symbol === 'USDT' ? usdDecimal || 6 : decimal || 8,
        tokens[1].symbol === 'USDT' ? usdDecimal || 6 : decimal || 8,
      ];
      try {
        showLoading();
        const [tokenAPrice, tokenBPrice, tokenBBalance, pairInfo] = await Promise.all([
          getPrice(tokens[0].symbol),
          getPrice(tokens[1].symbol),
          getBalance(tokens[1].symbol),
          getPairInfo(String(rate) as TFeeType, pair, lpSymbol),
        ]);
        closeLoading();
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
        addModal.show({
          tokenA: {
            resource: 'rewards',
            balance: String(totalEarlyStakeAmount),
            decimal: decimals[0],
            usdPrice: tokenAPrice || '0',
            icon: icons?.[0] || '',
            symbol: tokens[0].symbol,
            position: String(
              currentList === LiquidityListTypeEnum.Market
                ? tokens[0].marketUnStakingAmount
                : tokens[0].unStakingAmount || '0',
            ),
          },
          tokenB: {
            resource: 'wallet',
            balance: String(tokenBBalance),
            decimal: decimals[1],
            usdPrice: tokenBPrice || '0',
            icon: icons?.[1] || '',
            symbol: tokens[1].symbol,
            position: String(
              currentList === LiquidityListTypeEnum.Market
                ? tokens[1].marketUnStakingAmount
                : tokens[1].unStakingAmount || '0',
            ),
          },
          lpToken: {
            icons,
            symbol: lpSymbol,
            rate: String(rate),
            balance: String(pairInfo.balance || 0),
            decimal: decimal,
            position:
              currentList === LiquidityListTypeEnum.Market
                ? String(ecoEarnBanlance || 0)
                : String(banlance),
          },
          per1,
          per2,
          reserves: pairInfo.reserves,
          totalSupply: pairInfo?.totalSupply || '0',
          dappId: rewardsData?.dappId || '',
          claimInfos: [
            ...(rewardsData?.pointsPoolAgg?.claimInfos || []),
            ...(rewardsData?.tokenPoolAgg?.claimInfos || []),
            ...(rewardsData?.lpPoolAgg?.claimInfos || []),
          ],
          lpPoolLongestReleaseTime,
          onSuccess: () => {
            addModal?.remove();
            fetchData();
          },
        });
      } catch (error) {
        console.error('onAddAndStake error', error);
        message.error((error as IContractError)?.errorMessage?.message);
      } finally {
        closeLoading();
      }
    },
    [
      addModal,
      closeLoading,
      currentList,
      fetchData,
      getBalance,
      getPairInfo,
      getPrice,
      lpPoolLongestReleaseTime,
      rewardsData?.dappId,
      rewardsData?.lpPoolAgg?.claimInfos,
      rewardsData?.pointsPoolAgg?.claimInfos,
      rewardsData?.tokenPoolAgg?.claimInfos,
      rewardsSymbol,
      showLoading,
      totalEarlyStakeAmount,
    ],
  );

  const onRemove = useCallback(
    async ({
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
    }: ILiquidityItem) => {
      const pair = lpSymbol?.split(' ')?.[1];
      const defaultTokens = [
        { symbol: tokenASymbol, amount: tokenAAmount },
        { symbol: tokenBSymbol, amount: tokenBAmount },
      ];
      const tokens = tokenASymbol === rewardsSymbol ? defaultTokens : defaultTokens.reverse();
      const decimals = [
        tokens[0].symbol === 'USDT' ? usdDecimal || 6 : decimal || 8,
        tokens[1].symbol === 'USDT' ? usdDecimal || 6 : decimal || 8,
      ];
      try {
        showLoading();
        const [pairInfo, transactionFee] = await Promise.all([
          getPairInfo(String(rate) as TFeeType, pair, lpSymbol),
          getSwapTransactionFee(),
        ]);
        closeLoading();
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
        removeModal.show({
          tokenA: {
            amount: timesDecimals(tokens[0].amount, decimals[0]).toString(),
            decimal: decimals[0],
            icon: icons?.[0] || '',
            symbol: tokens[0].symbol,
            fromRewards: true,
          },
          tokenB: {
            amount: timesDecimals(tokens[1].amount, decimals[1]).toString(),
            decimal: decimals[1],
            icon: icons?.[1] || '',
            symbol: tokens[1].symbol,
          },
          lpToken: {
            icons,
            symbol: lpSymbol,
            amount: timesDecimals(banlance, decimal).toString(),
            usdAmount: timesDecimals(value, decimal).toString(),
            decimal: decimal,
          },
          per1,
          per2,
          reserves: pairInfo.reserves,
          fee: transactionFee?.transactionFee || '0',
          liquidityIds,
          dappId: rewardsData?.dappId || '',
          totalSupply: pairInfo?.totalSupply || '0',
          lpAmount,
          onSuccess: () => {
            removeModal?.remove();
            fetchData();
          },
        });
      } catch (error) {
        console.error('onRemove error', error);
      } finally {
        closeLoading();
      }
    },
    [
      closeLoading,
      fetchData,
      getPairInfo,
      removeModal,
      rewardsData?.dappId,
      rewardsSymbol,
      showLoading,
    ],
  );

  const onStake = useCallback(
    async ({ banlance, lpSymbol, rate, decimal, liquidityIds, lpAmount }: ILiquidityItem) => {
      let stakeData: IEarlyStakeInfo;
      try {
        showLoading();
        stakeData = await getEarlyStakeInfo({
          tokenName: lpSymbol || '',
          address: wallet?.address || '',
          chainId: curChain!,
          poolType: PoolType.LP,
          rate: rate,
        });
        closeLoading();
        if (stakeData) {
          const fixedEarlyStakeData = {
            ...stakeData,
            unlockTime: getTargetUnlockTimeStamp(
              stakeData?.stakingPeriod || 0,
              stakeData?.lastOperationTime || 0,
              stakeData?.unlockWindowDuration || 0,
            ).unlockTime,
          };
          stakeData = fixedEarlyStakeData;
          if (
            !BigNumber(stakeData?.staked || 0).isZero() &&
            dayjs(stakeData?.unlockTime || 0).isBefore(dayjs())
          ) {
            message.error(
              'Stake has expired, cannot be added stake. Please renew the staking first.',
            );
            return;
          }
        } else {
          message.error('no pool');
          return;
        }
      } catch (error) {
        singleMessage.error('getPool failed');
        return;
      } finally {
        closeLoading();
      }
      const { stakeSymbol = '' } = stakeData;
      if (!stakeSymbol) {
        singleMessage.error('stakeSymbol is required.');
        return;
      }
      const typeIsAdd = !BigNumber(stakeData?.staked || 0).isZero();
      stakeModal.show({
        isStakeRewards: true,
        type: typeIsAdd ? StakeType.ADD : StakeType.STAKE,
        stakeData: {
          ...stakeData,
          stakeInfos: stakeData?.subStakeInfos || [],
          longestReleaseTime: lpPoolLongestReleaseTime || 0,
        },
        balanceDec: 'It is the amount of LP you hold in EcoEarn',
        balance: String(banlance),
        isEarlyStake: true,
        isFreezeAmount: true,
        freezeAmount: timesDecimals(banlance, decimal).toString(),
        earlyAmount: typeIsAdd ? BigNumber(stakeData?.staked || 0).toNumber() : undefined,
        onStake: async (amount, period) => {
          try {
            showLoading();
            const periodInSeconds = dayjs.duration(Number(period), 'day').asSeconds();
            const claimInfos = rewardsData?.lpPoolAgg?.claimInfos || [];
            const longestReleaseTime =
              claimInfos && claimInfos?.length > 0
                ? claimInfos?.[claimInfos?.length - 1]?.releaseTime
                : 0;
            const dappId = rewardsData?.dappId || '';
            const signParams: ILiquidityStakeSignParams = {
              lpAmount: String(lpAmount || ''),
              poolId: stakeData?.poolId || '',
              period: periodInSeconds,
              address: wallet?.address || '',
              dappId,
              liquidityIds,
            };
            const { seed, signature, expirationTime } =
              (await liquidityStakeSign(signParams)) || {};
            closeLoading();
            if (!seed || !signature || !expirationTime) throw Error();
            const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`];
            let rawTransaction = null;
            try {
              rawTransaction = await getRawTransaction({
                walletInfo: wallet,
                walletType,
                caContractAddress: caContractAddress || '',
                contractAddress: rewardsContractAddress || '',
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
                  longestReleaseTime: BigNumber(longestReleaseTime).div(1000).dp(0).toNumber(),
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
            const { data: TransactionId, message: errorMessage } = await liquidityStake({
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
                'StakeLiquidity',
              );
              if (!showInModal) message.error(matchedErrorMsg);
              throw Error(showInModal ? matchedErrorMsg : '');
            }
          } catch (error) {
            const errorMsg = (error as Error).message;
            console.error(errorMsg);
            throw Error(errorMsg);
          } finally {
            closeLoading();
          }
        },
        onSuccess: () => {
          fetchData();
        },
      });
    },
    [
      caContractAddress,
      closeLoading,
      config,
      curChain,
      fetchData,
      lpPoolLongestReleaseTime,
      rewardsContractAddress,
      rewardsData?.dappId,
      rewardsData?.lpPoolAgg?.claimInfos,
      showLoading,
      stakeModal,
      wallet,
      walletType,
    ],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useInterval(
    () => {
      fetchData({ needLoading: false });
    },
    20000,
    { immediate: false },
  );

  const segmentedOptions: Array<{ label: ReactNode; value: string }> = [
    { label: 'My Liquidity', value: LiquidityListTypeEnum.My },
    { label: 'Market', value: LiquidityListTypeEnum.Market },
  ];

  const handleSegmentChange = useCallback(
    (value: string) => {
      setCurrentList(value as LiquidityListTypeEnum);
      setData([]);
    },
    [setCurrentList],
  );

  const handleAddLiquidity = useCallback(() => {
    setCurrentList(LiquidityListTypeEnum.Market);
    setData([]);
  }, []);

  return {
    data,
    isLG,
    currentList,
    handleSegmentChange,
    segmentedOptions,
    handleAddLiquidity,
    onAddAndStake,
    onRemove,
    onStake,
    getAddBtnTip,
    getStakeBtnTip,
    getRemoveBtnTip,
    isAddBtnDisabled,
    isStakeBtnDisabled,
    isRemoveBtnDisabled,
    totalEarlyStakeAmount,
    mobileDataList,
  };
}
