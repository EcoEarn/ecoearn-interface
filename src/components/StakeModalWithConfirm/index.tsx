import StackModal from 'components/StakeModal';
import { useCallback, useState } from 'react';
import { StakeType } from 'types/stack';
import {
  ConfirmModalTypeEnum,
  TConfirmModalStatus,
  IStakeContent,
  IExtendedLockupContent,
  TConfirmModalContentType,
} from 'components/ConfirmModal';
import ConfirmModal from 'components/ConfirmModal';
import dayjs from 'dayjs';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { ISendResult } from 'types';
import BigNumber from 'bignumber.js';
import { divDecimals } from 'utils/calculate';

interface IStackModalProps {
  type: StakeType;
  isFreezeAmount?: boolean;
  freezeAmount: string | number;
  isFreezePeriod?: boolean;
  freezePeriod?: number | string;
  earlyAmount?: number | string;
  balance?: string;
  stakeData: IStakePoolData;
  onStake: (amount: number | string, period: number | string) => Promise<ISendResult | void>;
  onSuccess: () => void;
}

type TStakeExtendContent = Partial<IStakeContent> | IExtendedLockupContent;

function StackModalWithConfirm({
  type,
  stakeData,
  isFreezeAmount,
  freezeAmount,
  isFreezePeriod,
  freezePeriod,
  earlyAmount,
  onStake,
  onSuccess,
  balance,
}: IStackModalProps) {
  const modal = useModal();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<TConfirmModalStatus>('normal');
  const [loading, setLoading] = useState(false);
  const [confirmType, setConfirmType] = useState<ConfirmModalTypeEnum>(ConfirmModalTypeEnum.Stake);
  const [content, setContent] = useState<TStakeExtendContent>({
    oldAmount: '',
    amount: '',
    period: '',
    unlockDateTimeStamp: '',
    tokenSymbol: '',
  });
  const [transactionId, setTransactionId] = useState('');
  const { stakeSymbol = '--', staked, unlockTime = '', decimal = 8 } = stakeData;

  const getNewUnlockTimeStamp = useCallback(
    (period: string) =>
      dayjs(BigNumber(unlockTime || 0).isZero() ? undefined : unlockTime)
        .add(+period, 'days')
        .valueOf(),
    [unlockTime],
  );

  const onClose = useCallback(() => {
    modal.remove();
  }, [modal]);

  const setConfirmContent = useCallback(
    (amount: string, period: string) => {
      console.log('stake--type', type);
      const _staked = divDecimals(staked, decimal).toFixed();
      if (type === StakeType.EXTEND) {
        setContent({
          amount,
          period,
          days: period,
          oldDateTimeStamp: unlockTime,
          newDateTimeStamp: getNewUnlockTimeStamp(period),
        });
        return;
      }

      if (type === StakeType.STAKE) {
        console.log('unlockDateTimeStamp', getNewUnlockTimeStamp(period));
        setContent({
          amount,
          period,
          unlockDateTimeStamp: getNewUnlockTimeStamp(period),
          tokenSymbol: stakeSymbol,
        });
        return;
      }

      setContent({
        amount,
        period,
        oldAmount: earlyAmount ? divDecimals(earlyAmount, decimal || 8).toNumber() : _staked,
        unlockDateTimeStamp: period ? '' : unlockTime,
        oldDateTimeStamp: unlockTime,
        newDateTimeStamp: getNewUnlockTimeStamp(period),
        tokenSymbol: stakeSymbol,
        days: type === StakeType.RENEW ? period : undefined,
      });
      return;
    },
    [decimal, earlyAmount, getNewUnlockTimeStamp, stakeSymbol, staked, type, unlockTime],
  );

  const onStakeModalConfirm = useCallback(
    (amount: string, period: string) => {
      console.log('onStakeModalConfirm', amount, period);
      setConfirmType(
        type === StakeType.EXTEND || type === StakeType.RENEW
          ? ConfirmModalTypeEnum.ExtendedLockup
          : ConfirmModalTypeEnum.Stake,
      );
      setStatus('normal');
      setConfirmContent(amount, period);
      setVisible(true);
    },
    [setConfirmContent, type],
  );

  const onConfirm = useCallback(
    async (content: TConfirmModalContentType) => {
      try {
        setLoading(true);
        const { amount, period } = content as TStakeExtendContent;
        const res = await onStake(amount || '', period || '');
        if (res) {
          const { TransactionId } = res;
          setStatus('success');
          setTransactionId(TransactionId);
        }
      } catch (error) {
        console.log('===stake error', error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    },
    [onStake],
  );

  const onConfirmClose = useCallback(() => {
    setLoading(false);
    setVisible(false);
    if (status === 'success') {
      modal.remove();
      onSuccess?.();
    }
  }, [modal, onSuccess, status]);

  return (
    <>
      <StackModal
        visible={modal.visible}
        isFreezeAmount={isFreezeAmount}
        isFreezePeriod={isFreezePeriod}
        freezePeriod={freezePeriod}
        freezeAmount={freezeAmount}
        earlyAmount={earlyAmount}
        type={type}
        balance={balance}
        onClose={onClose}
        onConfirm={onStakeModalConfirm}
        stakeData={stakeData}
      />
      <ConfirmModal
        type={confirmType}
        visible={visible}
        status={status}
        loading={loading}
        content={content}
        transactionId={transactionId}
        onClose={onConfirmClose}
        onConfirm={onConfirm}
      />
    </>
  );
}

export default NiceModal.create(StackModalWithConfirm);
