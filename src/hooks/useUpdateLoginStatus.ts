import { useEffect } from 'react';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { setLoginStatus } from 'redux/reducer/loginStatus';
import { dispatch } from 'redux/store';
import { storages } from 'storages';
import { useGetToken } from './useGetToken';
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';

const useUpdateLoginStatus = () => {
  const { isConnected, walletInfo } = useConnectWallet();
  const { hasToken } = useGetLoginStatus();
  const { checkTokenValid } = useGetToken();

  useEffect(() => {
    const accountInfo = JSON.parse(localStorage.getItem(storages.accountInfo) || '{}');
    const hasLocalToken = !!accountInfo.token && checkTokenValid();
    const isConnectWallet = isConnected;
    dispatch(
      setLoginStatus({
        isConnectWallet,
        hasToken: hasLocalToken,
        isLogin: isConnectWallet && walletInfo && hasLocalToken,
      }),
    );
  }, [checkTokenValid, isConnected, walletInfo]);
};

export default useUpdateLoginStatus;
