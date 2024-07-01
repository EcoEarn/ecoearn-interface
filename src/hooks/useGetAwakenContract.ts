import { useCallback, useMemo } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';

export type TFeeType = '0.0005' | '0.001' | '0.003';

export default function useGetAwakenContract() {
  const {
    awakenLpSwapContractAddress01,
    awakenLpTokenContractAddress01,
    awakenLpSwapContractAddress03,
    awakenLpTokenContractAddress03,
    awakenLpSwapContractAddress005,
    awakenLpTokenContractAddress005,
  } = useGetCmsInfo() || {};

  const contractAddress = useMemo(() => {
    return {
      '0.001': {
        swap: awakenLpSwapContractAddress01 || '',
        token: awakenLpTokenContractAddress01 || '',
      },
      '0.003': {
        swap: awakenLpSwapContractAddress03 || '',
        token: awakenLpTokenContractAddress03 || '',
      },
      '0.0005': {
        swap: awakenLpSwapContractAddress005 || '',
        token: awakenLpTokenContractAddress005 || '',
      },
    };
  }, [
    awakenLpSwapContractAddress005,
    awakenLpSwapContractAddress01,
    awakenLpSwapContractAddress03,
    awakenLpTokenContractAddress005,
    awakenLpTokenContractAddress01,
    awakenLpTokenContractAddress03,
  ]);

  const getAddress = useCallback(
    (rate: TFeeType) => {
      return contractAddress[rate];
    },
    [contractAddress],
  );

  return {
    getAddress,
  };
}
