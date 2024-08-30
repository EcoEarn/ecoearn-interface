import { ICallContractParams } from '@aelf-web-login/wallet-adapter-base';
import { SupportedELFChainId } from 'types';

export interface IWebLoginArgs {
  address: string;
  chainId: string;
}

type MethodType = <T, R>(params: ICallContractParams<T>) => Promise<R>;

export default class WebLoginInstance {
  public contract: any;
  public address: string | undefined;
  public chainId: string | undefined;

  private static instance: WebLoginInstance | null = null;
  private sendMethod?: MethodType = undefined;
  private viewMethod?: MethodType = undefined;

  constructor(options?: IWebLoginArgs) {
    this.address = options?.address;
    this.chainId = options?.chainId;
  }
  static get() {
    if (!WebLoginInstance.instance) {
      WebLoginInstance.instance = new WebLoginInstance();
    }
    return WebLoginInstance.instance;
  }

  setMethod({
    chain,
    sendMethod,
    viewMethod,
  }: {
    chain: Chain;
    sendMethod: MethodType;
    viewMethod: MethodType;
  }) {
    switch (chain) {
      case SupportedELFChainId.MAIN_NET: {
        this.sendMethod = sendMethod;
        this.viewMethod = viewMethod;
        break;
      }
      case SupportedELFChainId.TDVV_NET: {
        this.sendMethod = sendMethod;
        this.viewMethod = viewMethod;
        break;
      }
      case SupportedELFChainId.TDVW_NET: {
        this.sendMethod = sendMethod;
        this.viewMethod = viewMethod;
        break;
      }
    }
  }

  setContractMethod(
    contractMethod: {
      chain: Chain;
      sendMethod: MethodType;
      viewMethod: MethodType;
    }[],
  ) {
    contractMethod.forEach((item) => {
      this.setMethod(item);
    });
  }

  callSendMethod<T, R>(chain: Chain, params: ICallContractParams<T>): Promise<R> {
    switch (chain) {
      case SupportedELFChainId.MAIN_NET:
        return this.sendMethod!(params);
      case SupportedELFChainId.TDVV_NET:
        return this.sendMethod!(params);
      case SupportedELFChainId.TDVW_NET:
        return this.sendMethod!(params);
    }
    throw new Error('Error: Invalid chainId');
  }

  callViewMethod<T, R>(chain: Chain, params: ICallContractParams<T>): Promise<R> {
    switch (chain) {
      case SupportedELFChainId.MAIN_NET:
        return this.viewMethod!(params);
      case SupportedELFChainId.TDVV_NET:
        return this.viewMethod!(params);
      case SupportedELFChainId.TDVW_NET:
        return this.viewMethod!(params);
    }
    throw new Error('Error: Invalid chainId');
  }
}

export const webLoginInstance = WebLoginInstance.get();
