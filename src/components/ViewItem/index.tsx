import { memo } from 'react';
import { ReactComponent as RightArrowSVG } from 'assets/img/rightArrow.svg';

interface IViewItemProps {
  label: string;
  text: string;
  originText?: string;
}

function ViewItem({ label, text, originText }: IViewItemProps) {
  return (
    <div className="flex justify-between">
      <div className="text-base text-neutralTertiary">{label}</div>
      <div className="flex gap-3 items-center text-base text-neutralPrimary font-medium">
        {originText ? (
          <>
            <span>{originText}</span>
            <RightArrowSVG className="w-4 h-4 " />
            <span className="text-brandDefault font-semibold">{text}</span>
          </>
        ) : (
          <span>{text}</span>
        )}
      </div>
    </div>
  );
}

export default memo(ViewItem);
