'use client';

import React, { useEffect } from 'react';
import {
  ETransferConfig,
  ETransferLayoutProvider,
  ETransferStyleProvider,
} from '@etransfer/ui-react';
import '@etransfer/ui-react/dist/assets/index.css';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';

export default function ETransferLayout({ children }: { children: React.ReactNode }) {
  const { etransferConfig } = useGetCmsInfo() || {};

  useEffect(() => {
    ETransferConfig.setConfig({
      networkType: etransferConfig?.networkType,
      etransferUrl: etransferConfig?.etransferUrl,
      etransferAuthUrl: etransferConfig?.etransferAuthUrl,
      etransferSocketUrl: etransferConfig?.etransferSocketUrl,
    });
  }, [
    etransferConfig?.etransferAuthUrl,
    etransferConfig?.etransferSocketUrl,
    etransferConfig?.etransferUrl,
    etransferConfig?.networkType,
  ]);

  return (
    <ETransferStyleProvider>
      <ETransferLayoutProvider>{children}</ETransferLayoutProvider>
    </ETransferStyleProvider>
  );
}
