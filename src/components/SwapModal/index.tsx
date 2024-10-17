import CommonModal from 'components/CommonModal';
import React, { useEffect, useMemo, useState } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import useResponsive from 'utils/useResponsive';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import styles from './style.module.css';
import { ComponentType, Swap, ISwapProps } from '@portkey/trader-react-ui';
import { AwakenSwapper, IPortkeySwapperAdapter } from '@portkey/trader-core';
import { useWalletService } from 'hooks/useWallet';
import { WalletTypeEnum } from '@etransfer/ui-react';
import { ICMSInfo } from 'redux/types/reducerTypes';
import useSwapService from './hooks/useSwapService';

export interface ISwapModalProps extends ISwapProps {
  onCancel: () => void;
}

function SwapModal(props: ISwapModalProps) {
  const { selectTokenInSymbol, selectTokenOutSymbol, onCancel } = props;
  const cmsInfo = useGetCmsInfo();
  const { isMD } = useResponsive();
  const modal = useModal();
  const [awakenInstance, setAwakenInstance] = useState<IPortkeySwapperAdapter>();
  const { walletType } = useWalletService();
  const { getOptions, tokenApprove } = useSwapService();

  const awakenProps = useMemo(() => {
    return {
      instance: awakenInstance,
      tokenApprove: walletType === WalletTypeEnum.aa ? tokenApprove : undefined,
      getOptions,
    };
  }, [awakenInstance, getOptions, tokenApprove, walletType]);

  const curRpcUrl = useMemo(() => {
    return (cmsInfo as Partial<ICMSInfo>)[`rpcUrl${cmsInfo?.curChain?.toLocaleUpperCase()}`];
  }, [cmsInfo]);

  useEffect(() => {
    if (!cmsInfo) return;
    const awakenIns = new AwakenSwapper({
      contractConfig: {
        swapContractAddress: cmsInfo?.awakenSwapContractAddress,
        rpcUrl: curRpcUrl || '',
      },
      requestDefaults: {
        baseURL: cmsInfo?.awakenUrl,
      },
    });
    awakenIns && setAwakenInstance(awakenIns);
  }, [cmsInfo, curRpcUrl]);

  return (
    <CommonModal
      title="Swap"
      footer={null}
      closable
      open={modal.visible}
      onCancel={() => {
        modal.hide();
      }}
    >
      <Swap
        selectTokenInSymbol={selectTokenInSymbol}
        selectTokenOutSymbol={selectTokenOutSymbol}
        containerClassName={styles.swapModalCustom}
        componentUiType={isMD ? ComponentType.Mobile : ComponentType.Web}
        onConfirmSwap={onCancel}
        chainId={cmsInfo?.curChain}
        awaken={awakenProps}
      />
    </CommonModal>
  );
}

export default NiceModal.create(SwapModal);
