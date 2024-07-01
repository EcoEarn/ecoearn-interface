import NiceModal, { useModal } from '@ebay/nice-modal-react';

import { Modal } from 'antd';
import styles from './style.module.css';
import { useMount } from 'ahooks';
import { useState } from 'react';
import { ReactComponent as Close } from 'assets/img/modal-close.svg';
import Loading from 'components/Loading/index';

export interface ILoadingProps {
  visible?: boolean;
  content?: string;
  showClose?: boolean;
  onClose?: () => void;
}

export function NiceLoading({ showClose = false, content, onClose }: ILoadingProps) {
  const [isMount, setIsMount] = useState(false);

  const modal = useModal();

  useMount(() => {
    setIsMount(true);
  });

  if (!isMount) return null;

  return (
    <Modal
      zIndex={Number.MAX_SAFE_INTEGER}
      maskClosable={false}
      className={`${styles.loading} ${showClose && styles.loadingWithClose}`}
      open={modal.visible}
      footer={null}
      onCancel={modal.hide}
      closable={false}
      closeIcon={null}
      centered
    >
      <section className="flex flex-col justify-center items-center">
        <Loading />
        <span className="mt-[12px] text-[#1A1A1A] text-[14px] leading-[20px] font-normal text-center">
          {content || 'loading...'}
        </span>
      </section>
      {showClose && (
        <Close
          className="absolute right-[12px] top-[12px] cursor-pointer"
          onClick={() => {
            onClose?.();
            modal.hide();
          }}
        />
      )}
    </Modal>
  );
}

export default NiceModal.create(NiceLoading);
