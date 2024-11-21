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
import { resetLoginStatus, setConnectWalletError, setLoginStatus } from 'redux/reducer/loginStatus';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import { WalletTypeEnum } from '@aelf-web-login/wallet-adapter-base';
import { did } from '@portkey/did-ui-react';
import { matchErrorMsg } from 'utils/formatError';
import useNotification from './useNotification';
import { unsubscribeUserOrderRecord } from '@etransfer/ui-react';
import { hideIndexLoading } from 'components/IndexLoading';

export const ETRANSFER_TOKEN_KEY = 'etransfer_access_token';

export const useWalletInit = () => {
  const [, setLocalWalletInfo] = useLocalStorage<WalletInfoType>(storages.walletInfo);
  const { getToken } = useGetToken();
  const { walletInfo, walletType, isLocking, isConnected, loginError } = useConnectWallet();
  const backToHomeByRoute = useBackToHomeByRoute();
  const notification = useNotification();

  useEffect(() => {
    if (isLocking) {
      console.log('WebLoginState.lock');
      backToHomeByRoute();
    }
  }, [backToHomeByRoute, isLocking]);

  const resetAccount = useCallback(() => {
    backToHomeByRoute();
    const walletInfo = localStorage.getItem(storages.walletInfo);
    const address = walletInfo ? JSON.parse(walletInfo).address : '';
    address && unsubscribeUserOrderRecord(address);
    localStorage.removeItem(storages.accountInfo);
    localStorage.removeItem(storages.walletInfo);
    localStorage.removeItem(ETRANSFER_TOKEN_KEY);
    localStorage.removeItem(storages.currentLoginWalletType);
    dispatch(
      setWalletInfo({
        address: '',
        aelfChainAddress: '',
      }),
    );
    dispatch(resetLoginStatus());
  }, [backToHomeByRoute]);

  useEffect(() => {
    if (!isConnected) {
      resetAccount();
    }
  }, [isConnected, resetAccount]);

  useEffect(() => {
    if (walletInfo) {
      const walletInfoToLocal: WalletInfoType = {
        address: walletInfo?.address || '',
        publicKey: walletInfo?.extraInfo?.publicKey || '',
        aelfChainAddress: '',
      };
      if (walletType === WalletTypeEnum.elf) {
        walletInfoToLocal.aelfChainAddress = walletInfo?.address || '';
      }
      if (walletType === WalletTypeEnum.discover) {
        walletInfoToLocal.discoverInfo = {
          accounts: walletInfo?.extraInfo?.accounts || {},
          address: walletInfo?.address || '',
          nickName: walletInfo?.extraInfo?.nickName,
        };
      }
      if (walletType === WalletTypeEnum.aa) {
        walletInfoToLocal.portkeyInfo = walletInfo?.extraInfo?.portkeyInfo || {};
      }
      if (walletType !== WalletTypeEnum.aa) {
        getToken({
          needLoading: true,
        });
      }
      dispatch(setWalletInfo(cloneDeep(walletInfo)));
      setLocalWalletInfo(cloneDeep(walletInfo as any));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLocalWalletInfo, walletInfo, walletType]);

  useEffect(() => {
    const publicKey = walletInfo?.extraInfo?.publicKey || '';
    console.log('=====publicKey', publicKey);

    const token = localStorage.getItem(storages.accountInfo);

    if (publicKey && !token && walletType === WalletTypeEnum.aa) {
      getToken({
        needLoading: false,
      });
    }
  }, [getToken, walletInfo?.extraInfo?.publicKey, walletType]);

  useEffect(() => {
    if (loginError) {
      const resError = loginError as any;
      console.log('loginError', resError);
      store.dispatch(setConnectWalletError(loginError));
      const { matchedErrorMsg, title } = matchErrorMsg(
        resError?.nativeError?.message || resError?.message || '',
      );
      matchedErrorMsg &&
        notification.error({
          description: `${matchedErrorMsg || 'LOGIN_ERROR'}`,
          message: title || '',
        });
    }
  }, [loginError, notification]);

  useEffect(() => {
    if (isConnected && walletInfo?.address) {
      hideIndexLoading();
      localStorage.setItem(storages.currentLoginWalletType, walletType);
    }
  }, [isConnected, walletInfo?.address, walletType]);
};

export const useWalletService = () => {
  const { isConnected, disConnectWallet, walletType, walletInfo, isLocking } = useConnectWallet();
  return {
    login: isConnected,
    logout: disConnectWallet,
    isConnectWallet: isConnected,
    walletType,
    lock: isLocking,
    wallet: walletInfo,
  };
};

export const useWalletSyncCompleted = (contractChainId = mainChain) => {
  const loading = useRef<boolean>(false);
  const { getAccountByChainId, walletInfo, walletType } = useConnectWallet();
  const { walletInfo: walletInfoStore } = cloneDeep(useSelector((store: any) => store.userInfo));
  const { discoverProvider } = useDiscoverProvider();

  const errorFunc = () => {
    loading.current = false;
    return '';
  };

  const getAccount = useCallback(async () => {
    try {
      const aelfChainAddress = await getAccountByChainId(mainChain);

      walletInfoStore.aelfChainAddress = getOriginalAddress(aelfChainAddress);

      dispatch(setWalletInfo(walletInfo));
      loading.current = false;
      if (!aelfChainAddress) {
        return errorFunc();
      } else {
        return walletInfoStore.aelfChainAddress;
      }
    } catch (error) {
      return errorFunc();
    }
  }, [getAccountByChainId, walletInfoStore, walletInfo]);

  const getTargetChainAddress = useCallback(async () => {
    try {
      if (contractChainId === mainChain) {
        return await getAccount();
      } else {
        loading.current = false;
        return walletInfo?.address;
      }
    } catch (error) {
      return errorFunc();
    }
  }, [contractChainId, getAccount, walletInfo?.address]);

  const getAccountInfoSync = useCallback(async () => {
    if (loading.current) return '';
    let caHash;
    let address: any;
    if (walletType === WalletTypeEnum.elf) {
      return walletInfoStore.aelfChainAddress;
    }
    if (walletType === WalletTypeEnum.aa) {
      loading.current = true;
      const didWalletInfo = walletInfo?.extraInfo?.portkeyInfo;
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
    walletInfoStore.aelfChainAddress,
    walletInfo?.extraInfo?.portkeyInfo,
    contractChainId,
    getTargetChainAddress,
    discoverProvider,
  ]);

  return { getAccountInfoSync };
};

export const useCheckLoginAndToken = () => {
  const { connectWallet, disConnectWallet, isConnected, walletInfo } = useConnectWallet();
  const isConnectWallet = useMemo(() => isConnected, [isConnected]);
  const { getToken, checkTokenValid } = useGetToken();
  const { isLogin } = useGetLoginStatus();
  const success = useRef<<T = any>() => T | void>();

  const checkLogin = async (params?: { onSuccess?: <T = any>() => T | void }) => {
    const { onSuccess } = params || {};
    const accountInfo = JSON.parse(localStorage.getItem(storages.accountInfo) || '{}');
    if (isConnectWallet && walletInfo) {
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
    connectWallet();
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
    logout: disConnectWallet,
    checkLogin,
  };
};
