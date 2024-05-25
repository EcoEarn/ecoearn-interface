import { Button, ToolTip } from 'aelf-design';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Segmented } from 'antd';
import clsx from 'clsx';
import styles from './style.module.css';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import { formatNumber, formatTokenPrice } from 'utils/format';
import useResponsive from 'utils/useResponsive';
import ConfirmModal, { ConfirmModalTypeEnum } from '../../../../components/ConfirmModal';
import usePointsPoolService, {
  ListTypeEnum,
} from 'pageComponents/points/hooks/usePointsPoolService';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import BigNumber from 'bignumber.js';
import { divDecimals } from 'utils/calculate';
import Empty from 'components/Empty';
import { ZERO } from 'constants/index';
import CommonTooltip from 'components/CommonTooltip';

const formatMin = 1000000;

export function PointsStakeItem({
  item,
  onClaim,
  showHighYieldTag = false,
}: {
  item: IPointsPoolItem;
  onClaim: (item: IPointsPoolItem) => void;
  showHighYieldTag?: boolean;
}) {
  const { isLG, isXL, isMD, width } = useResponsive();
  const { isLogin } = useGetLoginStatus();

  const handleClaim = useCallback(() => {
    onClaim(item);
  }, [item, onClaim]);

  const dailyRewards = useMemo(() => {
    return formatTokenPrice(item.dailyRewards, { decimalPlaces: 2 });
  }, [item.dailyRewards]);

  const poolDailyRewards = useMemo(() => {
    return formatTokenPrice(item.poolDailyRewards, { decimalPlaces: 2 });
  }, [item.poolDailyRewards]);

  const formatNumberOverMillion = useCallback(
    (value: string | number, decimal?: number) => {
      const amount = decimal ? divDecimals(value, decimal || 8) : value;
      return (width >= 1280 || width < 768) && BigNumber(amount).gte(formatMin)
        ? formatNumber(amount, { formatMin })
        : formatTokenPrice(amount, { decimalPlaces: 2 });
    },
    [width],
  );

  const totalStake = useMemo(() => {
    return formatNumberOverMillion(item.totalStake, item.decimal);
  }, [formatNumberOverMillion, item.decimal, item.totalStake]);

  const staked = useMemo(() => {
    return isLogin && item.staked ? formatNumberOverMillion(item.staked, item.decimal) : '--';
  }, [formatNumberOverMillion, isLogin, item.decimal, item.staked]);

  const stakeSymbol = useMemo(() => {
    return isLogin ? item.stakeTokenName : undefined;
  }, [isLogin, item.stakeTokenName]);

  const earnSymbol = useMemo(() => {
    return isLogin ? item.rewardsTokenName : undefined;
  }, [isLogin, item.rewardsTokenName]);

  const earned = useMemo(() => {
    return isLogin && item.realEarned ? formatNumberOverMillion(item.realEarned) : '--';
  }, [formatNumberOverMillion, isLogin, item.realEarned]);

  const claimDisabled = useMemo(() => {
    return BigNumber(item.realEarned).lte(ZERO);
  }, [item.realEarned]);

  return (
    <div className="rounded-lg md:rounded-[24px] px-4 py-6 md:p-6 border-[1px] border-solid border-neutralBorder bg-white relative">
      <Flex
        justify="space-between"
        align={isMD ? 'start' : 'center'}
        vertical={isMD ? true : false}
      >
        <Flex
          gap={8}
          align="center"
          justify={isMD ? 'space-between' : 'start'}
          className="w-full md:w-fit"
        >
          <span className="text-xl font-semibold text-neutralTitle">{item.poolName}</span>
          {showHighYieldTag && (
            <span className="rounded-[4px] border-brandDisable bg-brandFooterBg border-solid border-[1px] text-brandDefault text-xs font-medium px-[6px]">
              High Rewards
            </span>
          )}
        </Flex>
        <Flex
          align="center"
          className="md:mt-0 mt-2 w-full md:w-fit"
          gap={4}
          justify={isMD ? 'space-between' : 'start'}
        >
          <span className="text-sm font-medium text-brandDefault">
            Rewards for 1w Points / Month:{' '}
          </span>
          <span className="flex items-center text-sm font-medium text-brandDefault">
            {dailyRewards} {item.rewardsTokenName}
            <CommonTooltip
              title="It indicates daily rewards obtained by staking 10,000 points."
              className="ml-1 fill-brandDefault"
            />
          </span>
        </Flex>
      </Flex>
      <Flex
        className="mt-2 text-sm font-medium"
        justify="space-between"
        vertical={isMD}
        align="flex-start"
      >
        <Flex
          className="text-neutralTertiary w-full md:w-fit"
          justify="space-between"
          gap={isMD ? 0 : 8}
        >
          Mining Pool Rewards / Day:
          <span className="text-neutralPrimary">
            {poolDailyRewards} {item.rewardsTokenName}
          </span>
        </Flex>
        <Flex
          className="text-neutralTertiary w-full md:w-fit mt-2 md:mt-0"
          justify="space-between"
          align={isMD ? 'start' : 'end'}
          gap={isMD ? 0 : 8}
        >
          Total Staked:
          <span className="text-neutralPrimary">{totalStake}</span>
        </Flex>
      </Flex>
      <div className="mt-4 grid grid-flow-row  md:grid-flow-col gap-6 grid-cols-1 md:grid-cols-2">
        <Flex
          justify="space-between"
          align="center"
          className="p-4 rounded-[16px] bg-brandBg flex-grow"
        >
          <Flex vertical gap={8}>
            <Flex align="center">
              <span className="text-base font-medium text-neutralPrimary">Staked</span>
              <CommonTooltip
                className="ml-1"
                title="The platform will take a snapshot of your points at 0:00 each day and automatically stake the snapshot amount at 0:00 on the previous day."
              />
            </Flex>
            <Flex gap={8} align="center">
              <span className="font-semibold text-lg text-neutralTitle">{staked}</span>
              {stakeSymbol && (
                <span className="text-base font-normal text-neutralPrimary">{stakeSymbol}</span>
              )}
            </Flex>
          </Flex>
        </Flex>
        <Flex
          justify="space-between"
          align="center"
          className="p-4 rounded-[16px] bg-brandBg flex-grow"
        >
          <Flex vertical gap={8}>
            <span className="text-base font-medium text-neutralPrimary">Earned</span>
            <Flex gap={8} align="center">
              <span className="font-semibold text-lg text-neutralTitle">{earned}</span>
              {earnSymbol && (
                <span className="text-base font-normal text-neutralPrimary">{earnSymbol}</span>
              )}
            </Flex>
          </Flex>
          <ToolTip
            overlayStyle={{ maxWidth: '150px' }}
            title={
              claimDisabled && isLogin ? 'Rewards are distributed at 0:00 every day.' : undefined
            }
          >
            <Button
              size="medium"
              type="primary"
              className="!rounded-md"
              onClick={handleClaim}
              disabled={claimDisabled || !isLogin}
            >
              Claim
            </Button>
          </ToolTip>
        </Flex>
      </div>
    </div>
  );
}

