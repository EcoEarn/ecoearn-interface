'use client';
import React, { useEffect, useMemo } from 'react';
import { Layout as AntdLayout } from 'antd';
import Header from 'components/Header';
import dynamic from 'next/dynamic';

import { store } from 'redux/store';
import { setIsMobile } from 'redux/reducer/info';
import isMobile from 'utils/isMobile';
import Footer from 'components/Footer';
import { useWalletInit } from 'hooks/useWallet';
import WebLoginInstance from 'contract/webLogin';
import { SupportedELFChainId } from 'types';
import useGetStoreInfo from 'redux/hooks/useGetStoreInfo';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import WalletAndTokenInfo from 'utils/walletAndTokenInfo';
import { useGetToken } from 'hooks/useGetToken';

const Layout = dynamic(async () => {
  const { useWebLogin, useCallContract } = await import('aelf-web-login').then((module) => module);
  return (props: React.PropsWithChildren<{}>) => {
    const { children } = props;

    const { cmsInfo } = useGetStoreInfo();

    const webLoginContext = useWebLogin();
    const { getToken } = useGetToken();

    const pathname = usePathname();

    const { callSendMethod: callAELFSendMethod, callViewMethod: callAELFViewMethod } =
      useCallContract({
        chainId: SupportedELFChainId.MAIN_NET,
        rpcUrl: cmsInfo?.rpcUrlAELF,
      });
    const { callSendMethod: callTDVVSendMethod, callViewMethod: callTDVVViewMethod } =
      useCallContract({
        chainId: SupportedELFChainId.TDVV_NET,
        rpcUrl: cmsInfo?.rpcUrlTDVV,
      });
    const { callSendMethod: callTDVWSendMethod, callViewMethod: callTDVWViewMethod } =
      useCallContract({
        chainId: SupportedELFChainId.TDVW_NET,
        rpcUrl: cmsInfo?.rpcUrlTDVW,
      });

    useEffect(() => {
      const resize = () => {
        const ua = navigator.userAgent;
        const mobileType = isMobile(ua);
        const isMobileDevice =
          mobileType.apple.phone ||
          mobileType.android.phone ||
          mobileType.apple.tablet ||
          mobileType.android.tablet;
        store.dispatch(setIsMobile(isMobileDevice));
      };
      resize();
      window.addEventListener('resize', resize);
      return () => {
        window.removeEventListener('resize', resize);
      };
    }, []);

    useEffect(() => {
      console.log('webLoginContext.loginState', webLoginContext.loginState);
      WebLoginInstance.get().setContractMethod([
        {
          chain: SupportedELFChainId.MAIN_NET,
          sendMethod: callAELFSendMethod as MethodType,
          viewMethod: callAELFViewMethod as MethodType,
        },
        {
          chain: SupportedELFChainId.TDVV_NET,
          sendMethod: callTDVVSendMethod as MethodType,
          viewMethod: callTDVVViewMethod as MethodType,
        },
        {
          chain: SupportedELFChainId.TDVW_NET,
          sendMethod: callTDVWSendMethod as MethodType,
          viewMethod: callTDVWViewMethod as MethodType,
        },
      ]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [webLoginContext.loginState]);

    useWalletInit();

    const isHiddenHeader = useMemo(() => {
      return ['/privacy-policy'].includes(pathname);
    }, [pathname]);

    const isHiddenLayout = useMemo(() => {
      return ['/assets'].includes(pathname);
    }, [pathname]);

    useEffect(() => {
      WalletAndTokenInfo.setWallet(
        webLoginContext.walletType,
        webLoginContext.wallet,
        webLoginContext.version,
      );
      WalletAndTokenInfo.setSignMethod(getToken);
    }, [getToken, webLoginContext]);

    const pathName = usePathname();

    const widthLayout = useMemo(() => {
      return pathName.includes('/points/');
    }, [pathName]);

    return (
      <>
        {!isHiddenLayout ? (
          <AntdLayout
            id="pageContainer"
            className={clsx('h-full flex flex-col overflow-scroll min-w-[360px] bg-brandBg')}
          >
            {!isHiddenHeader && <Header />}
            <div className="flex-1">
              <AntdLayout.Content
                className={clsx(
                  'pb-4 w-full max-w-[1280px] mx-auto px-4 lg:px-10',
                  widthLayout && 'max-w-[1440px]',
                )}
              >
                {children}
              </AntdLayout.Content>
            </div>
            <Footer />
          </AntdLayout>
        ) : (
          <>{children}</>
        )}
      </>
    );
  };
});

export default Layout;
