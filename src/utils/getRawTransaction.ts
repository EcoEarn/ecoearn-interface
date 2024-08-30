import { getRawTransactionPortkey } from './getRawTransactionPortkey';
import { getRawTransactionDiscover } from './getRawTransactionDiscover';
import { getRawTransactionNightELF } from './getRawTransactionNightELF';
import { TWalletInfo, WalletTypeEnum } from '@aelf-web-login/wallet-adapter-base';

export interface IRowTransactionPrams<T> {
  walletInfo: TWalletInfo;
  walletType: WalletTypeEnum;
  params: T;
  methodName: string;
  contractAddress: string;
  caContractAddress: string;
  rpcUrl: string;
  chainId: Chain;
}

export const getRawTransaction: <T>(
  params: IRowTransactionPrams<T>,
) => Promise<string | null> = async ({
  walletInfo,
  contractAddress,
  caContractAddress,
  methodName,
  walletType,
  params,
  rpcUrl,
  chainId,
}: IRowTransactionPrams<any>) => {
  console.log('getRawTransaction params', params, rpcUrl, methodName, chainId, walletType);
  if (!rpcUrl || !chainId) return Promise.reject('');

  let res = null;

  try {
    switch (walletType) {
      case WalletTypeEnum.aa:
        if (!walletInfo?.extraInfo?.portkeyInfo) return Promise.reject('');
        res = await getRawTransactionPortkey({
          caHash: walletInfo?.extraInfo?.portkeyInfo.caInfo.caHash,
          privateKey: walletInfo?.extraInfo?.portkeyInfo.walletInfo.privateKey,
          contractAddress,
          caContractAddress,
          rpcUrl,
          params,
          methodName,
        });
        break;
      case WalletTypeEnum.discover:
        if (!walletInfo?.address) return Promise.reject('');
        res = await getRawTransactionDiscover({
          contractAddress,
          caAddress: walletInfo?.address,
          caContractAddress,
          rpcUrl,
          params,
          methodName,
        });
        break;
      case WalletTypeEnum.elf:
        res = await getRawTransactionNightELF({
          contractAddress,
          params,
          chainId,
          account: walletInfo?.address || '',
          methodName,
          rpcUrl,
        });
        break;
    }

    return res;
  } catch (error) {
    console.log('getRawTransaction error', error);
    return Promise.reject(error);
  }
};
