import clsx from 'clsx';
import { useMemo } from 'react';

export default function TokenTextIcon({
  tokenName,
  size = 'large',
}: {
  tokenName?: string;
  size: 'small' | 'middle' | 'large';
}) {
  const symbol = useMemo(() => tokenName?.[0], [tokenName]);
  return (
    <>
      {symbol ? (
        <div
          className={clsx(
            'flex items-center justify-center w-full h-full text-neutralTitle font-semibold border border-solid border-neutralBorder rounded-[50%]',
            size === 'large' ? 'text-2xl' : 'text-base',
          )}
        >
          {symbol}
        </div>
      ) : null}
    </>
  );
}
