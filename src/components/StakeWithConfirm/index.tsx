import Stake from 'components/Stake';
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
import { ISendResult } from 'types';
import BigNumber from 'bignumber.js';
import { divDecimals } from 'utils/calculate';
import { formatTokenSymbol } from 'utils/format';
import { useRouter } from 'next/navigation';

export interface IStakeWithConfirmProps {
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
  onClose?: (isSuccess?: boolean) => void;
}

type TStakeExtendContent = Partial<IStakeContent> | IExtendedLockupContent;

export default function StakeWithConfirm({
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
  balance,
  onClose,
}: IStakeWithConfirmProps) {
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

  const getNewUnlockTimeStamp = useCallback(
    (period: string) =>
      dayjs(BigNumber(unlockTime || 0).isZero() ? undefined : unlockTime)
        .add(+period, 'days')
        .valueOf(),
    [unlockTime],
  );

  const setConfirmContent = useCallback(
    (amount: string, period: string) => {
      console.log('stake--type', type, amount);
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

      if (type === StakeType.STAKE || type === StakeType.RENEW) {
        const seconds = dayjs.duration(Number(period), 'day').asSeconds();
        console.log(
          'unlockDateTimeStamp',
          dayjs().add(seconds, 'second').valueOf(),
          +period,
          seconds,
        );
        setContent({
          amount,
          period,
          unlockDateTimeStamp: dayjs().add(seconds, 'second').valueOf(),
          tokenSymbol: stakeSymbol ? formatTokenSymbol(stakeSymbol) : '--',
        });
        return;
      }

      setContent({
        amount,
        period,
        oldAmount: earlyAmount ? divDecimals(earlyAmount, decimal || 8).toNumber() : _staked,
        unlockDateTimeStamp: period ? undefined : unlockTime,
        oldDateTimeStamp: period ? unlockTime : undefined,
        newDateTimeStamp: period ? getNewUnlockTimeStamp(period) : undefined,
        tokenSymbol: stakeSymbol ? formatTokenSymbol(stakeSymbol) : '--',
      });
      return;
    },
    [decimal, earlyAmount, getNewUnlockTimeStamp, stakeSymbol, staked, type, unlockTime],
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
      setVisible(true);
    },
    [setConfirmContent, type],
  );

  const onConfirm = useCallback(
    async (content: TConfirmModalContentType) => {
      try {
        setLoading(true);
        const { amount, period } = content as TStakeExtendContent;
        const res = await onStake(amount || '', period || '', poolId);
        if (res?.TransactionId) {
          setStatus('success');
          setTransactionId(res?.TransactionId);
          onSuccess?.();
        } else {
          throw Error();
        }
      } catch (error) {
        const errorTip = (error as Error).message;
        console.error('===stake error', errorTip);
        errorTip && setErrorTip(errorTip);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    },
    [onStake, onSuccess, poolId],
  );

  const onConfirmClose = useCallback(() => {
    setLoading(false);
    setVisible(false);
    onClose?.(status === 'success');
  }, [onClose, status]);

  return (
    <div>
      <Stake
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
        fetchBalance={fetchBalance}
        onConfirm={onStakeModalConfirm}
        stakeData={stakeData}
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
    </div>
  );
}
