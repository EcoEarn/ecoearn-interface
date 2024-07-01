import clsx from 'clsx';

interface IRateTagProps {
  value: string | number;
  className?: string;
}

export default function RateTag({ value, className }: IRateTagProps) {
  return (
    <span
      className={clsx(
        'px-2 py-1 border border-solid border-brandDisable bg-brandBg rounded-md text-sm lg:text-base text-brandDefault',
        className,
      )}
    >
      {value}%
    </span>
  );
}
