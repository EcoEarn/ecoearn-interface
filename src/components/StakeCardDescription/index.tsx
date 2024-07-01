import { memo, ReactNode } from 'react';
import clsx from 'clsx';
import CommonTooltip from 'components/CommonTooltip';

interface ITextProps {
  className?: string;
  valueTextAlign?: 'center' | 'right' | 'left';
  label: string;
  value: string;
  tip?: string;
  extra?: string;
  icon?: ReactNode;
}

const Description = memo(
  ({ className, label, value, tip, extra, icon, valueTextAlign = 'left' }: ITextProps) => {
    return (
      <div
        className={clsx(
          'flex justify-between text-neutralTitle text-lg font-medium lg:flex-col lg:justify-start gap-2',
          className,
        )}
      >
        <div
          className={clsx(
            'flex gap-2 text-base  md:text-lg items-center font-medium text-neutralTertiary',
          )}
        >
          <span>{label}</span>
          {tip && <CommonTooltip title={tip} />}
        </div>
        <div
          className={clsx(
            'text-base md:text-lg flex flex-col',
            valueTextAlign === 'left' ? 'items-start' : 'items-end',
          )}
        >
          <div
            className={clsx('flex font-semibold gap-2 text-neutralTitle items-center break-all')}
          >
            <span>{value}</span>
            {icon}
          </div>
          {extra && (
            <div className="text-sm font-medium text-neutralSecondary break-all">{extra}</div>
          )}
        </div>
      </div>
    );
  },
);

export default Description;
