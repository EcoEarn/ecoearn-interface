import { useCallback, useState } from 'react';
import { ConfirmModalTypeEnum, TConfirmModalStatus } from 'components/ConfirmModal';
import ConfirmModal from 'components/ConfirmModal';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { ISendResult } from 'types';
import { tokenClaim } from 'contract/tokenStaking';
import { divDecimals } from 'utils/calculate';

interface IClaimModalProps {
  amount: string | number;
  tokenSymbol: string;
  decimal: number;
  stakeId: string;
  onStake: (amount: number | string, period: number | string) => Promise<ISendResult>;
  onSuccess?: () => void;
}

function ClaimModal({ amount, tokenSymbol, decimal = 8, stakeId, onSuccess }: IClaimModalProps) {
  const modal = useModal();
  const [status, setStatus] = useState<TConfirmModalStatus>('normal');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const onConfirm = useCallback(async () => {
    try {
      setLoading(true);
      const { TransactionId } = await tokenClaim(stakeId);
      setTransactionId(TransactionId);
      setStatus('success');
    } catch (error) {
      console.log('===claim error', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, [stakeId]);

  const onClose = useCallback(() => {
    setLoading(false);
    modal.remove();
    onSuccess?.();
  }, [modal, onSuccess]);

  return (
    <ConfirmModal
      type={ConfirmModalTypeEnum.Claim}
      visible={modal.visible}
      status={status}
      loading={loading}
      content={{ amount: divDecimals(amount, decimal).toFixed(2), tokenSymbol }}
      onClose={onClose}
      onConfirm={onConfirm}
      transactionId={transactionId}
    />
  );
}

export default NiceModal.create(ClaimModal);
