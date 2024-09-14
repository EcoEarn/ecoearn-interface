import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import { IPortkeyProvider, MethodsWallet } from '@portkey/provider-types';
import elliptic from 'elliptic';
import { useCallback } from 'react';
import { zeroFill } from 'utils/calculate';
import AElf from 'aelf-sdk';

const ec = new elliptic.ec('secp256k1');

export const recoverPubKeyBySignature = (msg: any, signature: string) => {
  const signatureObj = {
    r: signature.slice(0, 64),
    s: signature.slice(64, 128),
    recoveryParam: Number(signature.slice(128, 130)),
  };

  const hexMsg = AElf.utils.sha256(msg);
  const publicKey = AElf.wallet.ellipticEc
    .recoverPubKey(Buffer.from(hexMsg, 'hex'), signatureObj, signatureObj.recoveryParam)
    .encode('hex', false);

  console.log('=====recoverPubKeyBySignature', publicKey);
  return publicKey;
};

export default function useDiscoverProvider() {
  const { walletInfo } = useConnectWallet();
  const discoverProvider = useCallback(async () => {
    const provider: IPortkeyProvider | null = walletInfo?.extraInfo?.provider;
    if (provider) {
      if (!provider?.isPortkey) {
        throw new Error('Discover provider found, but check isPortkey failed');
      }
      return provider;
    } else {
      return null;
    }
  }, [walletInfo?.extraInfo?.provider]);

  const getSignatureAndPublicKey = useCallback(
    async (data: string, hexData: string, signInfo: string) => {
      const provider = await discoverProvider();
      if (!provider || !provider?.request) throw new Error('Discover not connected');
      const isSupportManagerSignature = (provider as any).methodCheck('wallet_getManagerSignature');
      const signature = await provider.request({
        method: isSupportManagerSignature
          ? 'wallet_getManagerSignature'
          : MethodsWallet.GET_WALLET_SIGNATURE,
        payload: isSupportManagerSignature ? { hexData: data } : { data },
      });
      if (!signature || signature.recoveryParam == null) return {};
      const signatureStr = [
        signature.r.toString(16, 64),
        signature.s.toString(16, 64),
        `0${signature.recoveryParam.toString()}`,
      ].join('');

      const pubKey = recoverPubKeyBySignature(signInfo, signatureStr) + '';

      return { pubKey, signatureStr };
    },
    [discoverProvider],
  );

  return { discoverProvider, getSignatureAndPublicKey };
}
