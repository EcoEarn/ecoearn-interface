import { Flex } from 'antd';
import { ZERO } from 'constants/index';
import { useMemo } from 'react';
import { divDecimals } from 'utils/calculate';
import { formatNumber, formatTokenSymbol } from 'utils/format';

export default function AmountInfo({ poolInfo }: { poolInfo: IStakePoolData }) {
  const totalStakedValueText = useMemo(() => {
    return `${formatNumber(divDecimals(poolInfo?.totalStake || 0, poolInfo?.decimal || 8), {
      decimalPlaces: 0,
    })} ${formatTokenSymbol(poolInfo?.stakeSymbol || '')}`;
  }, [poolInfo?.decimal, poolInfo?.stakeSymbol, poolInfo?.totalStake]);

  const marketCapText = useMemo(() => {
    return `${formatTokenSymbol(poolInfo?.stakeSymbol || '')} Market Cap`;
  }, [poolInfo?.stakeSymbol]);

  const marketCapValueText = useMemo(() => {
    return `$ ${formatNumber(poolInfo?.marketCap || 0, { decimalPlaces: 0 })}`;
  }, [poolInfo?.marketCap]);

  const stakersValueText = useMemo(() => {
    return ZERO.plus(poolInfo?.stakers || 0).toFormat();
  }, [poolInfo?.stakers]);

  return (
    <Flex
      justify="space-around"
      gap={16}
      className="px-4 py-6 md:p-8 rounded-[24px] border-[1px] border-solid bg-white border-neutralBorder"
    >
      <Flex vertical align="center" gap={4} justify="center">
        <span className="text-xs leading-[16px] md:text-sm md:leading-[18px] font-normal text-neutralTertiary">
          Total Staked
        </span>
        <span className="text-base leading-[22px] font-semibold text-neutralPrimary">
          {totalStakedValueText}
        </span>
      </Flex>
      <Flex vertical align="center" gap={4} justify="center">
        <span className="text-xs leading-[16px] md:text-sm md:leading-[18px] font-normal text-neutralTertiary">
          {marketCapText}
        </span>
        <span className="text-base leading-[22px] font-semibold text-neutralPrimary">
          {marketCapValueText}
        </span>
      </Flex>
      <Flex vertical align="center" gap={4} justify="center">
        <span className="text-xs leading-[16px] md:text-sm md:leading-[18px] font-normal text-neutralTertiary">
          Stakers
        </span>
        <span className="text-base leading-[22px] font-semibold text-neutralPrimary">
          {stakersValueText}
        </span>
      </Flex>
    </Flex>
  );
}
