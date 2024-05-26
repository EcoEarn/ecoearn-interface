import { useCountDown, useInterval } from 'ahooks';
import { useMemo, useState } from 'react';
import { getTargetUnlockTimeStamp } from 'utils/calculate';

export default function useUnlockCount({
  lastOperationTime,
  unlockWindowDuration,
  stakingPeriod,
}: {
  lastOperationTime: string | number;
  unlockWindowDuration: string | number;
  stakingPeriod: string | number;
}) {
  const [isUnLocked, setIsUnLocked] = useState(false);
  const [unlockTime, setUnLockTime] = useState(0);

  useInterval(() => {
    const { isUnLocked, unlockTime } = getTargetUnlockTimeStamp(
      stakingPeriod,
      lastOperationTime,
      unlockWindowDuration,
    );
    setUnLockTime(unlockTime);
    setIsUnLocked(isUnLocked);
  }, 1000);

  const [countdown, { days, hours, minutes }] = useCountDown({
    targetDate: Number(unlockTime),
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

  return { isUnLocked, countDisplay, targetUnlockTimeStamp: unlockTime };
}
