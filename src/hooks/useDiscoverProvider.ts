import { IPortkeyProvider, MethodsWallet } from '@portkey/provider-types';
import { detectDiscoverProvider } from 'aelf-web-login';
import elliptic from 'elliptic';
import { zeroFill } from 'utils/calculate';

const ec = new elliptic.ec('secp256k1');

export default function useDiscoverProvider() {
  const discoverProvider = async () => {
    const provider: IPortkeyProvider | null = await detectDiscoverProvider();
    if (provider) {
      if (!provider.isPortkey) {
        throw new Error('Discover provider found, but check isPortkey failed');
      }
      return provider;
    } else {
      return null;
    }
  };

  const getSignatureAndPublicKey = async (data: string) => {
    const provider = await discoverProvider();
    if (!provider || !provider?.request) throw new Error('Discover not connected');
    const signature = await provider.request({
      method: MethodsWallet.GET_WALLET_SIGNATURE,
      payload: { data },
    });
    if (!signature || signature.recoveryParam == null) return {};
    const signatureStr = [
      zeroFill(signature.r),
      zeroFill(signature.s),
      `0${signature.recoveryParam.toString()}`,
    ].join('');

    // recover pubkey by signature
    const publicKey = ec.recoverPubKey(
      Buffer.from(data.slice(0, 64), 'hex'),
      signature,
      signature.recoveryParam,
    );
    const pubKey = ec.keyFromPublic(publicKey).getPublic('hex');

    return { pubKey, signatureStr };
  };

  return { discoverProvider, getSignatureAndPublicKey };
}
