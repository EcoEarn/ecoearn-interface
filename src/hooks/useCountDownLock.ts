import { useCountDown } from 'ahooks';
import { useMemo } from 'react';

export default function useCountDownLock(targetTimeStamp: string | number) {
  const [countdown, { days, hours, minutes, seconds, milliseconds }] = useCountDown({
    targetDate: Number(targetTimeStamp),
  });

  const isUnLocked = useMemo(() => {
    return days === 0 && hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0;
  }, [days, hours, milliseconds, minutes, seconds]);

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
