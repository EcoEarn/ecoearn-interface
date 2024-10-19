import StakeModal from 'components/StakeModal';
import { ReactNode, useCallback, useState } from 'react';
import { PoolType, StakeType } from 'types/stake';
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
import { formatTokenSymbol } from 'utils/format';
import { useRouter } from 'next/navigation';
import useLoading from 'hooks/useLoading';

interface IStakeModalProps {
  type: StakeType;
  isFreezeAmount?: boolean;
  freezeAmount?: string | number;
  customAmountModule?: ReactNode;
  isFreezePeriod?: boolean;
  isStakeRewards?: boolean;
  isAddLiquidityAndStake?: boolean;
  freezePeriod?: number | string;
  earlyAmount?: number | string;
  isEarlyStake?: boolean;
  balanceDec?: string;
  balance?: string;
  poolType?: PoolType;
  modalTitle?: string;
  stakeData: IStakePoolData;
  fetchBalance?: () => Promise<string | undefined>;
  onStake: (
    amount: number | string,
    period: number | string,
    poolId?: number | string,
  ) => Promise<ISendResult | void>;
  onSuccess: () => void;
  onClose?: () => void;
}

type TStakeExtendContent = Partial<IStakeContent> | IExtendedLockupContent;

function StakeModalWithConfirm({
  type,
  stakeData,
  isFreezeAmount,
  freezeAmount,
  customAmountModule,
  isFreezePeriod,
  isStakeRewards,
  isAddLiquidityAndStake,
  freezePeriod,
  earlyAmount,
  isEarlyStake,
  balanceDec,
  modalTitle,
  poolType,
  fetchBalance,
  onStake,
  onSuccess,
  onClose,
  balance,
}: IStakeModalProps) {
  const modal = useModal();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<TConfirmModalStatus>('normal');
  const [errorTip, setErrorTip] = useState('');
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
  const { stakeSymbol, staked, unlockTime = '', decimal = 8, poolId } = stakeData || {};
  const router = useRouter();
  const { showLoading, closeLoading } = useLoading();

  const getNewUnlockTimeStamp = useCallback(
    (period: string) =>
      dayjs(BigNumber(unlockTime || 0).isZero() ? undefined : unlockTime)
        .add(+period, 'days')
        .valueOf(),
    [unlockTime],
  );

  const onclose = useCallback(() => {
    modal.remove();
  }, [modal]);

  const onConfirm = useCallback(
    async (content: TConfirmModalContentType) => {
      try {
        setLoading(true);
        // showLoading();
        const { amount, period } = content as TStakeExtendContent;
        const res = await onStake(amount || '', period || '', poolId);
        if (res?.TransactionId) {
          onSuccess?.();
          setVisible(false);
          modal.hide();
          router.push(`/tx/${res?.TransactionId}`);
        } else {
          throw Error();
        }
      } catch (error) {
        const errorTip = (error as Error).message;
        console.error('===stake error', errorTip);
      } finally {
        setLoading(false);
        // closeLoading();
      }
    },
    [modal, onStake, onSuccess, poolId, router],
  );

  const setConfirmContent = useCallback(
    (amount: string, period: string) => {
      console.log('stake--type', type, amount);
      const _staked = divDecimals(staked, decimal).toFixed();
      let content;
      if (type === StakeType.EXTEND) {
        content = {
          amount,
          period,
          days: period,
          oldDateTimeStamp: unlockTime,
          newDateTimeStamp: getNewUnlockTimeStamp(period),
        };
      } else if (type === StakeType.STAKE || type === StakeType.RENEW) {
        const seconds = dayjs.duration(Number(period), 'day').asSeconds();
        console.log(
          'unlockDateTimeStamp',
          dayjs().add(seconds, 'second').valueOf(),
          +period,
          seconds,
        );
        content = {
          amount,
          period,
          unlockDateTimeStamp: dayjs().add(seconds, 'second').valueOf(),
          tokenSymbol: stakeSymbol ? formatTokenSymbol(stakeSymbol) : '--',
        };
      } else {
        content = {
          amount,
          period,
          oldAmount: earlyAmount ? divDecimals(earlyAmount, decimal || 8).toNumber() : _staked,
          unlockDateTimeStamp: period ? undefined : unlockTime,
          oldDateTimeStamp: period ? unlockTime : undefined,
          newDateTimeStamp: period ? getNewUnlockTimeStamp(period) : undefined,
          tokenSymbol: stakeSymbol ? formatTokenSymbol(stakeSymbol) : '--',
        };
      }
      onConfirm(content);
    },
    [decimal, earlyAmount, getNewUnlockTimeStamp, onConfirm, stakeSymbol, staked, type, unlockTime],
  );

  const onStakeModalConfirm = useCallback(
    (amount: string, period: string) => {
      console.log('onStakeModalConfirm', amount, period);
      setConfirmType(
        type === StakeType.EXTEND
          ? ConfirmModalTypeEnum.ExtendedLockup
          : ConfirmModalTypeEnum.Stake,
      );
      setStatus('normal');
      setConfirmContent(amount, period);
    },
    [setConfirmContent, type],
  );

  const onConfirmClose = useCallback(() => {
    setLoading(false);
    setVisible(false);
    if (status === 'success') {
      modal.remove();
      onClose?.();
    }
  }, [modal, onClose, status]);

  return (
    <>
      <StakeModal
        visible={modal.visible}
        isFreezeAmount={isFreezeAmount}
        isFreezePeriod={isFreezePeriod}
        freezePeriod={freezePeriod}
        freezeAmount={freezeAmount}
        isStakeRewards={isStakeRewards}
        isAddLiquidityAndStake={isAddLiquidityAndStake}
        customAmountModule={customAmountModule}
        poolType={poolType}
        modalTitle={modalTitle}
        earlyAmount={earlyAmount}
        isEarlyStake={isEarlyStake}
        balanceDec={balanceDec}
        type={type}
        balance={balance}
        onClose={onclose}
        fetchBalance={fetchBalance}
        onConfirm={onStakeModalConfirm}
        stakeData={stakeData}
        loading={loading}
      />
      <ConfirmModal
        type={confirmType}
        visible={visible}
        status={status}
        loading={loading}
        content={content}
        errorTip={errorTip}
        transactionId={transactionId}
        onClose={onConfirmClose}
        onConfirm={onConfirm}
        onGoRewards={() => {
          setVisible(false);
          router.push('/rewards');
        }}
      />
    </>
  );
}

export default NiceModal.create(StakeModalWithConfirm);