export default function PointsStakingList() {
  const { currentList, setCurrentList, data, fetchData, onClaim } = usePointsPoolService();
  const { isLogin } = useGetLoginStatus();
  const { checkLogin } = useCheckLoginAndToken();
  const { isLG } = useResponsive();
  const { schrodingerUrl } = useGetCmsInfo() || {};
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [curItem, setCurItem] = useState<IPointsPoolItem>();
  const [status, setStatus] = useState<'normal' | 'success' | 'error'>('normal');
  const [transactionId, setTransactionId] = useState<string>();

  const segmentedOptions: Array<{ label: ReactNode; value: string }> = [
    { label: 'All', value: ListTypeEnum.All },
    { label: 'Staked', value: ListTypeEnum.Staked },
  ];

  const handleSegmentChange = useCallback(
    (value: string) => {
      setCurrentList(value as ListTypeEnum);
    },
    [setCurrentList],
  );

  const handleGain = useCallback(() => {
    window.open(schrodingerUrl, '_blank');
  }, [schrodingerUrl]);

  const handleClaim = useCallback((item: IPointsPoolItem) => {
    setCurItem(item);
    setModalVisible(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!curItem) return;
    setLoading(true);
    try {
      const transactionId = await onClaim(curItem);
      if (transactionId) {
        setStatus('success');
        setTransactionId(transactionId);
      } else {
        throw new Error('transactionId empty');
      }
    } catch (error) {
      console.error('Points Claim error', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, [curItem, onClaim]);

  const resetState = useCallback(() => {
    setLoading(false);
    setModalVisible(false);
    setStatus('normal');
    setTransactionId('');
    setCurItem(undefined);
  }, []);

  return (
    <>
      <ConfirmModal
        type={ConfirmModalTypeEnum.Claim}
        content={{
          amount: curItem?.realEarned || 0,
          tokenSymbol: curItem?.rewardsTokenName,
          releasePeriod: curItem?.releasePeriod,
        }}
        status={status}
        loading={loading}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          resetState();
          fetchData();
        }}
        onConfirm={handleConfirm}
        transactionId={transactionId}
      />
      <Segmented
        className={clsx('mt-6 lg:mt-12', styles.segmented)}
        size="large"
        block={isLG}
        value={currentList}
        defaultValue={ListTypeEnum.All}
        onChange={handleSegmentChange}
        options={segmentedOptions}
      />

      {data?.length && data.length > 0 ? (
        <div className="grid xl:grid-cols-2 grid-cols-1 gap-4 lg:gap-6 mt-4 lg:mt-6">
          {data.map((item, index) => {
            return (
              <PointsStakeItem
                key={index}
                item={item}
                onClaim={handleClaim}
                showHighYieldTag={index < 3}
              />
            );
          })}
        </div>
      ) : (
        <Empty
          onClick={handleGain}
          emptyBtnText="Gain points"
          emptyText="Staking can not be made because currently no points have been earned."
        />
      )}
    </>
  );
}
