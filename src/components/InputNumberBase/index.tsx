import { Input, InputProps } from 'antd';
import { ZERO } from 'constants/index';
import { useCallback, useMemo } from 'react';
import { isPotentialNumber } from 'utils/format';
import clsx from 'clsx';

interface IInputNumberBaseProps extends Omit<InputProps, 'type' | 'onChange'> {
  decimal?: number;
  onChange?: (val: string) => void;
  suffixText?: string;
  allowZero?: boolean;
  suffixClick?: (val: string) => void;
}

export default function InputNumberBase({
  value,
  decimal,
  disabled,
  onChange,
  suffixText,
  suffixClick,
  allowZero = true,
  ...rest
}: IInputNumberBaseProps) {
  const onClick = useCallback(() => {
    suffixClick?.(value as string);
  }, [suffixClick, value]);

  const suffix = useMemo(() => {
    return (
      <span
        onClick={onClick}
        className={clsx(
          'font-medium cursor-pointer text-base',
          disabled ? 'text-brandDisable' : 'text-brandDefault',
        )}
      >
        {suffixText}
      </span>
    );
  }, [disabled, onClick, suffixText]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      const parseStr = inputVal.replaceAll(',', '');
      let val = '';
      console.log('onchange', inputVal);
      const regex = /^[1-9]\d*$/;

      if (!parseStr || !isPotentialNumber(parseStr)) {
        val = '';
      } else if (!regex.test(parseStr) && !allowZero) {
        val = '';
      } else if (inputVal.endsWith('.')) {
        val = inputVal;
      } else {
        const decimalCount = parseStr.split('.')[1]?.length || 0;

        val = ZERO.plus(parseStr).toFormat(
          !decimal && decimal !== 0 ? undefined : decimalCount <= decimal ? decimalCount : decimal,
        );
      }
      console.log('onInputChange', val);
      onChange?.(val);
    },
    [allowZero, decimal, onChange],
  );

  return (
    <Input
      value={value}
      suffix={suffix}
      autoComplete="off"
      onChange={onInputChange}
      disabled={disabled}
      {...rest}
    />
  );
}
