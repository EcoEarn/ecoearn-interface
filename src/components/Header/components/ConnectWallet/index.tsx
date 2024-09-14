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

export default function ConnectWallet() {
  const { isLogin } = useGetLoginStatus();
  const { checkLogin } = useCheckLoginAndToken();
  const { isLG } = useResponsive();
  const { isInTelegram } = useTelegram();
  const { wallet, walletType } = useWalletService();
  const { curChain } = useGetCmsInfo() || {};
  const fullAddress = useMemo(() => {
    return addPrefixSuffix(wallet?.address || '', curChain);
  }, [curChain, wallet?.address]);

  const formatAddress = useMemo(() => {
    return getOmittedStr(fullAddress, OmittedType.ADDRESS);
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
      <span>{formatAddress}</span>
      <DropDownSVG className="w-[12px] h-[12px] lg:w-[16px] lg:h-[16px]" />
    </div>
  ) : isInTG ? null : (
    <Button
      size={isLG ? 'small' : 'large'}
      onClick={() => {
        checkLogin();
      }}
      type="primary"
      className="!rounded-sm lg:!rounded-lg"
    >
      Connect Wallet
    </Button>
  );
}
