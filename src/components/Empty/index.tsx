import { Button } from 'aelf-design';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { ReactComponent as WalletSVG } from 'assets/img/wallet.svg';
import { ReactComponent as EmptySVG } from 'assets/img/wallet.svg';

export default function Empty({
  emptyText,
  emptyBtnText,
  onClick,
}: {
  emptyText: string;
  emptyBtnText: string;
  onClick: () => void;
}) {
  const { checkLogin } = useCheckLoginAndToken();
  const { isLogin } = useGetLoginStatus();

  return (
    <div className="py-16 lg:py-[108px] mt-8 lg:mt-12 flex-col gap-y-4 flex justify-center items-center">
      {isLogin ? (
        <EmptySVG className="w-[72px] h-[72px]" />
      ) : (
        <WalletSVG className="w-[72px] h-[72px]" />
      )}
      <span className="text-base text-neutralSecondary font-medium">
        {isLogin ? emptyText : 'No Wallet Connected'}
      </span>
      <Button
        type="primary"
        size="large"
        className="!rounded-lg mt-4 !min-w-[186px]"
        onClick={() => {
          if (!isLogin) {
            checkLogin();
            return;
          }
          onClick();
        }}
      >
        {isLogin ? emptyBtnText : 'Connect Wallet'}
      </Button>
    </div>
  );
}
