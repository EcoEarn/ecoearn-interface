import { Button } from 'aelf-design';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { ReactComponent as WalletSVG } from 'assets/img/wallet.svg';
import { ReactComponent as EmptySVG } from 'assets/img/wallet.svg';
import clsx from 'clsx';

export default function Empty({
  emptyText,
  emptyBtnText,
  onClick,
  className,
}: {
  emptyText: string;
  emptyBtnText?: string;
  className?: string;
  onClick?: () => void;
}) {
  const { checkLogin } = useCheckLoginAndToken();
  const { isLogin } = useGetLoginStatus();

  return (
    <div
      className={clsx(
        'py-16 text-center lg:py-[108px] mt-8 lg:mt-12 flex-col gap-y-4 flex justify-center items-center',
        className,
      )}
    >
      {isLogin ? (
        <EmptySVG className="w-[72px] h-[72px]" />
      ) : (
        <WalletSVG className="w-[72px] h-[72px]" />
      )}
      <span className="text-base text-neutralSecondary">
        {isLogin ? emptyText : 'Please connect your wallet to continue'}
      </span>
      {((isLogin && emptyBtnText) || !isLogin) && (
        <Button
          type="primary"
          size="large"
          className="!rounded-lg mt-4 !min-w-[186px]"
          onClick={() => {
            if (!isLogin) {
              checkLogin();
              return;
            }
            onClick?.();
          }}
        >
          {isLogin ? emptyBtnText : 'Connect Wallet'}
        </Button>
      )}
    </div>
  );
}
