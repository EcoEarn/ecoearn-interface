import detectProvider from '@portkey/detect-provider';
import { IPortkeyProvider } from '@portkey/provider-types';

export default class PortkeyProvider {
  private static instance: IPortkeyProvider | null = null;
  private static walletInstance: unknown | null = null;

  static async getDetectProvider() {
    if (!PortkeyProvider.instance) {
      PortkeyProvider.instance = await detectProvider();
    }
    return PortkeyProvider.instance;
  }

  static async getWalletInstance() {
    if (PortkeyProvider.walletInstance) {
      return PortkeyProvider.walletInstance;
    }
    return null;
  }

  static async setWalletInfoInstance(walletInfo: unknown) {
    PortkeyProvider.walletInstance = walletInfo;
  }
}
