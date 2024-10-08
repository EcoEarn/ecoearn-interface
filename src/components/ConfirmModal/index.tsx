import { Button } from 'aelf-design';
import { Flex } from 'antd';
import CommonModal from 'components/CommonModal';
import dayjs from 'dayjs';
import { useCallback, useMemo } from 'react';
import { formatTokenPrice, formatTokenSymbol } from 'utils/format';
import useResponsive from 'utils/useResponsive';
import { ReactComponent as SuccessIcon } from 'assets/img/result-success-icon.svg';
import { ReactComponent as ErrorIcon } from 'assets/img/result-error-icon.svg';
import { ExportOutlined } from '@ant-design/icons';
import BigNumber from 'bignumber.js';
import { DEFAULT_DATE_FORMAT, ZERO } from 'constants/index';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import styles from './style.module.css';

export enum ConfirmModalTypeEnum {
  Claim = 'claim',
  WithDraw = 'withdraw',
  Stake = 'stake',
  UnLock = 'unLock',
  ExtendedLockup = 'extendedLockup',
}

export type TConfirmModalStatus = 'normal' | 'success' | 'error';

export interface IClaimContent {
  amount?: number | string;
  tokenSymbol?: string;
  releasePeriod?: number | string;
  vestingPeriod?: number | string;
  supportEarlyStake?: boolean;
}

export interface IWithDrawContent extends IClaimContent {
  [key: string]: any;
}

export interface IExtendedLockupContent {
  days?: number | string;
  oldDateTimeStamp?: string | number;
  newDateTimeStamp?: string | number;
  amount?: number | string;
  period?: number | string;
}
export interface IStakeContent {
  oldAmount?: number | string;
  amount?: number | string;
  period?: number | string;
  unlockDateTimeStamp?: string | number;
  oldDateTimeStamp?: string | number;
  newDateTimeStamp?: string | number;
  tokenSymbol?: string;
}

export interface IUnLockContent {
  amount?: string | number;
  amountFromEarlyStake?: string;
  amountFromWallet?: string;
  autoClaimAmount?: string;
  tokenSymbol?: string;
  rewardsSymbol?: string;
  releasePeriod?: number | string;
  vestingPeriod?: number | string;
  supportEarlyStake?: boolean;
}

export type TConfirmModalContentType = IExtendedLockupContent &
  IUnLockContent &
  IStakeContent &
  IClaimContent &
  IExtendedLockupContent &
  IWithDrawContent;

export interface IConfirmModalProps {
  type?: ConfirmModalTypeEnum;
  onConfirm?: (content: TConfirmModalContentType) => void;
  loading?: boolean;
  content?: TConfirmModalContentType;
  status: TConfirmModalStatus;
  onClose?: () => void;
  afterClose?: () => void;
  transactionId?: string;
  errorTip?: string;
  visible: boolean;
  onEarlyStake?: () => void;
  onGoRewards?: () => void;
}

