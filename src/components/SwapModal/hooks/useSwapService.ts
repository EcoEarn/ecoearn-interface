import { getChainInfo, managerApprove, NetworkType } from '@portkey/did-ui-react';
import { useCallback, useEffect, useRef } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { aelf } from '@portkey/utils';
import { WalletTypeEnum } from '@aelf-web-login/wallet-adapter-base';
import { getContractBasic } from '@portkey/contracts';
import { PORTKEY_LOGIN_CHAIN_ID_KEY } from 'constants/common';
import { ChainId } from '@portkey/types';
import { TTokenApproveHandler } from '@portkey/trader-core';
import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { useAElfReact } from '@aelf-react/core';
import { AElfContextType } from '@aelf-react/core/dist/types';

export default function useSwapService() {
  const { walletType, walletInfo } = useConnectWallet();
  const cmsInfo = useGetCmsInfo();
  const { curChain, networkTypeV2 } = cmsInfo || {};
  const aelfReact = useAElfReact();
  const aelfReactInstanceRef = useRef<AElfContextType>();
  const discoverProviderInstanceRef = useRef<any>();

  useEffect(() => {
    aelfReactInstanceRef.current = aelfReact;
  }, [aelfReact]);

  useEffect(() => {
    discoverProviderInstanceRef.current = walletInfo?.extraInfo?.provider;
  }, [walletInfo?.extraInfo?.provider]);

  const getOptions: any = useCallback(async () => {
    if (walletType === WalletTypeEnum.unknown) throw 'unknown';
    if (walletType === WalletTypeEnum.aa) {
      if (!walletInfo?.extraInfo?.portkeyInfo) throw 'no managementAccount';
      const caHash = walletInfo?.extraInfo?.portkeyInfo?.caInfo?.caHash || '';
      const chainInfo = await getChainInfo(curChain);
      return {
        contractOptions: {
          account: aelf.getWallet(walletInfo?.extraInfo?.portkeyInfo?.walletInfo?.privateKey || ''),
          callType: 'ca' as any,
          caHash,
          caContractAddress: chainInfo.caContractAddress,
        },
        address: walletInfo?.extraInfo?.portkeyInfo?.caInfo?.caAddress || '',
      };
    } else if (walletType === WalletTypeEnum.discover) {
      const provider = discoverProviderInstanceRef.current;
      if (!provider) return;
      const chainProvider = await provider.getChain(curChain);
      const accountsResult = await provider.request({ method: 'requestAccounts' });
      const caAddress = accountsResult[curChain!]?.[0];
      return { contractOptions: { chainProvider }, address: caAddress };
    } else {
      const provider = await aelfReactInstanceRef.current?.activate({
        [curChain!]: {
          rpcUrl: (cmsInfo as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`],
          chainId: curChain!,
        },
      });
      const bridge = provider?.[curChain!];
      if (!bridge) return;
      const loginInfo = await bridge.login({ chainId: curChain!, payload: { method: 'LOGIN' } });
      await bridge.chain.getChainStatus();
      const address = JSON.parse(loginInfo?.detail ?? '{}').address;
      return {
        contractOptions: {
          aelfInstance: bridge,
          account: {
            address: address,
          },
        },
        address,
      };
    }
  }, [cmsInfo, curChain, walletInfo?.extraInfo?.portkeyInfo, walletType]);

  const tokenApprove: TTokenApproveHandler = useCallback(
    async (params) => {
      const originChainId = (localStorage.getItem(PORTKEY_LOGIN_CHAIN_ID_KEY) ||
        curChain) as ChainId;
      const caHash = walletInfo?.extraInfo?.portkeyInfo?.caInfo?.caHash || '';
      const chainInfo = await getChainInfo(curChain);

      const [portkeyContract] = await Promise.all(
        [chainInfo.caContractAddress, chainInfo.defaultToken.address].map((ca) =>
          getContractBasic({
            contractAddress: ca,
            account: aelf.getWallet(
              walletInfo?.extraInfo?.portkeyInfo?.walletInfo?.privateKey || '',
            ),
            rpcUrl: chainInfo.endPoint,
          }),
        ),
      );

      const result = await managerApprove({
        originChainId: originChainId,
        symbol: params.symbol,
        caHash,
        amount: params.amount,
        spender: params.spender,
        targetChainId: curChain!,
        networkType: networkTypeV2 as NetworkType,
        dappInfo: {
          name: 'ecoearn',
        },
      });
      console.log('result===', result);

      const approveResult = await portkeyContract.callSendMethod('ManagerApprove', '', {
        caHash,
        spender: params.spender,
        symbol: result.symbol,
        amount: result.amount,
        guardiansApproved: result.guardiansApproved,
      });
      if (approveResult.error) throw approveResult.error;
    },
    [
      curChain,
      networkTypeV2,
      walletInfo?.extraInfo?.portkeyInfo?.caInfo?.caHash,
      walletInfo?.extraInfo?.portkeyInfo?.walletInfo?.privateKey,
    ],
  );

  return {
    getOptions,
    tokenApprove,
  };
}
