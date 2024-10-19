import {
  Deposit,
  ETransferDepositProvider,
  ETransferConfig,
  ComponentStyle,
} from '@etransfer/ui-react';
import CommonModal from 'components/CommonModal';
import React, { useCallback, useEffect, useMemo } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import styles from './style.module.css';
import { Flex } from 'antd';
import { formatTokenSymbol } from 'utils/format';
import { ReactComponent as WarnSVG } from 'assets/img/warn.svg';
import useResponsive from 'utils/useResponsive';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import clsx from 'clsx';
import { useWalletService } from 'hooks/useWallet';
import { addPrefixSuffix } from 'utils/addressFormatting';

export interface IDepositModalProps {
  defaultDepositToken?: string;
  defaultReceiveToken: string;
  defaultNetwork?: string;
  onCancel?: () => void;
}

function DepositModal(props: IDepositModalProps) {
  const {
    defaultDepositToken = 'USDT',
    defaultReceiveToken = '',
    defaultNetwork = 'TRX',
    onCancel,
  } = props;
  const { curChain, etransferGitBookUrl } = useGetCmsInfo() || {};
  const { isMD } = useResponsive();
  const modal = useModal();
  const { wallet, walletType } = useWalletService();

  const tokenSymbolText = useMemo(() => {
    return formatTokenSymbol(defaultReceiveToken);
  }, [defaultReceiveToken]);

  const handleETransfer = useCallback(() => {
    etransferGitBookUrl && window.open(etransferGitBookUrl, '_blank');
  }, [etransferGitBookUrl]);

  const topTipText = useMemo(() => {
    return (
      <div className="text-sm font-normal text-neutralSecondary">
        <span>{`To acquire more ${tokenSymbolText}, it's recommended to use the crossechain tool, ETransfer, which allows you to swap USDT directly for ${tokenSymbolText}. If you need help using`}</span>{' '}
        <span
          className="underline font-medium text-[#127FFF] cursor-pointer"
          onClick={handleETransfer}
        >
          ETransfer
        </span>
        <span>{', feel free to check out the tutorial.'}</span>
      </div>
    );
  }, [handleETransfer, tokenSymbolText]);

  const title = useMemo(() => {
    return `Buy ${formatTokenSymbol(defaultReceiveToken)} with USDT`;
  }, [defaultReceiveToken]);

  useEffect(() => {
    ETransferConfig.setConfig({
      depositConfig: {
        defaultDepositToken: defaultDepositToken || 'USDT',
        defaultReceiveToken: defaultReceiveToken || 'SGR-1',
        defaultChainId: curChain || 'tDVV',
        defaultNetwork: defaultNetwork || 'TRX',
      },
      accountInfo: {
        accounts: {
          AELF: addPrefixSuffix(wallet?.address || '', 'AELF'),
          [curChain || 'tDVV']: addPrefixSuffix(wallet?.address || '', curChain || 'tDVV'),
        },
        walletType,
      },
    });
  }, [
    curChain,
    defaultDepositToken,
    defaultNetwork,
    defaultReceiveToken,
    wallet?.address,
    walletType,
  ]);

  return (
    <CommonModal
      title={title}
      footer={null}
      closable
      open={modal.visible}
      className={styles.modalCustom}
      onCancel={() => {
        modal.hide();
        onCancel?.();
      }}
    >
      <Flex align="start" gap={8}>
        <WarnSVG className="flex-shrink-0" />
        {topTipText}
      </Flex>
      <div
        className={clsx(
          isMD
            ? styles['etransfer-deposit-wrap-custom-mobile']
            : styles['etransfer-deposit-wrap-custom'],
        )}
      >
        <ETransferDepositProvider>
          <Deposit componentStyle={isMD ? ComponentStyle.Mobile : ComponentStyle.Web} />
        </ETransferDepositProvider>
      </div>
    </CommonModal>
  );
}

export default NiceModal.create(DepositModal);
