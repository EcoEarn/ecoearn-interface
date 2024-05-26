import { ZERO } from 'constants/index';
import { useCallback } from 'react';
import dayjs from 'dayjs';
import { MAX_STAKE_PERIOD } from 'constants/stake';

export default function useAPRK() {
  const getAprK = useCallback((period: number | string, fixedBoostFactor: number | string) => {
    if (fixedBoostFactor && period) {
      const aprX = fixedBoostFactor;
      const period2Days = dayjs.duration(+period, 'second').asDays();
      const realPeriod = ZERO.plus(period2Days).gt(MAX_STAKE_PERIOD)
        ? MAX_STAKE_PERIOD
        : period2Days;
      const ratio = ZERO.plus(realPeriod).div(aprX);
      console.log('get-APK-period', period);
      console.log('get-APK-period2Days', period2Days);
      console.log('get-APK-realPeriod', realPeriod);
      console.log('get-APK-ratio', ratio);
      return ZERO.plus(1).plus(ratio).toString();
    }
    return '';
  }, []);

  return { getAprK };
}
