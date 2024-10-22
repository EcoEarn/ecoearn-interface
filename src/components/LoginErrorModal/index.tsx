import { Button } from 'aelf-design';
import CommonModal from 'components/CommonModal';
import styles from './style.module.css';
import { useCallback, useMemo } from 'react';
import useTelegram from 'hooks/useTelegram';
import useGetStoreInfo from 'redux/hooks/useGetStoreInfo';
import { store } from 'redux/store';
import { setShowLoginErrorModal } from 'redux/reducer/info';
import { useWalletService } from 'hooks/useWallet';

export default function LoginErrorModal() {
  const { isInTelegram } = useTelegram();
  const { showLoginErrorModal } = useGetStoreInfo();
  const { logout } = useWalletService();

  const isInTG = useMemo(() => {
    return isInTelegram();
  }, [isInTelegram]);

  const handleConfirm = useCallback(() => {
    store.dispatch(setShowLoginErrorModal(false));
    if (isInTG) {
      return;
    }
    logout();
    window.location.reload();
  }, [isInTG, logout]);

  const tipText = useMemo(() => {
    return isInTG
      ? 'Due to network issues, you need to reconnect your wallet. Please close the mini program and click "Stake" again to retry.'
      : 'Due to network issues, the wallet will log out. Please click “Connect Wallet” to reconnect.';
  }, [isInTG]);

  return (
    <CommonModal
      className={styles['login-error-modal']}
      zIndex={Number.MAX_SAFE_INTEGER}
      open={showLoginErrorModal}
      disableMobileLayout
      closable={false}
      title="Login error"
      footer={
        <Button type="primary" block className="!rounded-lg" onClick={handleConfirm}>
          Got it
        </Button>
      }
    >
      <p className="text-base font-normal text-neutralPrimary">{tipText}</p>
    </CommonModal>
  );
}
