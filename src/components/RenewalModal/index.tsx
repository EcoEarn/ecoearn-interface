import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Button } from 'aelf-design';
import clsx from 'clsx';
import CommonModal from 'components/CommonModal';

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
      <div className="text-base font-normal text-neutralPrimary">
        {renewText.map((item, index) => {
          return (
            <div key={index} className={clsx(index !== 0 && 'mt-4')}>
              <p>{item.textWord}</p>
              {item.childTextNodes.map((childTextItem, index) => {
                return <p key={index}>{childTextItem.textWord}</p>;
              })}
            </div>
          );
        })}
      </div>
    </CommonModal>
  );
});
