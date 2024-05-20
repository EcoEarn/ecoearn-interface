import { useMemo } from 'react';

export default function TokenTextIcon({ tokenName }: { tokenName?: string }) {
  const symbol = useMemo(() => tokenName?.[0], [tokenName]);
  return (
    <>
      {symbol ? (
        <div className="flex items-center justify-center w-[40px] h-[40px] rounded-[20px] text-neutralTitle text-2xl font-semibold border border-solid border-neutralBorder">
          {symbol}
        </div>
      ) : null}
    </>
  );
}
