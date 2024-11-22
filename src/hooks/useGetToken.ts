import { useCallback, useMemo } from 'react';
import { storages } from 'storages';
import { fetchToken } from 'api/request';
import useDiscoverProvider from './useDiscoverProvider';
import { sleep } from '@portkey/utils';
import useLoading from 'hooks/useLoading';
import { IContractError } from 'types';
import { formatErrorMsg, LoginFailed, matchErrorMsg } from 'utils/formatError';
import { resetLoginStatus, setLoginStatus } from 'redux/reducer/loginStatus';
import { store } from 'redux/store';
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import { WalletTypeEnum } from '@aelf-web-login/wallet-adapter-base';
import useNotification from './useNotification';

const AElf = require('aelf-sdk');

const hexDataCopywriter = `Welcome to EcoEarn! Click to connect wallet to and accept its Terms of Service and Privacy Policy. This request will not trigger a blockchain transaction or cost any gas fees.

signature: `;

export const useGetToken = () => {
  const { walletInfo, walletType, disConnectWallet, getSignature, isConnected } =
    useConnectWallet();
  const { showLoading, closeLoading } = useLoading();
  const { getSignatureAndPublicKey } = useDiscoverProvider();
  const notification = useNotification();

  const isConnectWallet = useMemo(() => {
    return isConnected;
  }, [isConnected]);

  const getTokenFromServer: (props: {
    params: ITokenParams;
    needLoading?: boolean;
    retryCount?: number;
  }) => Promise<string | undefined> = useCallback(
    async (props: { params: ITokenParams; needLoading?: boolean; retryCount?: number }) => {
      const { params, needLoading = false, retryCount = 3 } = props;
      // needLoading && showLoading({ type: 'block' });
      try {
        const res = await fetchToken(params);
        needLoading && closeLoading();
        if (isConnectWallet && walletInfo) {
          store.dispatch(
            setLoginStatus({
              hasToken: true,
              isLogin: true,
            }),
          );
          localStorage.setItem(
            storages.accountInfo,
            JSON.stringify({
              account: walletInfo?.address || '',
              token: res.access_token,
              expirationTime: Date.now() + res.expires_in * 1000,
            }),
          );
          return res.access_token;
        } else {
          notification.error({ description: LoginFailed });
          store.dispatch(resetLoginStatus());
          return '';
        }
      } catch (error) {
        if (retryCount) {
          await sleep(1000);
          const retry = retryCount - 1;
          await getTokenFromServer({
            ...props,
            retryCount: retry,
          });
        } else {
          notification.error({ description: LoginFailed });
          isConnectWallet && disConnectWallet();
          // needLoading && closeLoading();
          return '';
        }
      }
    },
    [closeLoading, disConnectWallet, isConnectWallet, notification, walletInfo],
  );

  const checkTokenValid = useCallback(() => {
    console.log('====checkTokenValid', isConnected, walletInfo?.address);

    if (!isConnected) return false;
    const accountInfo = JSON.parse(localStorage.getItem(storages.accountInfo) || '{}');

    if (
      accountInfo?.token &&
      Date.now() < accountInfo?.expirationTime &&
      accountInfo.account === walletInfo?.address
    ) {
      return true;
    } else {
      return false;
    }
  }, [isConnected, walletInfo?.address]);

  const getToken: (params?: { needLoading?: boolean }) => Promise<undefined | string> = useCallback(
    async (params?: { needLoading?: boolean }) => {
      const { needLoading } = params || {};
      if (!isConnected || !walletInfo) return;

      if (checkTokenValid()) {
        return;
      } else {
        localStorage.removeItem(storages.accountInfo);
      }
      const timestamp = Date.now();
      const signStr = `${walletInfo?.address}-${timestamp}`;
      const hexDataStr = hexDataCopywriter + signStr;
      const signInfo = AElf.utils.sha256(signStr);
      const hexData = Buffer.from(hexDataStr).toString('hex');

      let publicKey = '';
      let signature = '';
      let source = '';

      if (walletType === WalletTypeEnum.discover) {
        try {
          const { pubKey, signatureStr } = await getSignatureAndPublicKey(signInfo, hexData);
          publicKey = pubKey || '';
          signature = signatureStr || '';
          source = 'portkey';
        } catch (error) {
          console.error('sign error', error);
          const resError = (error as Error).message;
          const { matchedErrorMsg, title } = matchErrorMsg(resError);
          matchedErrorMsg &&
            notification.error({ description: matchedErrorMsg, message: title || '' });
          isConnectWallet && disConnectWallet();
          return;
        }
      } else {
        const sign = await getSignature({
          appName: 'ecoearn',
          address: walletInfo?.address || '',
          signInfo:
            walletType === WalletTypeEnum.aa ? Buffer.from(signStr).toString('hex') : signInfo,
        });
        console.log('==signRes', sign);

        if (sign?.errorMessage) {
          const { matchedErrorMsg, title } = matchErrorMsg(
            (sign?.errorMessage as any)?.message || '',
          );
          matchedErrorMsg &&
            notification.error({ description: matchedErrorMsg, message: title || '' });
          isConnectWallet && disConnectWallet();
          return;
        }

        publicKey = walletInfo?.extraInfo?.publicKey || '';
        signature = sign?.signature || '';
        if (walletType === WalletTypeEnum.elf) {
          source = 'nightElf';
        } else {
          source = 'portkey';
        }
      }
      if (!publicKey) return;
      store.dispatch(setLoginStatus({ isLoadingToken: true }));
      const res = await getTokenFromServer({
        params: {
          grant_type: 'signature',
          scope: 'EcoEarnServer',
          client_id: 'EcoEarnServer_App',
          timestamp,
          signature,
          source,
          publickey: publicKey,
          address: walletInfo?.address || '',
        } as ITokenParams,
        needLoading,
      });
      store.dispatch(setLoginStatus({ isLoadingToken: false }));
      return res;
    },
    [
      isConnected,
      walletInfo,
      checkTokenValid,
      walletType,
      getTokenFromServer,
      getSignatureAndPublicKey,
      notification,
      isConnectWallet,
      disConnectWallet,
      getSignature,
    ],
  );

  return { getToken, checkTokenValid };
};
