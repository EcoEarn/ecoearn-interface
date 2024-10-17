import { PortkeyDiscoverWallet } from '@aelf-web-login/wallet-adapter-portkey-discover';
import { PortkeyAAWallet } from '@aelf-web-login/wallet-adapter-portkey-aa';
import { NightElfWallet } from '@aelf-web-login/wallet-adapter-night-elf';
import { IBaseConfig, IConfigProps } from '@aelf-web-login/wallet-adapter-bridge';
import {
  TChainId,
  SignInDesignEnum,
  NetworkEnum,
  WalletAdapter,
} from '@aelf-web-login/wallet-adapter-base';
import { useMemo } from 'react';
import { GlobalConfigProps } from '@portkey/did-ui-react/dist/_types/src/components/config-provider/types';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { APP_NAME } from 'constants/index';

export default function useWebLoginConfig() {
  const cmsInfo = useGetCmsInfo();
  const {
    networkTypeV2,
    curChain,
    graphqlServerV2,
    connectUrlV2,
    portkeyServerV2,
    telegramBotId,
    rpcUrlAELF,
    rpcUrlTDVV,
    rpcUrlTDVW,
  } = cmsInfo || {};

  const didConfig: GlobalConfigProps = useMemo(() => {
    return {
      graphQLUrl: graphqlServerV2,
      connectUrl: connectUrlV2,
      serviceUrl: portkeyServerV2,
      requestDefaults: {
        timeout: networkTypeV2 === 'TESTNET' ? 300000 : 80000,
        baseURL: portkeyServerV2 || '',
      },
      socialLogin: {
        // Portkey: {
        //   websiteName: APP_NAME,
        //   websiteIcon: WEBSITE_ICON,
        // },
        Telegram: {
          botId: telegramBotId,
        },
      },
      referralInfo: {
        referralCode: '',
        projectCode: '13025',
      },
    };
  }, [connectUrlV2, graphqlServerV2, networkTypeV2, portkeyServerV2, telegramBotId]);

  const baseConfig: IBaseConfig = useMemo(() => {
    return {
      showVconsole: false,
      networkType: networkTypeV2 as NetworkEnum,
      chainId: curChain as TChainId,
      keyboard: true,
      noCommonBaseModal: false,
      design: SignInDesignEnum.CryptoDesign,
      titleForSocialDesign: 'Crypto wallet',
      // iconSrcForSocialDesign: 'url or base64',
      enableAcceleration: true,
    };
  }, [curChain, networkTypeV2]);

  const wallets: WalletAdapter[] = useMemo(() => {
    return [
      new PortkeyAAWallet({
        appName: APP_NAME,
        chainId: curChain as TChainId,
        autoShowUnlock: true,
        noNeedForConfirm: true,
      }),
      new PortkeyDiscoverWallet({
        networkType: networkTypeV2 as NetworkEnum,
        chainId: curChain as TChainId,
        autoRequestAccount: true, // If set to true, please contact Portkey to add whitelist @Rachel
        autoLogoutOnDisconnected: true,
        autoLogoutOnNetworkMismatch: true,
        autoLogoutOnAccountMismatch: true,
        autoLogoutOnChainMismatch: true,
      }),
      new NightElfWallet({
        chainId: curChain as TChainId,
        appName: APP_NAME,
        connectEagerly: true,
        defaultRpcUrl: rpcUrlAELF || '',
        nodes: {
          AELF: {
            chainId: 'AELF',
            rpcUrl: rpcUrlAELF || '',
          },
          tDVW: {
            chainId: 'tDVW',
            rpcUrl: rpcUrlTDVW || '',
          },
          tDVV: {
            chainId: 'tDVV',
            rpcUrl: rpcUrlTDVV || '',
          },
        },
      }),
    ];
  }, [curChain, networkTypeV2, rpcUrlAELF, rpcUrlTDVV, rpcUrlTDVW]);

  const config: IConfigProps | null = useMemo(() => {
    if (!cmsInfo) return null;
    return {
      didConfig,
      baseConfig,
      wallets,
    };
  }, [baseConfig, cmsInfo, didConfig, wallets]);

  return config;
}
