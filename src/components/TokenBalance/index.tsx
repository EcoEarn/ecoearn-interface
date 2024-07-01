import { Flex } from 'antd';
import StakeToken, { PoolTypeEnum } from 'components/StakeToken';
import { useMemo } from 'react';
import { divDecimals } from 'utils/calculate';
import { formatTokenPrice } from 'utils/format';

export default function TokenBalance(props: {
  icon: string;
  symbol: string;
  balance: string;
  decimal: number;
  fromRewards?: boolean;
}) {
  const { icon, symbol, balance, decimal, fromRewards = false } = props;

  const amountText = useMemo(() => {
    return formatTokenPrice(divDecimals(balance, decimal), {
      decimalPlaces: 6,
      minValue: 0.000001,
    }).toString();
  }, [balance, decimal]);

  return (
    <Flex gap={8} align="center" justify="space-between">
      <Flex align="center" gap={8}>
        <StakeToken
          icons={[icon || '']}
          tokenName={symbol}
          size="small"
          className="!items-center lg:!items-center"
          tokenSymbolClassName="!text-lg"
          type={PoolTypeEnum.Token}
        />
        {fromRewards && (
          <div className="py-[2px] flex justify-center items-center font-medium text-xs text-neutralTertiary px-1 rounded-[4px] bg-neutralDefaultBg">
            Rewards
          </div>
        )}
      </Flex>
      <span className="text-base font-medium text-neutralPrimary">{amountText}</span>
    </Flex>
  );
}
