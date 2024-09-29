'use client';
import StoreProvider from './store';
import { ConfigProvider, notification } from 'antd';
import { AELFDProvider } from 'aelf-design';
import enUS from 'antd/lib/locale/en_US';
import WebLoginProvider from './webLoginProvider';
import Loading from 'components/PageLoading/index';
import { createContext, useCallback, useEffect, useState } from 'react';
import { AELFDProviderTheme, ANTDProviderTheme } from './config';
import NiceModal from '@ebay/nice-modal-react';
import dynamic from 'next/dynamic';
import { APP_NAME, APP_PREFIX } from 'constants/index';
import { store } from 'redux/store';
import { getCmsInfo } from 'api/request';
import { setCmsInfo } from 'redux/reducer/info';
import ETransferLayout from './ETransferLayout';
import { AElfReactProvider } from '@aelf-react/core';
import React from 'react';
import { NotificationInstance } from 'antd/es/notification/interface';

const Updater = dynamic(() => import('components/Updater'), { ssr: false });

export const NotificationContext = createContext<NotificationInstance | null>(null);

function Provider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const fetchGlobalConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCmsInfo();
      store.dispatch(setCmsInfo(res.data));
    } catch (error) {
      console.log('fetchGlobalConfig error', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalConfig();
  }, [fetchGlobalConfig]);

  return (
    <NotificationContext.Provider value={api}>
      {contextHolder}
      <StoreProvider>
        <AELFDProvider theme={AELFDProviderTheme} prefixCls={APP_PREFIX}>
          <ConfigProvider
            theme={ANTDProviderTheme}
            locale={enUS}
            autoInsertSpaceInButton={false}
            prefixCls={APP_PREFIX}
          >
            {loading ? (
              <Loading content="Enrollment in progress" />
            ) : (
              <WebLoginProvider>
                <ETransferLayout>
                  <AElfReactProvider appName={APP_NAME}>
                    <Updater />
                    <NiceModal.Provider>{children}</NiceModal.Provider>
                  </AElfReactProvider>
                </ETransferLayout>
              </WebLoginProvider>
            )}
          </ConfigProvider>
        </AELFDProvider>
      </StoreProvider>
    </NotificationContext.Provider>
  );
}

export default Provider;
