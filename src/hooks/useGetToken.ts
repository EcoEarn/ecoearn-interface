import { useWebLogin, WalletType, WebLoginState } from 'aelf-web-login';
import { useCallback, useMemo } from 'react';
import { storages } from 'storages';
import { fetchToken } from 'api/request';
import { message } from 'antd';
import useDiscoverProvider from './useDiscoverProvider';
import { sleep } from '@portkey/utils';
import useLoading from 'hooks/useLoading';
import { IContractError } from 'types';
import { formatErrorMsg, LoginFailed } from 'utils/formatError';
import { resetLoginStatus, setLoginStatus } from 'redux/reducer/loginStatus';
import { store } from 'redux/store';

const AElf = require('aelf-sdk');

export const useGetToken = () => {
  const { loginState, wallet, getSignature, walletType, logout } = useWebLogin();
  const { showLoading, closeLoading } = useLoading();
  const { getSignatureAndPublicKey } = useDiscoverProvider();

  const isConnectWallet = useMemo(() => {
    return loginState === WebLoginState.logined;
  }, [loginState]);

  const getTokenFromServer: (props: {
    params: ITokenParams;
    needLoading?: boolean;
    retryCount?: number;
  }) => Promise<string | undefined> = useCallback(
    async (props: { params: ITokenParams; needLoading?: boolean; retryCount?: number }) => {
      const { params, needLoading = false, retryCount = 3 } = props;
      needLoading && showLoading();
      try {
        const res = await fetchToken(params);
        needLoading && closeLoading();
        if (isConnectWallet) {
          store.dispatch(
            setLoginStatus({
              hasToken: true,
              isLogin: true,
            }),
          );
          localStorage.setItem(
            storages.accountInfo,
            JSON.stringify({
              account: wallet.address,
              token: res.access_token,
              expirationTime: Date.now() + res.expires_in * 1000,
            }),
          );
          return res.access_token;
        } else {
          message.error(LoginFailed);
          store.dispatch(resetLoginStatus());
          return '';
        }
      } catch (error) {
        if (retryCount) {
          await sleep(1000);
          const retry = retryCount - 1;
          getTokenFromServer({
            ...props,
            retryCount: retry,
          });
        } else {
          message.error(LoginFailed);
          isConnectWallet && logout({ noModal: true });
          needLoading && closeLoading();
          return '';
        }
      }
    },
    [closeLoading, isConnectWallet, logout, showLoading, wallet.address],
  );

  const checkTokenValid = useCallback(() => {
    if (loginState !== WebLoginState.logined) return false;
    const accountInfo = JSON.parse(localStorage.getItem(storages.accountInfo) || '{}');

    if (
      accountInfo?.token &&
      Date.now() < accountInfo?.expirationTime &&
      accountInfo.account === wallet.address
    ) {
      return true;
    } else {
      return false;
    }
  }, [loginState, wallet.address]);

  const getToken: (params?: { needLoading?: boolean }) => Promise<undefined | string> = useCallback(
    async (params?: { needLoading?: boolean }) => {
      const { needLoading } = params || {};
      if (loginState !== WebLoginState.logined) return;

      if (checkTokenValid()) {
        return;
      } else {
        localStorage.removeItem(storages.accountInfo);
      }
      const timestamp = Date.now();

      const signInfo = AElf.utils.sha256(`${wallet.address}-${timestamp}`);

      let publicKey = '';
      let signature = '';
      let source = '';

      if (walletType === WalletType.discover) {
        try {
          const { pubKey, signatureStr } = await getSignatureAndPublicKey(signInfo);
          publicKey = pubKey || '';
          signature = signatureStr || '';
          source = 'portkey';
        } catch (error) {
          const resError = error as IContractError;
          const errorMessage = formatErrorMsg(resError).errorMessage.message;
          message.error(errorMessage);
          isConnectWallet && logout({ noModal: true });
          return;
        }
      } else {
        const sign = await getSignature({
          appName: 'ecoearn',
          address: wallet.address,
          signInfo:
            walletType === WalletType.portkey
              ? Buffer.from(`${wallet.address}-${timestamp}`).toString('hex')
              : signInfo,
        });
        if (sign?.errorMessage) {
          const errorMessage = formatErrorMsg(sign?.errorMessage as unknown as IContractError)
            .errorMessage.message;
          message.error(errorMessage);
          isConnectWallet && logout({ noModal: true });
          return;
        }

        publicKey = wallet.publicKey || '';
        signature = sign.signature;
        if (walletType === WalletType.elf) {
          source = 'nightElf';
        } else {
          source = 'portkey';
        }
      }
      const res = await getTokenFromServer({
        params: {
          grant_type: 'signature',
          scope: 'EcoEarnServer',
          client_id: 'EcoEarnServer_App',
          timestamp,
          signature,
          source,
          publickey: publicKey,
          address: wallet.address,
        } as ITokenParams,
        needLoading,
      });

      return res;
    },
    [
      loginState,
      wallet.address,
      wallet.publicKey,
      checkTokenValid,
      walletType,
      getTokenFromServer,
      getSignatureAndPublicKey,
      isConnectWallet,
      logout,
      getSignature,
    ],
  );

  return { getToken, checkTokenValid };
};
