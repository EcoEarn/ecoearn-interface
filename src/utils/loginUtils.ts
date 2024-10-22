import { did } from '@portkey/did-ui-react';
import { LoginStatusEnum } from '@portkey/types';
import { setShowLoginErrorModal } from 'redux/reducer/info';
import { store } from 'redux/store';

export function checkLoginSuccess() {
  console.log('did.didWallet.isLoginStatus', did.didWallet.isLoginStatus);
  if (did.didWallet.isLoginStatus === LoginStatusEnum.FAIL) {
    store.dispatch(setShowLoginErrorModal(true));
    return false;
  }
  return true;
}
