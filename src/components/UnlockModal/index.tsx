import { useCallback, useState } from 'react';
import { ConfirmModalTypeEnum, TConfirmModalStatus } from 'components/ConfirmModal';
import ConfirmModal from 'components/ConfirmModal';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { tokenClaim, tokenUnlock } from 'contract/tokenStaking';
import { singleMessage } from '@portkey/did-ui-react';
import { IEarlyStakeProps } from 'hooks/useEarlyStake';
import { useRouter } from 'next/navigation';
import { formatTokenSymbol } from 'utils/format';

interface IUnlockModalProps {
  amount: string;
  amountFromWallet: string;
  amountFromEarlyStake: string;
  autoClaimAmount: string;
  poolId: string;
  tokenSymbol: string;
  rewardsSymbol: string;
  releasePeriod: string | number;
  onSuccess?: () => void;
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
  onSuccess,
  onEarlyStake,
}: IUnlockModalProps) {
  const modal = useModal();
  const [status, setStatus] = useState<TConfirmModalStatus>('normal');
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
      } else {
        throw new Error('TransactionId empty');
      }
    } catch (error) {
      console.log('tokenUnlock error', error);
      setStatus('error');
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
      type={ConfirmModalTypeEnum.UnLock}
      visible={modal.visible}
      status={status}
      loading={loading}
      content={{
        amount,
        amountFromEarlyStake,
        autoClaimAmount,
        amountFromWallet,
        tokenSymbol: formatTokenSymbol(tokenSymbol),
        rewardsSymbol: formatTokenSymbol(rewardsSymbol),
        releasePeriod,
      }}
      onClose={onClose}
      afterClose={() => {
        modal.remove();
      }}
      onConfirm={onConfirm}
      transactionId={TransactionId}
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

export default NiceModal.create(UnlockModal);
