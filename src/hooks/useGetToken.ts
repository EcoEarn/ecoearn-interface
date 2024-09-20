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
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import { WalletTypeEnum } from '@aelf-web-login/wallet-adapter-base';

const AElf = require('aelf-sdk');

const hexDataCopywriter = `Welcome to EcoEarn! Click to connect wallet to and accept its Terms of Service and Privacy Policy. This request will not trigger a blockchain transaction or cost any gas fees.

signature: `;

export const useGetToken = () => {
  const { walletInfo, walletType, disConnectWallet, getSignature, isConnected } =
    useConnectWallet();
  const { showLoading, closeLoading } = useLoading();
  const { getSignatureAndPublicKey } = useDiscoverProvider();

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
      needLoading && showLoading();
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
          isConnectWallet && disConnectWallet();
          needLoading && closeLoading();
          return '';
        }
      }
    },
    [closeLoading, disConnectWallet, isConnectWallet, showLoading, walletInfo],
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
      console.log('======getToken');
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
          const resError = error as IContractError;
          const errorMessage = formatErrorMsg(resError).errorMessage.message;
          message.error(errorMessage);
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
        if (sign?.errorMessage) {
          const errorMessage = formatErrorMsg(sign?.errorMessage as unknown as IContractError)
            .errorMessage.message;
          message.error(errorMessage);
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

      return res;
    },
    [
      isConnected,
      walletInfo,
      checkTokenValid,
      walletType,
      getTokenFromServer,
      getSignatureAndPublicKey,
      isConnectWallet,
      disConnectWallet,
      getSignature,
    ],
  );

  return { getToken, checkTokenValid };
};
