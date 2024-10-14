import { Button } from 'aelf-design';
import { Flex } from 'antd';
import TokenBalance from 'components/TokenBalance';
import { useCallback, useMemo, useState } from 'react';
import { Reserves } from 'types';
import { divDecimals } from 'utils/calculate';
import { formatTokenPrice } from 'utils/format';

export interface IReceiveProps {
  type: 'add' | 'remove';
  lpInfo?: {
    icons: Array<string>;
    symbol: string;
    rate: string;
    decimal: number;
  };
  depositedTokens?: Array<{
    icon: string;
    symbol: string;
    amount: string;
    decimal: number;
  }>;
  receiveTokens?: Array<{
    icon: string;
    symbol: string;
    amount: string;
    decimal: number;
    fromRewards?: boolean;
  }>;
  shareOfPool?: string;
  fee?: string;
  tolerance?: string;
  reserves?: Reserves;
  totalSupply?: string;
  handleReceive: () => void;
}

export default function Receive({
  type,
  lpInfo,
  depositedTokens,
  shareOfPool,
  fee,
  receiveTokens,
  reserves,
  totalSupply,
  tolerance,
  handleReceive,
}: IReceiveProps) {
  const [loading, setLoading] = useState(false);

  const formatDepositedTokens = useMemo(() => {
    return depositedTokens?.map((item) => {
      return {
        ...item,
        amount: formatTokenPrice(item?.amount || 0, { decimalPlaces: 8 }).toString(),
      };
    });
  }, [depositedTokens]);

  const transactionFee = useMemo(() => {
    return `${divDecimals(fee, 8)} ELF`;
  }, [fee]);

  const handleClick = useCallback(async () => {
    setLoading(true);
    await handleReceive?.();
    setLoading(false);
  }, [handleReceive]);

  const title = useMemo(() => {
    return <p className="text-2xl font-[600] text-neutralTitle !mb-8">You will receive</p>;
  }, []);

  const footer = useMemo(() => {
    return (
      <Button
        type="primary"
        className="!rounded-lg mt-[48px] mx-auto"
        onClick={handleClick}
        loading={loading}
      >
        {type === 'add' ? 'Confirm Stake' : 'Confirm Remove'}
      </Button>
    );
  }, [handleClick, loading, type]);

  return (
    <section className="p-8 bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder">
      {type === 'add' ? null : (
        <>
          {title}
          <Flex vertical gap={24}>
            {receiveTokens?.map((item, index) => {
              return (
                <TokenBalance
                  icon={item.icon || ''}
                  symbol={item.symbol}
                  key={index}
                  balance={item.amount}
                  decimal={item.decimal}
                  fromRewards={item.fromRewards}
                />
              );
            })}
            <div className="text-base font-normal text-neutralPrimary">
              {` This is an estimated output. If the price changes by more than ${
                tolerance || 0.5
              }%, your transaction
              will revert.`}
            </div>
            <Flex className="text-base font-medium flex items-center justify-between">
              <span className="text-neutralTitle">Estimated transaction fee</span>
              <span className="text-neutralPrimary">{transactionFee}</span>
            </Flex>
          </Flex>
          {footer}
        </>
      )}
    </section>
  );
}
