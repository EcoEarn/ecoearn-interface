import NiceModal, { useModal } from '@ebay/nice-modal-react';

// import { Modal } from 'antd';
import styles from './style.module.css';
import { useMount } from 'ahooks';
import { useState } from 'react';
// import { ReactComponent as Close } from 'assets/img/modal-close.svg';
import Loading from 'components/Loading/index';
import clsx from 'clsx';

export interface ILoadingProps {
  visible?: boolean;
  content?: string;
  showClose?: boolean;
  onClose?: () => void;
  type?: 'default' | 'block';
}

export function NiceLoading({
  showClose = false,
  content,
  onClose,
  type = 'default',
}: ILoadingProps) {
  const [isMount, setIsMount] = useState(false);

  const modal = useModal();

  useMount(() => {
    setIsMount(true);
  });

  if (!isMount) return null;

  return (
    <>
      {modal.visible && (
        <div
          className={clsx(
            'w-full h-full fixed top-0 left-0 text-black bg-transparent flex items-center justify-center z-[9900]',
            type === 'block' && '!bg-fillMask3',
          )}
        >
          {type === 'block' ? (
            <div
              className={clsx(
                'w-[128px] h-[128px] flex items-center justify-center bg-[#FFFFFFF2] rounded-[20px]',
                styles.shadow,
              )}
            >
              <Loading />
            </div>
          ) : (
            <Loading />
          )}
        </div>
      )}
    </>

    // <Modal
    //   zIndex={Number.MAX_SAFE_INTEGER}
    //   maskClosable={false}
    //   mask={false}
    //   className={`${styles.loading} ${showClose && styles.loadingWithClose}`}
    //   open={modal.visible}
    //   // open={true}
    //   footer={null}
    //   onCancel={modal.hide}
    //   closable={false}
    //   closeIcon={null}
    //   centered
    // >
    //   <section className="flex justify-center items-center">
    //     {/* <Loading />
    //     <span className="mt-[12px] text-[#1A1A1A] text-[14px] leading-[20px] font-normal text-center">
    //       {content || 'loading...'}
    //     </span> */}
    //     <Loading />
    //   </section>

    //   {showClose && (
    //     <Close
    //       className="absolute right-[12px] top-[12px] cursor-pointer"
    //       onClick={() => {
    //         onClose?.();
    //         modal.hide();
    //       }}
    //     />
    //   )}
    // </Modal>
  );
}

export default NiceModal.create(NiceLoading);
