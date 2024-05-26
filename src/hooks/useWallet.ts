import {
  useWebLogin,
  WebLoginState,
  WebLoginEvents,
  useWebLoginEvent,
  useLoginState,
  WalletType,
  useGetAccount,
  usePortkeyLock,
  useComponentFlex,
  PortkeyInfo,
} from 'aelf-web-login';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGetToken } from './useGetToken';
import { getOriginalAddress } from 'utils/addressFormatting';
import { dispatch, store } from 'redux/store';
import { setWalletInfo } from 'redux/reducer/userInfo';
import { useLocalStorage } from 'react-use';
import { cloneDeep } from 'lodash-es';
import { WalletInfoType } from 'types';
import { storages } from 'storages';
import useBackToHomeByRoute from './useBackToHomeByRoute';
import { useSelector } from 'react-redux';
import { ChainId } from '@portkey/types';
import useDiscoverProvider from './useDiscoverProvider';
import { MethodsWallet } from '@portkey/provider-types';
import { mainChain } from 'constants/index';
import { resetLoginStatus, setLoginStatus } from 'redux/reducer/loginStatus';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';

export const useWalletInit = () => {
  const [, setLocalWalletInfo] = useLocalStorage<WalletInfoType>(storages.walletInfo);

  const { getToken } = useGetToken();
  const { wallet, walletType } = useWebLogin();

  const backToHomeByRoute = useBackToHomeByRoute();

  const { logout } = useWalletService();

  const callBack = useCallback(
    (state: WebLoginState) => {
      if (state === WebLoginState.lock) {
        console.log('WebLoginState.lock');
        backToHomeByRoute();
      }
      if (state === WebLoginState.logined) {
        const walletInfo: WalletInfoType = {
          address: wallet?.address || '',
          publicKey: wallet?.publicKey,
          aelfChainAddress: '',
        };
        if (walletType === WalletType.elf) {
          walletInfo.aelfChainAddress = wallet?.address || '';
        }
        if (walletType === WalletType.discover) {
          walletInfo.discoverInfo = {
            accounts: wallet.discoverInfo?.accounts || {},
            address: wallet.discoverInfo?.address || '',
            nickName: wallet.discoverInfo?.nickName,
          };
        }
        if (walletType === WalletType.portkey) {
          walletInfo.portkeyInfo = wallet.portkeyInfo as PortkeyInfo;
        }
        getToken({
          needLoading: true,
        });
        dispatch(setWalletInfo(cloneDeep(walletInfo)));
        setLocalWalletInfo(cloneDeep(walletInfo));
      }
    },
    [backToHomeByRoute, wallet, walletType, getToken, setLocalWalletInfo],
  );

  useLoginState(callBack);

  const resetAccount = useCallback(() => {
    backToHomeByRoute();
    localStorage.removeItem(storages.accountInfo);
    localStorage.removeItem(storages.walletInfo);
    dispatch(
      setWalletInfo({
        address: '',
        aelfChainAddress: '',
      }),
    );
    dispatch(resetLoginStatus());
  }, [backToHomeByRoute]);

  useWebLoginEvent(WebLoginEvents.LOGIN_ERROR, (error) => {
    message.error(`${error.message || 'LOGIN_ERROR'}`);
  });

  useWebLoginEvent(WebLoginEvents.LOGOUT, () => {
    // message.info('log out');
    resetAccount();
  });
  useWebLoginEvent(WebLoginEvents.USER_CANCEL, () => {
    console.log('user cancel');
    // message.error('user cancel');
  });
  useWebLoginEvent(WebLoginEvents.DISCOVER_DISCONNECTED, () => {
    logout();
  });
};

export const useWalletService = () => {
  const { login, logout, loginState, walletType, wallet } = useWebLogin();
  const { lock } = usePortkeyLock();
  const isConnectWallet = loginState === WebLoginState.logined;
  return { login, logout, isConnectWallet, walletType, lock, wallet };
};

