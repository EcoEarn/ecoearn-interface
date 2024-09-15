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
  supportEarlyStake: boolean;
  onStake: (amount: number | string, period: number | string) => Promise<ISendResult>;
  onSuccess?: () => void;
  onClose?: () => void;
  onEarlyStake?: () => void;
}

function ClaimModal({
  amount,
  tokenSymbol,
  decimal = 8,
  poolId,
  onSuccess,
  onClose,
  releasePeriod,
  supportEarlyStake,
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
      onSuccess?.();
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
  }, [onSuccess, poolId]);

  const onclose = useCallback(() => {
    setLoading(false);
    modal.remove();
    onClose?.();
  }, [modal, onClose]);

  return (
    <ConfirmModal
      type={ConfirmModalTypeEnum.Claim}
      visible={modal.visible}
      status={status}
      loading={loading}
      errorTip={errorTip}
      content={{
        amount: divDecimals(amount, decimal).toFixed(2),
        tokenSymbol,
        releasePeriod,
        supportEarlyStake,
      }}
      onClose={onclose}
      afterClose={() => {
        modal.remove();
      }}
      onConfirm={onConfirm}
      transactionId={transactionId}
      onEarlyStake={() => {
        modal.hide();
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
