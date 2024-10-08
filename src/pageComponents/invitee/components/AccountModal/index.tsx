import { Button, Modal } from 'aelf-design';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import useResponsive from 'hooks/useResponsive';
import Image from 'next/image';
import styles from './style.module.css';
import { useCallback, useState } from 'react';
import { singleMessage } from '@portkey/did-ui-react';
import { IContractError } from 'types';
import useNotification from 'hooks/useNotification';

interface IAccountModal {
  showLoading?: boolean;
  title: string;
  content: string;
  btnText: string;
  onOk: () => void;
}

function AccountModal({ showLoading, title, content, btnText, onOk }: IAccountModal) {
  const modal = useModal();
  const { isLG } = useResponsive();
  const [loading, setLoading] = useState(false);
  const notification = useNotification();

  const handleClick = useCallback(async () => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      await onOk();
    } catch (error) {
      const errorTip = (error as IContractError).errorMessage?.message;
      errorTip && notification.error({ description: errorTip });
    } finally {
      setLoading(false);
    }
  }, [notification, onOk, showLoading]);

  return (
    <Modal
      centered
      width={isLG ? 343 : 630}
      className={styles['invitee-modal']}
      title={<div className="text-2xl font-semibold text-neutralTitle">{title}</div>}
      open={modal.visible}
      maskClosable={false}
      mask={false}
      closeIcon={false}
      footer={
        <Button
          className="w-full !rounded-lg lg:!w-[256px] mx-auto"
          type="primary"
          onClick={handleClick}
          loading={loading}
        >
          {btnText}
        </Button>
      }
    >
      <div className="my-8 text-neutralTitle text-base font-normal">{content}</div>
      <Image
        className="absolute top-[-44px] lg:top-[-38px] left-6 lg:left-[50px]"
        src={require('assets/img/referral/token.svg').default}
        width={75}
        height={76}
        alt="token"
      />
      <Image
        className="absolute top-[-36px] right-[40px] lg:top-[-48px] lg:right-[47px] z-[-1]"
        src={require('assets/img/referral/ribbon1.svg').default}
        width={isLG ? 73 : 97}
        height={isLG ? 40 : 53}
        alt="ribbonTop"
      />
      <Image
        className="absolute top-[-9px] right-[-13px] lg:top-[-12px] lg:right-[-41px]"
        src={require('assets/img/referral/ribbon2.svg').default}
        width={isLG ? 53 : 71}
        height={isLG ? 116 : 154}
        alt="ribbonRight"
      />
    </Modal>
  );
}

export default NiceModal.create(AccountModal);
