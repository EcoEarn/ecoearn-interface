import { Input, InputProps } from 'antd';
import { ZERO } from 'constants/index';
import { useCallback, useMemo } from 'react';
import { isPotentialNumber } from 'utils/format';

interface IInputNumberBaseProps extends Omit<InputProps, 'type' | 'onChange'> {
  decimal?: number;
  onChange?: (val: string) => void;
  suffixText?: string;
  suffixClick?: (val: string) => void;
}

export default function InputNumberBase({
  value,
  decimal,
  onChange,
  suffixText,
  suffixClick,
  ...rest
}: IInputNumberBaseProps) {
  const onClick = useCallback(() => {
    suffixClick?.(value as string);
  }, [suffixClick, value]);

  const suffix = useMemo(() => {
    return (
      <span onClick={onClick} className="text-brandDefault font-medium cursor-pointer text-base">
        {suffixText}
      </span>
    );
  }, [onClick, suffixText]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      const parseStr = inputVal.replaceAll(',', '');
      let val = '';
      console.log('onchange', inputVal);
      if (!parseStr || !isPotentialNumber(parseStr)) {
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
    [decimal, onChange],
  );

  return (
    <Input value={value} suffix={suffix} autoComplete="off" onChange={onInputChange} {...rest} />
  );
}
