import { ZERO } from 'constants/index';
import { useCallback, useMemo } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import dayjs from 'dayjs';
import BigNumber from 'bignumber.js';
import { MAX_STAKE_PERIOD } from 'constants/stake';

export default function useAPRK() {
  const cmsInfo = useGetCmsInfo();
  const getAprK = useCallback(
    (period: number | string) => {
      if (cmsInfo?.aprX && period) {
        const aprX = cmsInfo.aprX;
        const period2Days = dayjs.duration(+period, 'seconds').asDays();
        const realPeriod = ZERO.plus(period2Days).gt(MAX_STAKE_PERIOD)
          ? MAX_STAKE_PERIOD
          : period2Days;
        const ratio = ZERO.plus(realPeriod).div(aprX);
        console.log('get-APK-period2Days', period2Days);
        console.log('get-APK-realPeriod', realPeriod);
        console.log('get-APK-ratio', ratio);
        return ZERO.plus(1).plus(ratio).toFixed(2, BigNumber.ROUND_HALF_UP);
      }
      return '';
    },
    [cmsInfo],
  );

  return { getAprK };
}
