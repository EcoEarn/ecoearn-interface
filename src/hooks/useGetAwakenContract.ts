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
    awakenLpSwapContractAddress3,
    awakenLpSwapContractAddress5,
    awakenLpTokenContractAddress3,
    awakenLpTokenContractAddress5,
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
      '0.05': {
        swap: awakenLpSwapContractAddress5 || '',
        token: awakenLpTokenContractAddress5 || '',
      },
      '0.03': {
        swap: awakenLpSwapContractAddress3 || '',
        token: awakenLpTokenContractAddress3 || '',
      },
    };
  }, [
    awakenLpSwapContractAddress005,
    awakenLpSwapContractAddress01,
    awakenLpSwapContractAddress03,
    awakenLpSwapContractAddress3,
    awakenLpSwapContractAddress5,
    awakenLpTokenContractAddress005,
    awakenLpTokenContractAddress01,
    awakenLpTokenContractAddress03,
    awakenLpTokenContractAddress3,
    awakenLpTokenContractAddress5,
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