function ConfirmModal(props: IConfirmModalProps) {
  const {
    content,
    onConfirm,
    loading,
    type,
    status,
    onClose,
    afterClose,
    transactionId,
    errorTip,
    visible,
    onEarlyStake,
    onGoRewards,
  } = props;
  const { isLG, isXS } = useResponsive();
  const { explorerUrl } = useGetCmsInfo() || {};
  const router = useRouter();

  const withDrawPeriod = useMemo(() => {
    const withDrawPeriodDays = BigNumber(
      dayjs.duration(Number(content?.releasePeriod || 0), 'second').asDays(),
    )
      .dp(2)
      .toNumber();
    return `${withDrawPeriodDays}-${withDrawPeriodDays > 1 ? 'days' : 'day'}`;
  }, [content?.releasePeriod]);

  const renderTitle = useMemo(() => {
    if (status !== 'normal') {
      return undefined;
    }
    if (type === ConfirmModalTypeEnum.Claim) {
      return 'Claim';
    } else if (type === ConfirmModalTypeEnum.Stake) {
      if (BigNumber(content?.oldAmount || 0).gt(ZERO)) {
        return 'Add';
      } else {
        return 'Stake';
      }
    } else if (type === ConfirmModalTypeEnum.ExtendedLockup) {
      return 'Extended lock-up';
    } else if (type === ConfirmModalTypeEnum.UnLock) {
      if (BigNumber(content?.autoClaimAmount || 0).gt(ZERO)) {
        return 'Unstake and Claim';
      } else {
        return 'Unstake';
      }
    } else if (type === ConfirmModalTypeEnum.WithDraw) {
      return 'Withdraw';
    }
  }, [content, status, type]);

  const renderResult = useMemo(() => {
    return (
      <Flex vertical gap={16} className="text-center" align="center">
        {status === 'success' ? <SuccessIcon /> : <ErrorIcon />}
        <div className="text-xl lg:text-2xl font-semibold text-neutralTitle mt-4">
          {status === 'success'
            ? 'Transaction sent, waiting for on-chain confirmation'
            : 'Transaction confirmation failed.'}
        </div>
        {(status === 'success' || (status === 'error' && errorTip)) && (
          <div
            className={clsx(
              'text-base font-normal lg:text-lg lg:font-medium text-neutralSecondary',
              status === 'error' && 'mt-4',
            )}
          >
            {status === 'error'
              ? errorTip
              : 'On-chain transaction is being packaged. There may be delays in data updates.'}
          </div>
        )}
      </Flex>
    );
  }, [errorTip, status]);

  const afterClaimAction = useMemo(() => {
    return (
      <Flex justify="center" gap={12} vertical={isXS}>
        <Button
          className="!rounded-lg !min-w-[200px]"
          onClick={() => {
            onGoRewards?.();
          }}
        >
          {`Go to "Rewards"`}
        </Button>
        {content?.supportEarlyStake && (
          <Button
            className="!rounded-lg !min-w-[200px]"
            type="primary"
            onClick={() => {
              onEarlyStake?.();
            }}
          >
            Stake Rewards
          </Button>
        )}
      </Flex>
    );
  }, [content?.supportEarlyStake, isXS, onEarlyStake, onGoRewards]);

  const renderContent = useMemo(() => {
    if (status !== 'normal') {
      return renderResult;
    }
    if (!content) return null;
    if (type === ConfirmModalTypeEnum.Claim) {
      return (
        <Flex className="text-center" gap={16} vertical>
          <div className="text-xl font-medium text-neutralTitle">You will claim </div>
          <div className="text-4xl font-semibold text-neutralPrimary">
            {`${formatTokenPrice(content?.amount || 0)} ${formatTokenSymbol(
              content?.tokenSymbol || '',
            )}`}
          </div>
          <div className="text-sm font-normal text-neutralSecondary mt-4">
            <span>{`The rewards you claim have a `}</span>
            <span className="font-medium text-neutralTitle">{withDrawPeriod}</span>
            <span>
              {` release period. After claiming, the rewards will appear on the "Rewards" page.`}
            </span>
          </div>
        </Flex>
      );
    } else if (type === ConfirmModalTypeEnum.WithDraw) {
      return (
        <Flex className="text-center" gap={16} vertical>
          <div className="text-xl font-medium text-neutralTitle">You will withdraw</div>
          <div className="text-4xl font-semibold text-neutralPrimary">
            {`${formatTokenPrice(content?.amount || 0)} ${formatTokenSymbol(
              content?.tokenSymbol || '',
            )}`}
          </div>
        </Flex>
      );
    } else if (type === ConfirmModalTypeEnum.Stake) {
      return (
        <Flex className="text-center" gap={16} vertical>
          <div className="text-xl font-medium text-neutralTitle">{`You will ${
            BigNumber(content?.oldAmount || 0).gt(ZERO) ? 'add staking for' : 'stake'
          }`}</div>
          <div className="text-4xl font-semibold text-neutralPrimary">
            {`${formatTokenPrice(content?.amount || 0)} ${formatTokenSymbol(
              content?.tokenSymbol || '',
            )}`}
          </div>
          <Flex
            vertical
            className="w-full gap-4 mt-10 py-4 px-6 rounded-lg bg-brandBg text-sm font-normal"
          >
            {BigNumber(content?.oldAmount || 0).gt(ZERO) && (
              <Flex justify="space-between">
                <span className="text-neutralSecondary">Staking amount</span>
                <span className="text-neutralPrimary font-medium">
                  <span>{formatTokenPrice(content?.oldAmount || 0)}</span>
                  <span>{' -> '}</span>
                  <span className="text-brandDefault">
                    {formatTokenPrice(
                      BigNumber(content?.amount || 0).plus(BigNumber(content?.oldAmount || 0)),
                    )}
                  </span>
                </span>
              </Flex>
            )}
            {content?.unlockDateTimeStamp ? (
              <Flex justify="space-between">
                <span className="text-neutralSecondary">Unlock on</span>
                <span>
                  {dayjs(Number(content?.unlockDateTimeStamp)).format(DEFAULT_DATE_FORMAT)}
                </span>
              </Flex>
            ) : (
              <Flex vertical className="w-full gap-4">
                <Flex justify="space-between">
                  <span className="text-neutralSecondary">{`Unlock on (current)`}</span>
                  <span>
                    {dayjs(Number(content?.oldDateTimeStamp)).format(DEFAULT_DATE_FORMAT)}
                  </span>
                </Flex>
                <Flex justify="space-between">
                  <span className="text-neutralSecondary">{`Unlock on (new)`}</span>
                  <span className="text-brandDefault">
                    {dayjs(Number(content?.newDateTimeStamp)).format(DEFAULT_DATE_FORMAT)}
                  </span>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>
      );
    } else if (type === ConfirmModalTypeEnum.ExtendedLockup) {
      return (
        <Flex className="text-center" gap={16} vertical>
          <div className="text-xl font-medium text-neutralTitle">
            You will extend the lockup period by {content?.days || 0} days
          </div>
          <Flex
            vertical
            className="w-full gap-4 mt-10 rounded-lg bg-brandBg px-6 py-4 text-sm font-normal"
          >
            <Flex justify="space-between">
              <span className="text-neutralSecondary">Unlock on (current)</span>
              <span className="text-neutralPrimary">
                {dayjs(Number(content?.oldDateTimeStamp)).format(DEFAULT_DATE_FORMAT)}
              </span>
            </Flex>
            <Flex justify="space-between">
              <span className="text-neutralSecondary">Unlock on (new)</span>
              <span className="text-neutralPrimary">
                {dayjs(Number(content?.newDateTimeStamp)).format(DEFAULT_DATE_FORMAT)}
              </span>
            </Flex>
          </Flex>
        </Flex>
      );
    } else if (type === ConfirmModalTypeEnum.UnLock) {
      return (
        <Flex className="text-center" gap={16} vertical>
          <div className="text-xl font-medium text-neutralTitle">You will unstake</div>
          <div className="text-4xl font-semibold text-neutralPrimary">
            {formatTokenPrice(BigNumber(content?.amount || 0))}{' '}
            {formatTokenSymbol(content?.tokenSymbol || '')}
          </div>
          {BigNumber(content?.amountFromWallet || 0).gt(ZERO) &&
            BigNumber(content?.amountFromEarlyStake || 0).gt(ZERO) && (
              <>
                <div className="text-sm font-normal text-neutralPrimary">
                  Unlock principal {formatTokenPrice(content?.amountFromWallet || 0)}{' '}
                  {formatTokenSymbol(content?.tokenSymbol || '')} and reward{' '}
                  {formatTokenPrice(content?.amountFromEarlyStake || 0)}{' '}
                  {formatTokenSymbol(content?.rewardsSymbol || '')}
                </div>
              </>
            )}
          {BigNumber(content?.amountFromEarlyStake || 0).gt(ZERO) && (
            <div className="text-sm font-normal mt-4 text-neutralSecondary">
              {BigNumber(content?.amountFromWallet || 0).gt(ZERO)
                ? `The unlocked amount includes the ${formatTokenSymbol(
                    content?.tokenSymbol || '',
                  )} rewards you staked early,
               which will not be withdrawn to the wallet and will appear on the "Rewards" page after
               unlocking.`
                : `The unlocked amount is your staked ${formatTokenSymbol(
                    content?.tokenSymbol || '',
                  )} rewards,
               which will not be withdrawn to the wallet and will appear on the "Rewards" page after
               unlocking.`}
            </div>
          )}
        </Flex>
      );
    }
  }, [content, renderResult, status, type, withDrawPeriod]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  console.log('amountFromEarlyStake', content?.amountFromEarlyStake);

  const handleConfirm = useCallback(() => {
    if (status === 'normal') {
      onConfirm?.(content || {});
    } else {
      handleClose();
    }
  }, [content, handleClose, onConfirm, status]);

  const renderConfirmBtnText = useMemo(() => {
    if (status !== 'normal') {
      return 'Close';
    }
    if (loading) {
      return 'Signing';
    } else {
      return 'Confirm';
    }
  }, [loading, status]);

  const renderFooter = useMemo(() => {
    return (
      <div className="flex flex-col text-center w-full">
        {status === 'success' &&
        (type === ConfirmModalTypeEnum.Claim ||
          (type === ConfirmModalTypeEnum.UnLock &&
            !BigNumber(content?.autoClaimAmount || 0).isZero())) ? (
          afterClaimAction
        ) : (
          <div className="lg:px-8 mx-auto w-full flex justify-center">
            <Button
              type="primary"
              className="!rounded-lg !min-w-[200px]"
              block={isLG}
              onClick={handleConfirm}
              loading={loading}
            >
              {renderConfirmBtnText}
            </Button>
          </div>
        )}
        {status === 'normal' &&
          type === ConfirmModalTypeEnum.UnLock &&
          BigNumber(content?.autoClaimAmount || 0).gt(ZERO) && (
            <Flex
              className="mt-6  text-xs font-normal text-neutralSecondary rounded-lg bg-brandBg p-4 mx-0 lg:mx-4"
              gap={8}
              vertical
            >
              <span>
                <span> When unstaking, </span>
                <span className="font-medium text-neutralTitle">
                  {formatTokenPrice(content?.autoClaimAmount || 0)}{' '}
                  {formatTokenSymbol(content?.rewardsSymbol || '')}
                </span>
                <span> staking rewards will be automatically claimed.</span>
              </span>
              <span>
                <span>{`The rewards you claim have a `}</span>
                <span className="font-medium text-neutralTitle">{withDrawPeriod}</span>
                <span>{` release period. After claiming, the rewards will appear on the "Rewards" page.`}</span>
              </span>
            </Flex>
          )}
        {status === 'success' && transactionId && (
          <Button
            className="!w-fit !mx-auto !text-neutralSecondary !text-base !font-normal mt-2  hover:!text-[var(--neutral-secondary)] active:!text-[var(--neutral-secondary)] !p-0 !h-fit"
            type="link"
            size="small"
            onClick={() => {
              window.open(`${explorerUrl}/tx/${transactionId}`, '_blank');
            }}
          >
            <span>View on Explorer</span>
            <ExportOutlined />
          </Button>
        )}
      </div>
    );
  }, [
    afterClaimAction,
    content?.autoClaimAmount,
    content?.rewardsSymbol,
    explorerUrl,
    handleConfirm,
    isLG,
    loading,
    renderConfirmBtnText,
    status,
    transactionId,
    type,
    withDrawPeriod,
  ]);

  return (
    <CommonModal
      // closable={status === 'normal'}
      destroyOnClose
      open={visible}
      onCancel={handleClose}
      afterClose={afterClose}
      title={renderTitle}
      className={clsx(!renderTitle && styles['modal-no-title'])}
      footer={renderFooter}
      disableMobileLayout
    >
      {renderContent}
    </CommonModal>
  );
}

export default ConfirmModal;
