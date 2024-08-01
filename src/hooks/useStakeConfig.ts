import { MIN_STAKE_AMOUNT } from 'constants/stake';
import { useMemo } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';

export default function useStakeConfig() {
  const { minStakeAmount } = useGetCmsInfo() || {};

  const min = useMemo(() => +(minStakeAmount || 0) || MIN_STAKE_AMOUNT, [minStakeAmount]);

  return {
    min,
  };
}
