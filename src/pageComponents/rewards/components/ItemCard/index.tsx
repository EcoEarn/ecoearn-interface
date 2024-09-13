import { Flex } from 'antd';
import dayjs from 'dayjs';
import { divDecimals } from 'utils/calculate';
import {
  formatTokenAmount,
  formatTokenPrice,
  formatTokenSymbol,
  formatUSDPrice,
} from 'utils/format';
import CountDownLock from '../CountDownLock';
import { useMemo } from 'react';
import StakeToken, { PoolType, PoolTypeEnum } from 'components/StakeToken';
import clsx from 'clsx';
import CommonTooltip from 'components/CommonTooltip';
import { DEFAULT_DATE_FORMAT } from 'constants/index';

export default function ItemCard({
  item,
  className,
  onCountDownFinish,
}: {
  item: IRewardListItem;
  onCountDownFinish?: () => void;
  className?: string;
}) {
  const renderSymbol = useMemo(() => {
    const { tokenIcon, tokenName, projectOwner } = item;
    return (
      <StakeToken
        type={item.poolType as unknown as PoolType}
        icons={tokenIcon}
        tokenName={tokenName}
        projectName={projectOwner}
      />
    );
  }, [item]);
  return (
    <Flex
      vertical
      gap={24}
      className={clsx(
        'py-6 px-4 border-[1px] border-solid border-neutralBorder border-x-0 border-t-0',
        className,
      )}
    >
      <div>{renderSymbol}</div>
      <Flex className="text-base mt-[32px]" justify="space-between" align="start">
        <Flex align="center">
          <span className="text-neutralSecondary">Claimed rewards</span>
          <CommonTooltip title="Claimed rewards" className="ml-2" />
        </Flex>
        <Flex vertical align="end" className="text-base">
          <span className="text-neutralPrimary font-[600]">{`${formatTokenPrice(
            divDecimals(item.rewards, item.rewardsTokenDecimal || 8),
            { decimalPlaces: 2 },
          )} ${formatTokenSymbol(item.rewardsToken)}`}</span>
          <span className="text-neutralSecondary mt-1">
            {formatUSDPrice(divDecimals(item.rewardsInUsd, item.rewardsTokenDecimal || 8), {
              decimalPlaces: 2,
            })}
          </span>
        </Flex>
      </Flex>
      <Flex className="text-base" justify="space-between" align="start">
        <Flex align="center">
          <span className="text-neutralSecondary">Claimed at</span>
          <CommonTooltip title="time for rewards claim" className="ml-2" />
        </Flex>
        <span className="text-neutralPrimary text-base font-[600]">
          {dayjs(Number(item.date)).format(DEFAULT_DATE_FORMAT)}
        </span>
      </Flex>
      {/* <Flex className="text-base" justify="space-between" align="start">
        <Flex align="center">
          <span className="font-medium text-neutralSecondary">Lock-up period</span>
          <CommonTooltip
            title="A lockup period in which you have to wait to claim the proceeds"
            className="ml-2"
          />
        </Flex>
        <span className="text-neutralTitle text-base font-semibold">
          {dayjs(item.lockUpPeriod).isBefore(dayjs()) ? (
            <span className="text-base font-semibold text-neutralTitle">Unlocked</span>
          ) : (
            <CountDownLock
              targetTimeStamp={item.lockUpPeriod}
              onFinish={() => {
                onCountDownFinish?.();
              }}
            />
          )}
        </span>
      </Flex> */}
    </Flex>
  );
}
