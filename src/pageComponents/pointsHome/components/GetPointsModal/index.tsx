import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Button } from 'aelf-design';
import CommonModal from 'components/CommonModal';
import useResponsive from 'utils/useResponsive';

export interface IPointsModalProps {
  icon: string;
  name: string;
  desc: string;
  rulesContent?: string;
  handleConfirm?: () => void;
  confirmText?: string;
}

function GetPointsModal({
  icon,
  name,
  desc,
  rulesContent,
  confirmText = 'Gain points',
  handleConfirm,
}: IPointsModalProps) {
  const modal = useModal();
  const { isLG } = useResponsive();
  return (
    <CommonModal
      title="How do I earn points?"
      open={modal.visible}
      onCancel={modal.hide}
      footer={
        <div className="pt-6 w-full">
          <Button
            type="primary"
            block={isLG}
            className="!rounded-lg !min-w-[164px] !mx-auto"
            onClick={() => {
              handleConfirm?.();
            }}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex gap-x-4">
        {!icon ? null : (
          <img className="w-12 h-12 rounded-md" width={48} height={48} alt="logo" src={icon} />
        )}
        <div className="flex flex-col justify-center">
          <span className="text-neutralPrimary font-semibold text-xl ">{name}</span>
          <span className="text-neutralSecondary text-xs">{desc}</span>
        </div>
      </div>
      <div className="text-neutralPrimary font-semibold py-4 text-lg">Points Rules</div>
      {rulesContent && (
        <div className="text-base break-all text-neutralPrimary font-normal">{rulesContent}</div>
      )}
    </CommonModal>
  );
}

export default NiceModal.create(GetPointsModal);
