import { useCallback, useState } from 'react';
import { ConfirmModalTypeEnum, TConfirmModalStatus } from 'components/ConfirmModal';
import ConfirmModal from 'components/ConfirmModal';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { ISendResult } from 'types';
import { tokenClaim } from 'contract/tokenStaking';
import { divDecimals } from 'utils/calculate';
import { useRouter } from 'next/navigation';
import { message } from 'antd';

interface IClaimModalProps {
  amount: string | number;
  releasePeriod: string | number;
  tokenSymbol: string;
  decimal: number;
  poolId: string;
  onStake: (amount: number | string, period: number | string) => Promise<ISendResult>;
  onSuccess?: () => void;
  onEarlyStake?: () => void;
}

function ClaimModal({
  amount,
  tokenSymbol,
  decimal = 8,
  poolId,
  onSuccess,
  releasePeriod,
  onEarlyStake,
}: IClaimModalProps) {
  const modal = useModal();
  const [status, setStatus] = useState<TConfirmModalStatus>('normal');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [errorTip, setErrorTip] = useState('');
  const router = useRouter();

  const onConfirm = useCallback(async () => {
    try {
      setLoading(true);
      const { TransactionId } = await tokenClaim(poolId);
      setTransactionId(TransactionId);
      setStatus('success');
    } catch (error) {
      const { showInModal, errorMessage } = error as any;
      const errorTip = errorMessage?.message;
      console.log('===claim error', errorTip);
      if (!showInModal) message.error(errorTip);
      setStatus('error');
      errorTip && setErrorTip(errorTip);
    } finally {
      setLoading(false);
    }
  }, [poolId]);

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
      errorTip={errorTip}
      content={{ amount: divDecimals(amount, decimal).toFixed(2), tokenSymbol, releasePeriod }}
      onClose={onClose}
      afterClose={() => {
        modal.remove();
      }}
      onConfirm={onConfirm}
      transactionId={transactionId}
      onEarlyStake={() => {
        onEarlyStake?.();
      }}
      onGoRewards={() => {
        modal.hide();
        router.push('/rewards');
      }}
    />
  );
}

export default NiceModal.create(ClaimModal);
