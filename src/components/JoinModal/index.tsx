import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Button } from 'aelf-design';
import CommonModal from 'components/CommonModal';
import styles from './style.module.css';
import useJoin from 'hooks/useJoin';
import { useCallback } from 'react';
import useResponsive from 'utils/useResponsive';

interface IJoinModalProps {
  onSuccess?: () => void;
}

function JoinModal(props: IJoinModalProps) {
  const { onSuccess } = props;
  const { onJoin, loading } = useJoin();
  const { isMD } = useResponsive();
  const modal = useModal();

  const handleJoin = useCallback(async () => {
    const joinRes = await onJoin();
    if (joinRes) {
      onSuccess?.();
    }
  }, [onJoin, onSuccess]);

  return (
    <CommonModal
      disableMobileLayout
      className={styles.joinModalCustom}
      closable
      footer={
        <div className="w-full">
          <Button
            loading={loading}
            block={isMD}
            type="primary"
            className="w-[256px] mx-auto !rounded-lg"
            size="large"
            onClick={handleJoin}
          >
            Join
          </Button>
        </div>
      }
      title="Refer to Earn"
      open={modal.visible}
      onCancel={() => {
        modal.hide();
      }}
      afterClose={() => {
        modal.remove();
      }}
    >
      <p className="text-center text-base font-normal text-neutralTitle">
        {`Invite friends and earn `}
        <span className="text-brandDefault font-semibold">16%</span>
        {` of the points from their staked amount. Click "Join" to calculate your points.`}
      </p>
    </CommonModal>
  );
}

export default NiceModal.create(JoinModal);
