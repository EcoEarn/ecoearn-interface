'use client';
import React, { useEffect, useMemo, useRef } from 'react';
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
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import WalletAndTokenInfo from 'utils/walletAndTokenInfo';
import { useGetToken } from 'hooks/useGetToken';
import useResponsive from 'utils/useResponsive';
import VConsole from 'vconsole';

import { useScroll } from 'ahooks';

const needCustomBackgroundPath = ['/referral', '/invitee'];

const Layout = dynamic(
  async () => {
    const { useConnectWallet } = await import('@aelf-web-login/wallet-adapter-react').then(
      (module) => module,
    );
    return (props: React.PropsWithChildren<{}>) => {
      const { children } = props;
      const webLoginContext = useConnectWallet();
      const { getToken } = useGetToken();
      const pathname = usePathname();
      const { callSendMethod, callViewMethod } = useConnectWallet();
      const path = usePathname();
      const { isMin } = useResponsive();

      const backgroundStyle: Record<string, string> = useMemo(() => {
        return {
          '/invitee': isMin
            ? `bg-[url(../assets/img/referral/smallBg.jpeg)]`
            : `bg-[url(../assets/img/referral/bigBg.jpeg)]`,
          '/referral': isMin
            ? `bg-[url(../assets/img/referral/smallBg.jpeg)]`
            : `bg-[url(../assets/img/referral/bigBg.jpeg)]`,
        };
      }, [isMin]);

      const isCustomBackgroundPage = useMemo(() => {
        return needCustomBackgroundPath.includes(path);
      }, [path]);

      const customBackgroundClassName = useMemo(() => {
        return isCustomBackgroundPage ? backgroundStyle?.[path] : undefined;
      }, [backgroundStyle, isCustomBackgroundPage, path]);

      useEffect(() => {
        if (process.env.NEXT_PUBLIC_APP_ENV !== 'production') {
          new VConsole();
        }
      }, []);

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
        console.log('webLoginContext.isConnected', webLoginContext.isConnected);
        WebLoginInstance.get().setContractMethod([
          {
            chain: SupportedELFChainId.MAIN_NET,
            sendMethod: callSendMethod as MethodType,
            viewMethod: callViewMethod as MethodType,
          },
          {
            chain: SupportedELFChainId.TDVV_NET,
            sendMethod: callSendMethod as MethodType,
            viewMethod: callViewMethod as MethodType,
          },
          {
            chain: SupportedELFChainId.TDVW_NET,
            sendMethod: callSendMethod as MethodType,
            viewMethod: callViewMethod as MethodType,
          },
        ]);
      }, [callSendMethod, callViewMethod, webLoginContext.isConnected]);

      useWalletInit();

      const isHiddenLayout = useMemo(() => {
        return ['/assets'].includes(pathname);
      }, [pathname]);

      useEffect(() => {
        WalletAndTokenInfo.setWallet(webLoginContext.walletType, webLoginContext.walletInfo);
        WalletAndTokenInfo.setSignMethod(getToken);
      }, [getToken, webLoginContext]);

      const pathName = usePathname();

      const widthLayout = useMemo(() => {
        return pathName.includes('/points/');
      }, [pathName]);

      const ref = useRef(null);
      const scroll: any = useScroll(ref);

      console.log('scroll', scroll?.top);

      return (
        <>
          {!isHiddenLayout ? (
            <AntdLayout
              id="pageContainer"
              ref={ref}
              className={clsx(
                'h-full flex flex-col overflow-scroll min-w-[360px] !bg-brandBg bg-no-repeat bg-cover bg-center',
                isCustomBackgroundPage && customBackgroundClassName,
              )}
            >
              <Header
                isCustomBg={isCustomBackgroundPage}
                className={`${scroll?.top > 10 && 'bg-brandBg'}`}
              />
              <div className="flex-1">
                <AntdLayout.Content
                  className={clsx(
                    'pb-[72px] w-full max-w-[1440px] mx-auto px-4 lg:px-10 h-full',
                    widthLayout && 'max-w-[1440px]',
                  )}
                >
                  {children}
                </AntdLayout.Content>
              </div>
              <Footer isCustomBg={isCustomBackgroundPage} />
            </AntdLayout>
          ) : (
            <>{children}</>
          )}
          <div
            className={clsx(
              'w-[100vw] h-[100vh] absolute top-0 left-0 !bg-cover bg-center bg-no-repeat z-[-1000] invisible',
              backgroundStyle.invitee,
            )}
          ></div>
        </>
      );
    };
  },
  { ssr: false },
);

export default Layout;
