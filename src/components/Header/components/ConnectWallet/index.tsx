import { Button } from 'aelf-design';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import useResponsive from 'utils/useResponsive';
import { ReactComponent as MySVG } from 'assets/img/my.svg';
import { ReactComponent as MySmallSVG } from 'assets/img/my-small.svg';
import useTelegram from 'hooks/useTelegram';
import { useMemo } from 'react';

export default function ConnectWallet() {
  const { isLogin } = useGetLoginStatus();
  const { checkLogin } = useCheckLoginAndToken();
  const { isLG } = useResponsive();
  const { isInTelegram } = useTelegram();

  const isInTG = useMemo(() => {
    return isInTelegram();
  }, [isInTelegram]);

  return isLogin ? (
    <div className="text-xs flex hover:text-brandHover hover:border-brandHover items-center border-[1px] justify-center gap-2 px-4 lg:px-7 py-[6px] lg:py-3 text-brandDefault rounded-sm lg:rounded-lg border-solid border-brandDefault lg:text-base font-medium cursor-pointer">
      {!isLG ? <MySVG /> : <MySmallSVG />}
      My
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