// Example Query whether the synchronization of the main sidechain is successful
export const useWalletSyncCompleted = (contractChainId = mainChain) => {
  const loading = useRef<boolean>(false);
  const { did } = useComponentFlex();
  const getAccountByChainId = useGetAccount(mainChain);
  const { wallet, walletType } = useWebLogin();
  const { walletInfo } = cloneDeep(useSelector((store: any) => store.userInfo));
  const { discoverProvider } = useDiscoverProvider();

  const errorFunc = () => {
    loading.current = false;
    return '';
  };

  const getAccount = useCallback(async () => {
    try {
      const aelfChainAddress = await getAccountByChainId();

      walletInfo.aelfChainAddress = getOriginalAddress(aelfChainAddress);

      dispatch(setWalletInfo(walletInfo));
      loading.current = false;
      if (!aelfChainAddress) {
        return errorFunc();
      } else {
        return walletInfo.aelfChainAddress;
      }
    } catch (error) {
      return errorFunc();
    }
  }, [walletInfo, getAccountByChainId]);

  const getTargetChainAddress = useCallback(async () => {
    try {
      if (contractChainId === mainChain) {
        return await getAccount();
      } else {
        loading.current = false;
        return wallet.address;
      }
    } catch (error) {
      return errorFunc();
    }
  }, [contractChainId, getAccount, wallet.address]);

  const getAccountInfoSync = useCallback(async () => {
    if (loading.current) return '';
    let caHash;
    let address: any;
    if (walletType === WalletType.elf) {
      return walletInfo.aelfChainAddress;
    }
    if (walletType === WalletType.portkey) {
      loading.current = true;
      const didWalletInfo = wallet.portkeyInfo;
      caHash = didWalletInfo?.caInfo?.caHash;
      address = didWalletInfo?.walletInfo?.address;
      // PortkeyOriginChainId register network address
      const originChainId = didWalletInfo?.chainId;
      if (originChainId === contractChainId) {
        return await getTargetChainAddress();
      }
      try {
        const holder = await did.didWallet.getHolderInfoByContract({
          chainId: contractChainId as ChainId,
          caHash: caHash as string,
        });
        const filteredHolders = holder.managerInfos.filter(
          (manager: any) => manager?.address === address,
        );
        if (filteredHolders.length) {
          return await getTargetChainAddress();
        } else {
          return errorFunc();
        }
      } catch (error) {
        return errorFunc();
      }
    } else {
      loading.current = true;
      try {
        const provider = await discoverProvider();
        const status = await provider?.request({
          method: MethodsWallet.GET_WALLET_MANAGER_SYNC_STATUS,
          payload: { chainId: contractChainId },
        });

        if (status) {
          return await getTargetChainAddress();
        } else {
          return errorFunc();
        }
      } catch (error) {
        return errorFunc();
      }
    }
  }, [
    walletType,
    walletInfo.aelfChainAddress,
    wallet.portkeyInfo,
    contractChainId,
    getTargetChainAddress,
    did.didWallet,
    discoverProvider,
  ]);

  return { getAccountInfoSync };
};

export const useCheckLoginAndToken = () => {
  const { loginState, login, logout } = useWebLogin();
  const isConnectWallet = useMemo(() => loginState === WebLoginState.logined, [loginState]);
  const { getToken, checkTokenValid } = useGetToken();
  const { isLogin } = useGetLoginStatus();
  const success = useRef<<T = any>() => T | void>();

  const checkLogin = async (params?: { onSuccess?: <T = any>() => T | void }) => {
    const { onSuccess } = params || {};
    const accountInfo = JSON.parse(localStorage.getItem(storages.accountInfo) || '{}');
    if (isConnectWallet) {
      console.log('getToken----isConnectWallet');
      if (accountInfo.token && checkTokenValid()) {
        store.dispatch(
          setLoginStatus({
            hasToken: true,
            isLogin: true,
          }),
        );
        return;
      }
      await getToken({
        needLoading: true,
      });
      onSuccess && onSuccess();
      return;
    }
    success.current = onSuccess;
    login();
  };

  useEffect(() => {
    if (isLogin) {
      success.current && success.current();
      success.current = undefined;
    }
  }, [isLogin]);

  useEffect(() => {
    const accountInfo = JSON.parse(localStorage.getItem(storages.accountInfo) || '{}');
    if (accountInfo.token) {
      store.dispatch(
        setLoginStatus({
          hasToken: true,
        }),
      );
      return;
    }
  }, []);

  return {
    checkTokenValid,
    logout,
    checkLogin,
  };
};
