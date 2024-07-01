import { ZERO } from 'constants/index';
import { useCallback } from 'react';
import dayjs from 'dayjs';
import { MAX_STAKE_PERIOD } from 'constants/stake';

export default function useAPRK() {
  const getAprK = useCallback((period: number | string, fixedBoostFactor: number | string) => {
    if (fixedBoostFactor && period) {
      const aprX = fixedBoostFactor;
      const realPeriod = ZERO.plus(period).gt(MAX_STAKE_PERIOD) ? MAX_STAKE_PERIOD : period;
      const ratio = ZERO.plus(realPeriod).div(aprX);
      console.log('get-APK-period', period);
      console.log('get-APK-realPeriod', realPeriod);
      console.log('get-APK-ratio', ratio.toNumber());
      return ZERO.plus(1).plus(ratio).toString();
    }
    return '';
  }, []);

  const getAprKAve = useCallback(
    (stakeInfo: Array<IStakeInfoItem>, fixedBoostFactor: number | string, newAprK?: number) => {
      const aprKArr: Array<number> = [];
      stakeInfo.forEach((stakeInfo, index) => {
        const { period = 0 } = stakeInfo;
        const periodDays = dayjs.duration(+period, 'second').asDays();
        const realPeriod = ZERO.plus(periodDays).gt(MAX_STAKE_PERIOD)
          ? MAX_STAKE_PERIOD
          : periodDays;
        const aprK = ZERO.plus(realPeriod || 0)
          .div(fixedBoostFactor)
          .plus(1)
          .toNumber();
        aprKArr.push(aprK);
      });
      if (newAprK) {
        aprKArr.push(newAprK);
      }
      const sum = aprKArr.reduce((acc, curr) => acc + curr, 0);
      const average = sum / aprKArr.length;
      console.log('==============aprKArr', aprKArr);
      return average;
    },
    [],
  );

  return { getAprK, getAprKAve };
}
