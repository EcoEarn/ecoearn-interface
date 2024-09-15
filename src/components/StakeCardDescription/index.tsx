import { memo, ReactNode } from 'react';
import clsx from 'clsx';
import CommonTooltip from 'components/CommonTooltip';
import useResponsive from 'utils/useResponsive';

interface ITextProps {
  className?: string;
  valueTextAlign?: 'center' | 'right' | 'left';
  label: string;
  value: string;
  tip?: string;
  extra?: string;
  icon?: ReactNode;
}

const getActualWidthOfChars = (text: string, options: any = {}) => {
  const { size = 14, family = 'Poppins' } = options;
  const canvas = document.createElement('canvas');
  const ctx: any = canvas.getContext('2d');
  ctx.font = `${size}px ${family}`;
  const metrics = ctx.measureText(text);
  return Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
};

const Description = memo(
  ({ className, label, value, tip, extra, icon, valueTextAlign = 'left' }: ITextProps) => {
    const { isLG } = useResponsive();
    return (
      <div
        className={clsx(
          'text-neutralTitle text-lg font-medium lg:flex-col lg:justify-start gap-2',
          className,
        )}
      >
        <div
          className={clsx(
            'flex gap-1 text-base  md:text-lg items-center font-medium text-neutralTertiary',
          )}
        >
          <span className="text-[14px] font-[500]">{label}</span>
          {/* {tip && <CommonTooltip title={tip} />} */}
        </div>
        <div
          className={clsx(
            'text-[16px] flex flex-col',
            valueTextAlign === 'left' ? 'items-start' : 'items-end',
          )}
        >
          <div
            className={clsx('flex font-semibold gap-2 text-neutralTitle items-center break-all')}
          >
            {!isLG ? (
              <span className={`${getActualWidthOfChars(value) > 135 && 'text-[10px]'}`}>
                {value}
              </span>
            ) : (
              <span
                className={`${getActualWidthOfChars(value) > screen.width / 4 && 'text-[10px]'}`}
              >
                {value}
              </span>
            )}
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
