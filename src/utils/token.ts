import { WebLoginState } from 'aelf-web-login';
import { IAccountInfo } from 'types';
import { storages } from 'storages';
import { needCheckTokenUrl } from 'constants/token';

export const isCurrentPageNeedToken = (): boolean => {
  if (['/term-service', '/privacy-policy'].includes(window.location.pathname)) {
    return false;
  }
  return true;
};

export const getAccountInfoFromStorage = (): IAccountInfo => {
  const accountInfo = JSON.parse(localStorage.getItem(storages.accountInfo) || '{}');
  return accountInfo;
};

export const isNeedCheckToken = (requestPath: string): boolean => {
  let url = requestPath;
  if (requestPath && requestPath[0] === '/') {
    url = requestPath.substring(1);
  }
  if (needCheckTokenUrl.includes(url)) {
    return true;
  }
  return false;
};

export const checkAccountExpired = (accountInfo: IAccountInfo, address: string): boolean => {
  if (
    accountInfo?.token &&
    accountInfo?.expirationTime &&
    Date.now() < accountInfo?.expirationTime &&
    accountInfo.account === address
  ) {
    return false;
  }
  return true;
};

export const checkTokenValid = (loginState: WebLoginState, address: string) => {
  if (loginState !== WebLoginState.logined) return false;
  const accountInfo = JSON.parse(localStorage.getItem(storages.accountInfo) || '{}');

  if (
    accountInfo?.token &&
    Date.now() < accountInfo?.expirationTime &&
    accountInfo.account === address
  ) {
    return true;
  } else {
    return false;
  }
};

export const createToken = async (props: {
  signMethod: () => Promise<undefined | string>;
}): Promise<undefined | string> => {
  const { signMethod } = props;
  const res = signMethod();
  return res;
};
