import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Button } from 'aelf-design';
import CommonModal from 'components/CommonModal';

export default NiceModal.create(function RenewalModal() {
  const modal = useModal();
  return (
    <CommonModal
      footer={
        <Button
          type="primary"
          className="!min-w-[164px] !rounded-lg"
          onClick={() => {
            modal.hide();
          }}
        >
          Got it
        </Button>
      }
      title="Automatic renewal"
      open={modal.visible}
      onCancel={() => {
        modal.remove();
      }}
    >
      <div className="text-base font-normal text-neutralPrimary">
        <p>
          {` To enhance user capital efficiency, after the funds in the "locked staking" reach
          maturity, there will be a certain duration of the "unlocking period." During the unlocking
          period, users can perform the following actions:`}
        </p>
        <p>
          · Unlock: By unlocking assets and rewards, you will immediately receive all staked assets
          and unclaimed rewards (with a locking period);
        </p>
        <p>· Renew: By renewing the staking, you can restake the currently locked assets;</p>
        <p className="mt-4">
          If you do not perform any action on the pool during the unlocking period, the pool will
          enter a new round of the locking period. The new locking duration will be the same as the
          most recent locking period, and it will have the same mining rate.
        </p>
      </div>
    </CommonModal>
  );
});
