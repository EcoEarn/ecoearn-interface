import { did } from '@portkey/did-ui-react';
import { ChainId } from '@portkey/provider-types';
import { GetCAHolderByManagerParams } from '@portkey/services';
import { WalletInfo, WalletType } from 'aelf-web-login';
import { PORTKEY_LOGIN_CHAIN_ID_KEY } from 'constants/common';

export const getCaHashAndOriginChainIdByWallet = async (
  caAddress: string,
): Promise<{ caHash: string; originChainId: ChainId }> => {
  const res = await did.services.getHolderInfoByManager({
    caAddresses: [caAddress],
  } as unknown as GetCAHolderByManagerParams);
  const caInfo = res[0];
  const caHash = caInfo?.caHash;
  const originChainId = caInfo?.chainId as ChainId;

  return {
    caHash: caHash || '',
    originChainId,
  };
};

export const getCaInfo = async ({
  walletType,
  address,
  walletInfo,
}: {
  walletType: WalletType;
  address: string;
  walletInfo: WalletInfo;
}) => {
  if (walletType === WalletType.portkey) {
    const originChainId = (localStorage.getItem(PORTKEY_LOGIN_CHAIN_ID_KEY) || '') as ChainId;
    const caInfo = walletInfo.portkeyInfo?.caInfo;

    if (!caInfo?.caHash || !caInfo.caAddress || !originChainId)
      throw new Error('You are not logged in.');
    return {
      ...caInfo,
      originChainId,
    };
  } else {
    const caAddress = address;
    if (!caAddress) throw new Error('You are not logged in.');
    const { caHash, originChainId } = await getCaHashAndOriginChainIdByWallet(caAddress);
    return {
      caHash,
      originChainId,
      caAddress,
    };
  }
};
