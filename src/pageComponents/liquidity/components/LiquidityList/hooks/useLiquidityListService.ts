import { useModal } from '@ebay/nice-modal-react';
import { singleMessage } from '@portkey/did-ui-react';
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
import dayjs from 'dayjs';
import { TFeeType } from 'hooks/useGetAwakenContract';
import useLoading from 'hooks/useLoading';
import useNotification from 'hooks/useNotification';
import usePair from 'hooks/usePair';
import useStakeConfig from 'hooks/useStakeConfig';
import useToken from 'hooks/useToken';
import { useWalletService } from 'hooks/useWallet';
import { max } from 'lodash-es';
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
import { formatTokenSymbol, isTokenSymbolNeedReverse } from 'utils/format';
import { matchErrorMsg } from 'utils/formatError';
import { getRawTransaction } from 'utils/getRawTransaction';
import { fixEarlyStakeData } from 'utils/stake';
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
  const { wallet, walletType, isConnectWallet } = useWalletService();
  const stakeModal = useModal(StakeModalWithConfirm);
  const router = useRouter();
  const { min } = useStakeConfig();
  const notification = useNotification();

  useEffect(() => {
    if (!isConnectWallet) {
      router.replace('/staking');
    }
  }, [isConnectWallet, router]);

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
    { pollingInterval: 10000, refreshDeps: [data] },
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

  const dappIdToStakeOrRemove = useMemo(() => {
    //FIXME:
    return (
      rewardsData?.filter((item) => item?.rewardsTokenName === rewardsSymbol)?.[0]?.dappId || ''
    );
  }, [rewardsData, rewardsSymbol]);

  const dappId = useMemo(() => {
    //FIXME:
    return rewardsInfoToStake?.[0]?.dappId || '';
  }, [rewardsInfoToStake]);

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
      if (!wallet?.address) return;
      try {
        const data = Promise.all(
          getEarlyStakeInfoParams.map((item) => {
            return getEarlyStakeInfo(item);
          }),
        );
        return (await (data || [])).map((item) => {
          const data = item?.[0];
          return {
            ...data,
            unlockTime: getTargetUnlockTimeStamp(
              data?.stakingPeriod || 0,
              data?.lastOperationTime || 0,
              data?.unlockWindowDuration || 0,
            ).unlockTime,
          };
        });
      } catch (error) {
        console.error('getEarlyStakeInfos error', error);
      }
    },
    { pollingInterval: 10000, refreshDeps: [data] },
  );

  const totalEarlyStakeAmount = useMemo(() => {
    if (!rewardsInfoToStake) return 0;
    let total = ZERO;
    rewardsInfoToStake?.forEach((rewardsItem) => {
      const { withdrawable, frozen } = rewardsItem?.rewardsInfo || {};
      total = total.plus(withdrawable || 0).plus(frozen || 0);
    });
    return total.toString();
  }, [rewardsInfoToStake]);

  const totalStakeAmount = useMemo(() => {
    //FIXME: 8
    return divDecimals(totalEarlyStakeAmount, 8).toString();
  }, [totalEarlyStakeAmount]);

  const totalStakeAmountNotEnough = useMemo(() => {
    return BigNumber(totalStakeAmount).lt(min);
  }, [min, totalStakeAmount]);

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
      const rewardsTokenSymbol = formatTokenSymbol(rewardsSymbol);
      return bigValue.isZero()
        ? `You currently have no ${rewardsTokenSymbol} rewards available for adding liquidity.`
        : bigValue.lt(min)
        ? `The reward amount for adding liquidity can not be less than ${min} ${rewardsTokenSymbol}.`
        : !BigNumber(earlyStakeInfos?.[index]?.staked || 0).isZero() &&
          dayjs(earlyStakeInfos?.[index]?.unlockTime || 0).isBefore(dayjs())
        ? 'Your staking has expired and cannot be added. Please proceed to "Farms(LP Staking)" for renewal.'
        : '';
    },
    [earlyStakeInfos, min, rewardsSymbol, totalStakeAmount],
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
      if (!wallet?.address) return;
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
    [closeLoading, currentList, showLoading, wallet?.address],
  );

  const longestReleaseTime = useMemo(() => {
    let longestReleaseTime = 0;
    rewardsInfoToStake?.forEach((item) => {
      const claimInfos = item?.rewardsInfo?.claimInfos || [];
      longestReleaseTime =
        max([longestReleaseTime, claimInfos?.[claimInfos?.length - 1]?.releaseTime || 0]) || 0;
    });
    return longestReleaseTime;
  }, [rewardsInfoToStake]);

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
      const tokens = tokenASymbol === rewardsSymbol ? defaultTokens : [...defaultTokens].reverse();
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
            icon: isTokenSymbolNeedReverse(lpSymbol || '') ? icons?.[1] || '' : icons?.[0] || '',
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
            icon: isTokenSymbolNeedReverse(lpSymbol || '') ? icons?.[0] || '' : icons?.[1] || '',
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
          dappId: dappId || '',
          poolIdsToStake: poolIdsToStake || [],
          dappIdsToStake: dappIdToStake || [],
          claimInfos: claimInfosToStake || [],
          longestReleaseTime,
          onSuccess: () => {
            addModal?.remove();
            fetchData();
          },
        });
      } catch (error) {
        console.error('onAddAndStake error', error);
        const errorTip = (error as IContractError)?.errorMessage?.message;
        errorTip && notification.error({ description: errorTip });
      } finally {
        closeLoading();
      }
    },
    [
      addModal,
      claimInfosToStake,
      closeLoading,
      currentList,
      dappId,
      dappIdToStake,
      fetchData,
      getBalance,
      getPairInfo,
      getPrice,
      longestReleaseTime,
      notification,
      poolIdsToStake,
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
      const tokens = tokenASymbol === rewardsSymbol ? defaultTokens : [...defaultTokens].reverse();
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
          },
          per1,
          per2,
          reserves: pairInfo.reserves,
          fee: transactionFee?.transactionFee || '0',
          liquidityIds,
          dappId: dappIdToStakeOrRemove || '',
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
      dappIdToStakeOrRemove,
      fetchData,
      getPairInfo,
      removeModal,
      rewardsSymbol,
      showLoading,
    ],
  );

  const onStake = useCallback(
    async ({ banlance, lpSymbol, rate, decimal, liquidityIds, lpAmount }: ILiquidityItem) => {
      let stakeData: any;
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
        const fixedEarlyStakeData = (fixEarlyStakeData(stakeData) as Array<IEarlyStakeInfo>)?.[0];
        if (fixedEarlyStakeData) {
          stakeData = fixedEarlyStakeData;
          if (
            !BigNumber(stakeData?.staked || 0).isZero() &&
            dayjs(stakeData?.unlockTime || 0).isBefore(dayjs())
          ) {
            notification.error({
              description:
                'Stake has expired, cannot be added stake. Please renew the staking first.',
            });
            return;
          }
        } else {
          notification.error({ description: 'no pool' });
          return;
        }
      } catch (error) {
        notification.error({ description: 'getPool failed' });
        return;
      } finally {
        closeLoading();
      }
      const { stakeSymbol = '' } = stakeData;
      if (!stakeSymbol) {
        notification.error({ description: 'stakeSymbol is required.' });
        return;
      }
      const typeIsAdd = !BigNumber(stakeData?.staked || 0).isZero();
      stakeModal.show({
        type: typeIsAdd ? StakeType.ADD : StakeType.STAKE,
        stakeData: {
          ...stakeData,
          stakeInfos: stakeData?.subStakeInfos || [],
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
            // const periodInSeconds = 5 * 60;
            const signParams: ILiquidityStakeSignParams = {
              lpAmount: String(lpAmount || ''),
              poolId: stakeData?.poolId || '',
              period: periodInSeconds,
              address: wallet?.address || '',
              dappId: dappIdToStakeOrRemove,
              liquidityIds,
            };
            const res = (await liquidityStakeSign(signParams)) || {};
            closeLoading();
            const { signature, seed, expirationTime } = res?.data || {};
            if (!signature || !seed || !expirationTime) throw Error(res?.message || '');
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
              const { matchedErrorMsg, title } = matchErrorMsg(errorMessage, 'StakeLiquidity');
              if (matchedErrorMsg)
                notification.error({ description: matchedErrorMsg, message: title });
              throw Error(matchedErrorMsg);
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
      dappIdToStakeOrRemove,
      fetchData,
      notification,
      rewardsContractAddress,
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
