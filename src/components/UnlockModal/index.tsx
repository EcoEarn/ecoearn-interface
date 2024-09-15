import { useCallback, useState } from 'react';
import { ConfirmModalTypeEnum, TConfirmModalStatus } from 'components/ConfirmModal';
import ConfirmModal from 'components/ConfirmModal';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { tokenUnlock } from 'contract/tokenStaking';
import { singleMessage } from '@portkey/did-ui-react';
import { useRouter } from 'next/navigation';
import { formatTokenSymbol } from 'utils/format';
import { message } from 'antd';

interface IUnlockModalProps {
  amount: string;
  amountFromWallet: string;
  amountFromEarlyStake: string;
  autoClaimAmount: string;
  poolId: string;
  tokenSymbol: string;
  rewardsSymbol: string;
  releasePeriod: string | number;
  supportEarlyStake: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  onEarlyStake?: () => void;
}

function UnlockModal({
  amount,
  amountFromEarlyStake,
  amountFromWallet,
  autoClaimAmount,
  poolId,
  tokenSymbol,
  rewardsSymbol,
  releasePeriod,
  supportEarlyStake,
  onSuccess,
  onClose,
  onEarlyStake,
}: IUnlockModalProps) {
  const modal = useModal();
  const [status, setStatus] = useState<TConfirmModalStatus>('normal');
  const [errorTip, setErrorTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [TransactionId, setTransactionId] = useState('');
  const router = useRouter();

  const onConfirm = useCallback(async () => {
    try {
      if (!poolId) {
        singleMessage.error('missing params poolId');
        return;
      }
      setLoading(true);
      const { TransactionId } = await tokenUnlock(poolId);
      if (TransactionId) {
        setTransactionId(TransactionId);
        setStatus('success');
        onSuccess?.();
      } else {
        throw new Error();
      }
    } catch (error) {
      const { showInModal, errorMessage } = error as any;
      const errorTip = errorMessage?.message;
      console.log('tokenUnlock error', errorTip);
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
      type={ConfirmModalTypeEnum.UnLock}
      visible={modal.visible}
      status={status}
      loading={loading}
      errorTip={errorTip}
      content={{
        amount,
        amountFromEarlyStake,
        autoClaimAmount,
        amountFromWallet,
        tokenSymbol: formatTokenSymbol(tokenSymbol),
        rewardsSymbol: formatTokenSymbol(rewardsSymbol),
        releasePeriod,
        supportEarlyStake,
      }}
      onClose={onclose}
      afterClose={() => {
        modal.remove();
      }}
      onConfirm={onConfirm}
      transactionId={TransactionId}
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

export default NiceModal.create(UnlockModal);
