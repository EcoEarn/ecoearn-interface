import { useCallback } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { addPrefixSuffix, getOmittedStr, OmittedType } from 'utils/addressFormatting';
import useResponsive from 'utils/useResponsive';

interface IAddressFormatRes {
  fullAddress: string;
  formattedAddress: string;
}
export default function useAddressFormat() {
  const { curChain } = useGetCmsInfo() || {};
  const { isMD } = useResponsive();

  const formatAddress = useCallback(
    ({
      address,
      needPrefix = true,
    }: {
      address: string;
      needPrefix?: boolean;
    }): IAddressFormatRes => {
      let fullAddress = '';
      let formattedAddress = '';
      if (address) {
        fullAddress = needPrefix ? addPrefixSuffix(address, curChain) : address;
        formattedAddress = getOmittedStr(
          fullAddress,
          isMD ? OmittedType.ADDRESS : OmittedType.CUSTOM,
          !isMD
            ? {
                prevLen: 12,
                endLen: 9,
                limitLen: 21,
              }
            : undefined,
        );
      }
      return {
        fullAddress,
        formattedAddress,
      };
    },
    [curChain, isMD],
  );

  return {
    formatAddress,
  };
}
