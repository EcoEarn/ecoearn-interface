import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Button } from 'aelf-design';
import clsx from 'clsx';
import CommonModal from 'components/CommonModal';

const text = [
  {
    textWord:
      'To enhance user capital efficiency, after the funds in the "locked staking" reach maturity, there will be a certain duration of the "unlocking period." During the unlocking period, users can perform the following actions:',
    childTextNodes: [
      {
        textWord:
          'Unlock: By unlocking assets and rewards, you will immediately receive all staked assets and unclaimed rewards (with a locking period);',
        childTextNodes: [],
      },
      {
        textWord: 'Renew: By renewing the staking, you can restake the currently locked assets;',
        childTextNodes: [],
      },
    ],
  },
  {
    textWord:
      'If you do not perform any action on the pool during the unlocking period, the pool will enter a new round of the locking period. The new locking duration will be the same as the most recent locking period, and it will have the same mining rate.',
    childTextNodes: [],
  },
];

export default NiceModal.create(function RenewalModal({
  renewText,
}: {
  renewText: Array<IRenewText>;
}) {
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
      <div className="flex flex-col gap-6 text-base font-normal text-neutralPrimary">
        <p>
          To optimize the use of user funds, staked assets will enter a new lock-up period after
          maturity. During the unlock period, users have the following options:
        </p>
        <p>
          1. <span className="text-[#434343] font-bold">Unstake</span>: Your assets and rewards will
          be unstaked, and you will immediately receive all staked assets and any unclaimed rewards
          (by the end of the freeze period).
        </p>
        <p>
          2. <span className="text-[#434343] font-bold">Renew</span>: You can renew the currently
          unlocked assets, extending the lock-up period.
        </p>
        <p>
          If no action is taken during the unlock period, the assets will automatically be renewed
          into a new lock-up period, which will have the same duration and APR as the previous one.
        </p>
      </div>
    </CommonModal>
  );
});
