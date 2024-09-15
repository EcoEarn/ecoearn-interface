import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import { Flex } from 'antd';
import CommonTooltip from 'components/CommonTooltip';
import { useMemo } from 'react';
import { divDecimals } from 'utils/calculate';
import { formatTokenPrice, formatTokenSymbol, formatUSDPrice } from 'utils/format';

interface IRewardsTotalItemProps {
  label: string;
  tip?: string;
  tokenSymbol: string;
  amount: string;
  amountUsd: string;
  decimal: number;
}
export default function RewardsTotalItem({
  label,
  tip,
  tokenSymbol,
  amount,
  decimal,
  amountUsd,
}: IRewardsTotalItemProps) {
  const { isConnected } = useConnectWallet();

  const formatRewardsSymbol = useMemo(() => {
    return formatTokenSymbol(tokenSymbol);
  }, [tokenSymbol]);

  const amountText = useMemo(() => {
    return !isConnected
      ? '--'
      : amount
      ? `${formatTokenPrice(divDecimals(amount, decimal || 8)).toString()} ${formatRewardsSymbol}`
      : '0.00';
  }, [isConnected, amount, decimal, formatRewardsSymbol]);

  const amountUsdText = useMemo(() => {
    return !isConnected
      ? '--'
      : formatUSDPrice(divDecimals(amountUsd || 0, decimal || 8)).toString();
  }, [amountUsd, decimal, isConnected]);

  return (
    <Flex
      flex={1}
      vertical
      align="center"
      className="border-solid border-[1px] border-neutralDivider bg-white rounded-lg p-5"
    >
      <Flex gap={4} align="center" wrap="nowrap">
        <span className="text-sm font-normal text-neutralTertiary flex-shrink-0">{label}</span>
        {tip && <CommonTooltip size={20} title={tip} />}
      </Flex>
      <span className="mt-4 text-center  text-base md:text-lg font-medium text-neutralTitle">
        {amountText}
      </span>
      <span className="mt-1 text-center  text-sm text-neutralSecondary font-medium">
        {amountUsdText}
      </span>
    </Flex>
  );
}
