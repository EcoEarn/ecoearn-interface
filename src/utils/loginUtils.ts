import { WalletTypeEnum } from '@aelf-web-login/wallet-adapter-base';
import { did } from '@portkey/did-ui-react';
import { LoginStatusEnum } from '@portkey/types';
import { message } from 'antd';
import { ACCOUNT_SYNC_TIP } from 'constants/message';
import { storages } from 'storages';

export function checkLoginSuccess() {
  console.log('=====checkLoginOnChainStatus', did.didWallet.isLoginStatus);
  const loginOnChainStatus = did.didWallet.isLoginStatus;
  const walletType = localStorage.getItem(storages.currentLoginWalletType);

  if (walletType === WalletTypeEnum.aa && loginOnChainStatus === LoginStatusEnum.INIT) {
    message.warning(ACCOUNT_SYNC_TIP);
    return false;
  }
  return true;
}
