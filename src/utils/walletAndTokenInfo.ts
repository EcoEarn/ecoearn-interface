import { TWalletInfo, WalletTypeEnum } from '@aelf-web-login/wallet-adapter-base';

export interface SignatureData {
  error: number;
  errorMessage: string;
  signature: string;
  from: string;
}
export default class WalletAndTokenInfo {
  public static signInfo: SignatureData | null;
  public static walletType: WalletTypeEnum | null;
  public static walletInfo: TWalletInfo | null;
  public static getSignature: (() => Promise<string | undefined>) | null;

  public static setSignInfo(data: SignatureData) {
    this.signInfo = data;
  }

  public static setWallet(walletType: WalletTypeEnum, walletInfo: TWalletInfo) {
    this.walletInfo = walletInfo;
    this.walletType = walletType;
  }

  public static setSignMethod(method: () => Promise<string | undefined>) {
    this.getSignature = method;
  }

  public static getToken(requestPath: string) {
    return new Promise(async (resolve, reject) => {
      const {
        isCurrentPageNeedToken,
        getAccountInfoFromStorage,
        isNeedCheckToken,
        checkAccountExpired,
        createToken,
      } = require('./token');
      if (!isCurrentPageNeedToken()) {
        return resolve(false);
      }

      const accountInfo = getAccountInfoFromStorage();

      if (!isNeedCheckToken(requestPath)) {
        return resolve(accountInfo.token);
      }

      if (!checkAccountExpired(accountInfo, this.walletInfo?.address || '')) {
        return resolve(accountInfo.token);
      }

      if (!(this.getSignature && this.walletInfo && this.walletType)) {
        return reject();
      }

      const res = await createToken({ signMethod: this.getSignature });

      if (res) {
        return resolve(res.token);
      }
      return reject();
    });
  }

  public static reset() {
    this.signInfo = null;
    this.walletInfo = null;
    this.walletType = null;
    this.getSignature = null;
  }
}
