import { Flex } from 'antd';
import StakeToken, { PoolTypeEnum } from 'components/StakeToken';
import { useMemo } from 'react';
import { PoolType } from 'types/stake';
import { divDecimals } from 'utils/calculate';
import { formatTokenPrice, formatUSDPrice } from 'utils/format';

export default function Balance({
  icons,
  symbol,
  amount,
  usdAmount,
  decimal,
  rate,
}: {
  icons: Array<string>;
  symbol: string;
  amount: string;
  usdAmount: string;
  decimal: number;
  rate: number | string;
}) {
  const amountText = useMemo(() => {
    return formatTokenPrice(divDecimals(amount, decimal)).toString();
  }, [amount, decimal]);

  const amountUsdText = useMemo(() => {
    return formatUSDPrice(divDecimals(usdAmount, decimal)).toString();
  }, [decimal, usdAmount]);

  return (
    <Flex className="p-6 rounded-lg bg-brandBg" justify="space-between" align="start">
      <StakeToken
        size="small"
        className="!items-center lg:!items-center"
        tokenSymbolClassName="!text-lg"
        tokenName={symbol}
        icons={icons}
        type={PoolType.LP}
        rate={rate}
      />
      <Flex align="end" vertical>
        <span className="text-xl lg:text-2xl font-semibold text-neutralTitle">{amountText}</span>
        <span className="text-sm font-medium text-neutralSecondary">{amountUsdText}</span>
      </Flex>
    </Flex>
  );
}
