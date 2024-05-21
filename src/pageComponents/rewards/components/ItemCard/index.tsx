import { ToolTip } from 'aelf-design';
import { Flex } from 'antd';
import { ReactComponent as QuestionIconComp } from 'assets/img/questionCircleOutlined.svg';
import dayjs from 'dayjs';
import { divDecimals } from 'utils/calculate';
import { formatTokenPrice, formatUSDPrice } from 'utils/format';
import CountDownLock from '../CountDownLock';
import { useMemo } from 'react';
import StakeToken from 'components/StakeToken';
import { PoolType } from 'types/stack';
import clsx from 'clsx';

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
    if (item.poolType === 'Points') {
      return <div className="text-base text-neutralPrimary">{item.tokenName}</div>;
    } else {
      return (
        <StakeToken
          type={item.poolType as PoolType}
          icons={tokenIcon}
          tokenName={tokenName}
          projectName={projectOwner}
        />
      );
    }
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
      <Flex className="text-base" justify="space-between" align="start">
        <Flex align="center">
          <span className="font-medium text-neutralSecondary">Rewards</span>
          <ToolTip title="Claimed rewards">
            <QuestionIconComp className="w-4 h-4 ml-2 cursor-pointer" width={16} height={16} />
          </ToolTip>
        </Flex>
        <Flex vertical align="end" className="text-base">
          <span className="text-neutralPrimary font-semibold">{`${formatTokenPrice(
            divDecimals(item.rewards, item.rewardsTokenDecimal || 8),
            { decimalPlaces: 2 },
          )} ${item.rewardsToken}`}</span>
          <span className="text-neutralSecondary mt-1 font-medium">
            {formatUSDPrice(item.rewardsInUsd, { decimalPlaces: 2 })}
          </span>
        </Flex>
      </Flex>
      <Flex className="text-base" justify="space-between" align="start">
        <Flex align="center">
          <span className="font-medium text-neutralSecondary">Date</span>
          <ToolTip title="time for rewards claim">
            <QuestionIconComp className="w-4 h-4 ml-2 cursor-pointer" width={16} height={16} />
          </ToolTip>
        </Flex>
        <span className="text-neutralPrimary text-base font-semibold">
          {dayjs(Number(item.date)).format('YYYY.MM.DD HH:mm')}
        </span>
      </Flex>
      <Flex className="text-base" justify="space-between" align="start">
        <Flex align="center">
          <span className="font-medium text-neutralSecondary">Lock-up period</span>
          <ToolTip title="A lockup period in which you have to wait to claim the proceeds">
            <QuestionIconComp className="w-4 h-4 ml-2 cursor-pointer" width={16} height={16} />
          </ToolTip>
        </Flex>
        <span className="text-neutralPrimary text-base font-semibold">
          <CountDownLock
            targetTimeStamp={item.lockUpPeriod}
            onFinish={() => {
              onCountDownFinish?.();
            }}
          />
        </span>
      </Flex>
    </Flex>
  );
}
