'use client';
import StoreProvider from './store';
import { ConfigProvider } from 'antd';
import { AELFDProvider } from 'aelf-design';
import enUS from 'antd/lib/locale/en_US';
import WebLoginProvider from './webLoginProvider';
import Loading from 'components/PageLoading/index';
import { useCallback, useEffect, useState } from 'react';
import { AELFDProviderTheme, ANTDProviderTheme } from './config';
import NiceModal from '@ebay/nice-modal-react';
import dynamic from 'next/dynamic';
import { APP_PREFIX } from 'constants/index';
import { store } from 'redux/store';
import { getCmsInfo } from 'api/request';
import { setCmsInfo } from 'redux/reducer/info';

const Updater = dynamic(() => import('components/Updater'), { ssr: false });

function Provider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

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
    <>
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
                <Updater />
                <NiceModal.Provider>{children}</NiceModal.Provider>
              </WebLoginProvider>
            )}
          </ConfigProvider>
        </AELFDProvider>
      </StoreProvider>
    </>
  );
}

export default Provider;
