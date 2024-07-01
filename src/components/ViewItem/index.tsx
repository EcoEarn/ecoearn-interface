import { memo } from 'react';
import { ReactComponent as RightArrowSVG } from 'assets/img/rightArrow.svg';
import clsx from 'clsx';

interface IViewItemProps {
  label: string;
  text: string;
  originText?: string;
  extra?: string;
  isTextBrand?: boolean;
}

function ViewItem({ label, text, originText, extra, isTextBrand = false }: IViewItemProps) {
  return (
    <div className="flex justify-between flex-col md:flex-row gap-2">
      <div className="text-sm text-neutralTertiary">{label}</div>
      <div className="flex flex-col gap-3 items-start text-sm text-neutralPrimary font-medium">
        {originText ? (
          <div className="flex items-center">
            <div className="flex flex-col items-start">
              <span>{originText}</span>
              <span>{extra}</span>
            </div>
            <RightArrowSVG className="w-4 h-4 " />
            <span className="text-brandDefault font-semibold">{text}</span>
          </div>
        ) : (
          <div className="flex flex-col items-start md:items-end">
            <span className={clsx(isTextBrand && 'text-brandDefault')}>{text}</span>
            <span>{extra}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ViewItem);
