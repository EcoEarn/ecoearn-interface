import { useMemo } from 'react';

export default function TokenTextIcon({ tokenName }: { tokenName?: string }) {
  const symbol = useMemo(() => tokenName?.[0], [tokenName]);
  return (
    <>
      {symbol ? (
        <div className="flex items-center justify-center w-full h-full text-neutralTitle text-2xl font-semibold border border-solid border-neutralBorder rounded-[50%]">
          {symbol}
        </div>
      ) : null}
    </>
  );
}
