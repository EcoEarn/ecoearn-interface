import { DAYS_DURATION } from 'constants/stake';
import clsx from 'clsx';
import { Form } from 'antd';

interface IDaysSelectProps {
  disabled?: boolean;
  current: string;
  onSelect: (val: string) => void;
}

export default function DaysSelect({ disabled = false, current, onSelect }: IDaysSelectProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {DAYS_DURATION.map((item) => {
        return (
          <div
            key={item}
            className={clsx(
              'min-w-[56px] flex-1 rounded-sm bg-neutralHoverBg py-[6px] text-xs font-medium text-neutralSecondary text-center cursor-pointer hover:bg-brandDefault hover:text-white',
              current == item && '!bg-brandDefault text-white hover:!text-white',
              disabled && 'cursor-not-allowed hover:bg-neutralHoverBg hover:!text-neutralSecondary',
            )}
            onClick={() => onSelect(item)}
          >
            {item} D
          </div>
        );
      })}
    </div>
  );
}
