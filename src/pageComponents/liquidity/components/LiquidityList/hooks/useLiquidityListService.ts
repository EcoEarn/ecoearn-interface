import { useInterval, useRequest } from 'ahooks';
import {
  fetchStakingPoolsData,
  getEarlyStakeInfo,
  getPoolRewards,
  liquidityMarket,
  myLiquidity,
} from 'api/request';
import BigNumber from 'bignumber.js';
import { ZERO } from 'constants/index';
import dayjs from 'dayjs';
import useLoading from 'hooks/useLoading';
import useNotification from 'hooks/useNotification';
import { useWalletService } from 'hooks/useWallet';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { PoolType } from 'types/stake';
import { divDecimals, getTargetUnlockTimeStamp } from 'utils/calculate';
import { formatTokenSymbol } from 'utils/format';
import useResponsive from 'utils/useResponsive';

export enum LiquidityListTypeEnum {
  My = 'My',
  Market = 'Market',
}

export default function useLiquidityListService({ initData }: { initData?: ILiquidityItem[] }) {
  const [data, setData] = useState<Array<ILiquidityItem>>([]);
  const { isLG } = useResponsive();
  const [currentList, setCurrentList] = useState<LiquidityListTypeEnum>(
    LiquidityListTypeEnum.Market,
  );
  const { showLoading, closeLoading } = useLoading();
  const { curChain } = useGetCmsInfo() || {};
  const { wallet } = useWalletService();
  const notification = useNotification();
  const router = useRouter();
  const [rewardsPoolInfo, setRewardsPoolInfo] = useState<IStakePoolData>();
  const isReadInitData = useRef(false);
  const [loading, setLoading] = useState(false);

  const rewardsSymbol = useMemo(() => {
    //FIXME:
    return 'SGR-1';
  }, []);

  const initPoolData = useCallback(async () => {
    if (!curChain || !wallet?.address) {
      return;
    }
    try {
      const { pools } = await fetchStakingPoolsData({
        poolType: PoolType.TOKEN,
        maxResultCount: 20,
        skipCount: 0,
        address: wallet?.address || '',
        chainId: curChain,
        sorting: '',
        name: '',
      });
      const poolInfo = (pools || [])
        ?.filter?.((i) => i?.stakeSymbol == rewardsSymbol)
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
        setRewardsPoolInfo(poolInfo?.[0]);
      } else {
        throw new Error('Pool not found');
      }
    } catch (error) {
      notification.error({ description: (error as Error)?.message });
    }
  }, [curChain, notification, rewardsSymbol, wallet?.address]);

  useEffect(() => {
    initPoolData();
  }, [initPoolData]);

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

  const rewardsInfoToStake = useMemo(() => {
    return rewardsData?.filter(
      (item) =>
        item.rewardsTokenName === rewardsSymbol &&
        ZERO.plus(item?.rewardsInfo?.frozen || 0)
          .plus(item?.rewardsInfo?.withdrawable || 0)
          .gt(0),
    );
  }, [rewardsData, rewardsSymbol]);

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

  const getRewardsMinStakeAmount = useCallback(
    (index: number) => {
      return divDecimals(
        !BigNumber(earlyStakeInfos?.[index]?.staked || 0).gt(0)
          ? rewardsPoolInfo?.minimalStakeAmount
          : rewardsPoolInfo?.minimalExtendStakeAmount,
        rewardsPoolInfo?.decimal || 8,
      ).toString();
    },
    [
      earlyStakeInfos,
      rewardsPoolInfo?.decimal,
      rewardsPoolInfo?.minimalExtendStakeAmount,
      rewardsPoolInfo?.minimalStakeAmount,
    ],
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

  const isTotalStakeAmountNotEnough = useCallback(
    (index: number) => {
      return (
        BigNumber(totalStakeAmount || 0).isZero() ||
        BigNumber(totalStakeAmount).lt(getRewardsMinStakeAmount(index))
      );
    },
    [getRewardsMinStakeAmount, totalStakeAmount],
  );

  const isAddBtnDisabled = useCallback(
    ({ index }: { index: number }) => {
      return (
        !rewardsPoolInfo ||
        !earlyStakeInfos?.[index] ||
        isTotalStakeAmountNotEnough(index) ||
        (!BigNumber(earlyStakeInfos?.[index]?.staked || 0).isZero() &&
          dayjs(earlyStakeInfos?.[index]?.unlockTime || 0).isBefore(dayjs()))
      );
    },
    [earlyStakeInfos, isTotalStakeAmountNotEnough, rewardsPoolInfo],
  );

  const isStakeBtnDisabled = useCallback(
    ({ index }: { index: number }) => {
      return (
        !earlyStakeInfos?.[index] ||
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
      const min = getRewardsMinStakeAmount(index) || 0;
      if (!earlyStakeInfos?.[index] || !rewardsPoolInfo) return '';
      return bigValue.isZero()
        ? `You currently have no ${rewardsTokenSymbol} rewards available for adding liquidity.`
        : bigValue.lt(min)
        ? `The reward amount for adding liquidity can not be less than ${min} ${rewardsTokenSymbol}.`
        : !BigNumber(earlyStakeInfos?.[index]?.staked || 0).isZero() &&
          dayjs(earlyStakeInfos?.[index]?.unlockTime || 0).isBefore(dayjs())
        ? 'Your staking has expired and cannot be added. Please proceed to "Farms(LP Staking)" for renewal.'
        : '';
    },
    [earlyStakeInfos, getRewardsMinStakeAmount, rewardsPoolInfo, rewardsSymbol, totalStakeAmount],
  );

  const getStakeBtnTip = useCallback(
    ({ index }: { index: number }) => {
      if (BigNumber(data?.[index]?.banlance || 0).isZero()) {
        return 'No LP amount available for staking.';
      }
      if (!earlyStakeInfos?.[index]) return '';
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
      if (initData && currentList === LiquidityListTypeEnum.Market && !isReadInitData.current) {
        setData(initData);
        isReadInitData.current = true;
        return;
      }
      try {
        // needLoading && showLoading();
        needLoading && setLoading(true);
        if (currentList === LiquidityListTypeEnum.My) {
          list = await myLiquidity({ address: wallet.address });
        } else {
          list = await liquidityMarket({ address: wallet.address });
        }
        // needLoading && closeLoading();
        setData(list || []);
      } catch (error) {
        console.error('getLiquidityList error', error);
      } finally {
        // needLoading && closeLoading();
        needLoading && setLoading(false);
      }
    },
    [currentList, initData, wallet?.address],
  );

  const onAddAndStake = useCallback(
    async ({ rate }: ILiquidityItem) => {
      router.push(`/liquidity/add/${rate}`);
    },
    [router],
  );

  const onRemove = useCallback(
    async ({ rate }: ILiquidityItem) => {
      router.push(`/liquidity/remove/${rate}`);
    },
    [router],
  );

  const onStake = useCallback(
    async ({ rate }: ILiquidityItem) => {
      router.push(`/liquidity/stake/${rate}`);
    },
    [router],
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
    { label: 'All Pools', value: LiquidityListTypeEnum.Market },
    { label: 'My Positions', value: LiquidityListTypeEnum.My },
  ];

  const handleSegmentChange = useCallback(
    (value: string) => {
      setCurrentList(value as LiquidityListTypeEnum);
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
    loading,
  };
}
