import { Button } from 'aelf-design';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import useResponsive from 'utils/useResponsive';
import { ReactComponent as PortKeySVG } from 'assets/img/portKey.svg';
import { ReactComponent as DropDownSVG } from 'assets/img/dropDown.svg';
import { ReactComponent as NightElfSVG } from 'assets/img/NightElf.svg';

import useTelegram from 'hooks/useTelegram';
import { useMemo } from 'react';
import { useWalletService } from 'hooks/useWallet';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { OmittedType, addPrefixSuffix, getOmittedStr } from 'utils/addressFormatting';
import clsx from 'clsx';

export default function ConnectWallet({ isOpen }: { isOpen?: boolean }) {
  const { isLogin, isLoadingToken, isLoadingConnectWallet } = useGetLoginStatus();
  const { checkLogin } = useCheckLoginAndToken();
  const { isLG } = useResponsive();
  const { isInTelegram } = useTelegram();
  const { wallet, walletType } = useWalletService();
  const { curChain } = useGetCmsInfo() || {};

  const isLoading = useMemo(() => {
    return isLoadingToken || isLoadingConnectWallet;
  }, [isLoadingConnectWallet, isLoadingToken]);

  const fullAddress = useMemo(() => {
    return addPrefixSuffix(wallet?.address || '', curChain);
  }, [curChain, wallet?.address]);

  const formatAddressPC = useMemo(() => {
    return getOmittedStr(fullAddress, OmittedType.ADDRESS);
  }, [fullAddress]);

  const formatAddressPhone = useMemo(() => {
    return getOmittedStr(fullAddress, OmittedType.ADDRESS, { prevLen: 6, endLen: 7, limitLen: 13 });
  }, [fullAddress]);

  const isInTG = useMemo(() => {
    return isInTelegram();
  }, [isInTelegram]);

  return isLogin ? (
    <div className="text-[12px] px-[8px] py-[6px] rounded-sm gap-1 lg:gap-2  lg:text-[16px] lg:px-[28px] lg:py-[12px] lg:rounded-[12px] flex hover:text-brandHover hover:border-brandHover items-center border-[1px] justify-center text-brandDefault  border-solid border-brandDefault cursor-pointer">
      {walletType == 'NightElf' ? (
        <NightElfSVG className="w-[16px] h-[16px] lg:w-[20px] lg:h-[20px]" />
      ) : (
        <PortKeySVG className="w-[16px] h-[16px] lg:w-[20px] lg:h-[20px]" />
      )}
      {!isLG && <span>{formatAddressPC}</span>}
      <DropDownSVG
        className={clsx(
          'w-[12px] h-[12px] lg:w-[16px] lg:h-[16px] duration-200 transition-transform transform',
          isOpen && 'rotate-180',
        )}
      />
    </div>
  ) : isInTG ? null : (
    <Button
      size={isLG ? 'small' : 'large'}
      onClick={() => {
        checkLogin();
      }}
      type="primary"
      loading={isLoading}
      className="!rounded-sm lg:!rounded-lg"
    >
      Connect Wallet
    </Button>
  );
}
