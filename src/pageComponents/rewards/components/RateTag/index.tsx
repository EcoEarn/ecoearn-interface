import { useMemo } from 'react';

export default function RateTag({ value }: { value: number }) {
  const valueText = useMemo(() => {
    if (!value) return;
    return `${Number(value || 0) * 100}%`;
  }, [value]);

  return valueText ? (
    <div className="text-base text-brandDefault border-[1px] border-solid border-brandDisable bg-brandBg rounded-md px-2 h-7 flex justify-center items-center">
      {valueText}
    </div>
  ) : null;
}
