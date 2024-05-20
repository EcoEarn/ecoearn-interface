import { memo, ReactNode, useMemo } from 'react';
import { ToolTip } from 'aelf-design';
import { ReactComponent as QuestionSVG } from 'assets/img/questionCircleOutlined.svg';
import clsx from 'clsx';
import useResponsive from 'hooks/useResponsive';

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
  ({ className, valueTextAlign = 'left', label, value, tip, extra, icon }: ITextProps) => {
    const { isLG } = useResponsive();

    const flexType = useMemo(() => {
      if (isLG) return 'start';
      if (valueTextAlign === 'right') return 'end';
      if (valueTextAlign === 'left') return 'start';
      return 'center';
    }, [isLG, valueTextAlign]);

    const valueFlexStr = useMemo(
      () => (isLG ? 'justify-end' : 'justify-' + flexType),
      [flexType, isLG],
    );
    const labelFlexStr = useMemo(() => 'self-' + flexType, [flexType]);

    return (
      <div
        className={clsx(
          'flex justify-between text-neutralTitle text-lg font-medium lg:gap-4 lg:flex-col lg:justify-start',
          className,
        )}
      >
        <div className={clsx('flex gap-2 items-center text-neutralDisable', labelFlexStr)}>
          <span>{label}</span>
          {tip && (
            <ToolTip title={tip}>
              <QuestionSVG className="w-5 h-5" />
            </ToolTip>
          )}
        </div>
        <div>
          <div className={clsx('flex font-semibold text-xl', valueFlexStr)}>
            <span className={clsx(icon && 'mr-2', isLG && 'text-right')}>{value}</span>
            {icon}
          </div>
          <div className="text-base font-medium text-right">{extra}</div>
        </div>
      </div>
    );
  },
);

export default Description;
