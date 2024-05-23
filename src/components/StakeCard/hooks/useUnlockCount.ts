import { useCountDown, useInterval } from 'ahooks';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

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
  const [diffSeconds, setDiffSeconds] = useState(0);

  useInterval(() => {
    const diffSeconds =
      ((dayjs().valueOf() - Number(lastOperationTime)) / 1000) %
      (Number(stakingPeriod) + Number(unlockWindowDuration));
    const isUnLocked = Number(stakingPeriod) - Number(diffSeconds) <= 0;
    setDiffSeconds(diffSeconds);
    setIsUnLocked(isUnLocked);
  }, 1000);

  const targetUnlockTimeStamp = useMemo(() => {
    const diff = Number(stakingPeriod) - Number(diffSeconds);
    return dayjs().add(diff, 'second').valueOf();
  }, [diffSeconds, stakingPeriod]);

  const [countdown, { days, hours, minutes }] = useCountDown({
    targetDate: Number(targetUnlockTimeStamp),
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

  return { isUnLocked, countDisplay, targetUnlockTimeStamp };
}
