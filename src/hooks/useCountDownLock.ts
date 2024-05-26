import { useCountDown } from 'ahooks';
import { useMemo, useState } from 'react';

export default function useCountDownLock({
  targetTimeStamp,
  onFinish,
}: {
  targetTimeStamp: number | string;
  onFinish?: () => void;
}) {
  const [isUnLocked, setIsUnLocked] = useState(false);
  const [countdown, { days, hours, minutes }] = useCountDown({
    targetDate: Number(targetTimeStamp),
    onEnd: () => {
      setIsUnLocked(true);
      onFinish?.();
    },
  });

  const countDisplay = useMemo(() => {
    if (days < 1) {
      if (hours < 1) {
        if (minutes < 1) {
          return '< 1m';
        }
        return `${minutes}m`;
      }
      return `${hours}h-${minutes}m`;
    }
    return `${days}d-${hours}h-${minutes}m`;
  }, [days, hours, minutes]);

  return {
    isUnLocked,
    countDisplay,
  };
}
