import { Input } from 'aelf-design';
import StakeToken from 'components/StakeToken';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatTokenPrice, formatUSDPrice } from 'utils/format';
import { divDecimals } from 'utils/calculate';
import BigNumber from 'bignumber.js';

interface InputAmountProps {
  icons: Array<string>;
  tokenSymbol: string;
  decimal: number;
  balance: string;
  source?: 'wallet' | 'rewards';
  usdPrice: string | number;
  onChange?: (value: string) => void;
  value: string;
  disabled?: boolean;
}

export default function InputAmount(props: InputAmountProps) {
  const {
    icons = [],
    source = 'rewards',
    balance = 0,
    tokenSymbol = '',
    decimal = 8,
    usdPrice = 0,
    onChange: onChangeProps,
    value = '',
    disabled = false,
  } = props;

  const onChange = useCallback(
    (value: string) => {
      onChangeProps?.(value);
    },
    [onChangeProps],
  );

  const balanceText = useMemo(() => {
    return balance
      ? formatTokenPrice(divDecimals(balance, decimal), {
          decimalPlaces: 6,
          minValue: 0.000001,
        }).toString()
      : '--';
  }, [balance, decimal]);

  const inputUsdAmount = useMemo(() => {
    return value ? formatUSDPrice(BigNumber(value).times(BigNumber(usdPrice))).toString() : '--';
  }, [value, usdPrice]);

  useEffect(() => {
    if (source === 'rewards') {
      onChange(divDecimals(balance, decimal).dp(6).toString());
    }
  }, [balance, balanceText, decimal, onChange, source]);

  return (
    <section className="p-6 rounded-lg border-[3px] border-solid border-neutralDivider bg-brandBg">
      <Input
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        type="number"
        size="small"
        placeholder="0.00"
        value={value}
        allowClear={false}
        className={clsx(
          '!border-none !px-0 !bg-brandBg !shadow-none !text-2xl !font-semibold !text-neutralTitle',
        )}
        suffix={
          <div className="flex gap-1 items-center">
            <StakeToken
              tokenName={tokenSymbol}
              icons={icons}
              size="small"
              className="!items-center lg:!items-center"
            />
            {source === 'rewards' && (
              <div className="w-[61px] h-6 flex justify-center items-center rounded-[4px] bg-neutralDefaultBg text-xs font-medium text-neutralTertiary">
                Rewards
              </div>
            )}
          </div>
        }
      />
      <div className="mt-[6px] flex justify-between text-sm font-normal text-neutralTertiary">
        <span>{`${inputUsdAmount}`}</span>
        <span>{`Balance: ${balanceText}`}</span>
      </div>
    </section>
  );
}
