import { Button } from 'aelf-design';
import { Flex } from 'antd';
import CommonModal from 'components/CommonModal';
import dayjs from 'dayjs';
import { useCallback, useMemo } from 'react';
import { formatTokenPrice } from 'utils/format';
import useResponsive from 'utils/useResponsive';
import { ReactComponent as SuccessIcon } from 'assets/img/result-success-icon.svg';
import { ReactComponent as ErrorIcon } from 'assets/img/result-error-icon.svg';
import { ExportOutlined } from '@ant-design/icons';
import BigNumber from 'bignumber.js';
import { ZERO } from 'constants/index';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';

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
  amountFromStake?: string;
  amountFromWallet?: string;
  autoClaimAmount?: string;
  tokenSymbol?: string;
  rewardsSymbol?: string;
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
  loading: boolean;
  content?: TConfirmModalContentType;
  status: TConfirmModalStatus;
  onClose: () => void;
  transactionId?: string;
  visible: boolean;
}

function ConfirmModal(props: IConfirmModalProps) {
  const { content, onConfirm, loading, type, status, onClose, transactionId, visible } = props;
  const { isLG } = useResponsive();
  const { explorerUrl } = useGetCmsInfo() || {};

  const renderTitle = useMemo(() => {
    if (status === 'success') {
      return 'Transaction Sent';
    } else if (status === 'error') {
      return 'Failure to confirm a transaction';
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
        return 'Unlock and Claim';
      } else {
        return 'Unlock';
      }
    } else if (type === ConfirmModalTypeEnum.WithDraw) {
      return 'Withdraw';
    }
  }, [content, status, type]);

  const renderResult = useMemo(() => {
    return (
      <Flex vertical gap={8} className="text-center" align="center">
        {status === 'success' ? <SuccessIcon /> : <ErrorIcon />}
        <div className="text-xl font-medium text-neutralPrimary mt-6">
          {status === 'success'
            ? 'Transaction sent, waiting for on-chain confirmation'
            : 'Transaction confirmation failed'}
        </div>
        {status === 'success' && (
          <div className="text-sm font-normal text-neutralSecondary mt-6">
            On-chain transaction is being packaged. There may be delays in data updates
          </div>
        )}
      </Flex>
    );
  }, [status]);

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
            {`${formatTokenPrice(content?.amount || 0, { decimalPlaces: 2 })} ${
              content?.tokenSymbol
            }`}
          </div>
          <div className="text-sm font-normal text-neutralSecondary mt-4">
            <span>{`Your claimed rewards will be available for withdrawal after `}</span>
            <span className="font-medium text-neutralTitle">24h</span>
            <span> {` , appearing on the "Rewards" page.`}</span>
          </div>
        </Flex>
      );
    } else if (type === ConfirmModalTypeEnum.WithDraw) {
      return (
        <Flex className="text-center" gap={16} vertical>
          <div className="text-xl font-medium text-neutralTitle">You will withdraw</div>
          <div className="text-4xl font-semibold text-neutralPrimary">
            {`${formatTokenPrice(content?.amount || 0, { decimalPlaces: 2 })} ${
              content?.tokenSymbol
            }`}
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
            {`${formatTokenPrice(content?.amount || 0, { decimalPlaces: 2 })} ${
              content?.tokenSymbol
            }`}
          </div>
          <Flex
            vertical
            className="w-full gap-4 mt-10 py-4 px-6 rounded-lg bg-brandBg text-sm font-normal"
          >
            {BigNumber(content?.oldAmount || 0).gt(ZERO) && (
              <Flex justify="space-between">
                <span className="text-neutralSecondary">Staking amount</span>
                <span className="text-neutralPrimary font-medium">
                  <span>
                    {formatTokenPrice(content?.oldAmount || 0, {
                      decimalPlaces: 2,
                    })}
                  </span>
                  <span>{' -> '}</span>
                  <span className="text-brandDefault">
                    {formatTokenPrice(
                      BigNumber(content?.amount || 0).plus(BigNumber(content?.oldAmount || 0)),
                      {
                        decimalPlaces: 2,
                      },
                    )}
                  </span>
                </span>
              </Flex>
            )}
            {content?.unlockDateTimeStamp ? (
              <Flex justify="space-between">
                <span>Unlock on</span>
                <span>
                  {dayjs(Number(content?.unlockDateTimeStamp)).format('YYYY.MM.DD HH:mm')}
                </span>
              </Flex>
            ) : (
              <Flex vertical className="w-full gap-4">
                <Flex justify="space-between">
                  <span>{`Unlock on (current)`}</span>
                  <span>{dayjs(Number(content?.oldDateTimeStamp)).format('YYYY.MM.DD HH:mm')}</span>
                </Flex>
                <Flex justify="space-between">
                  <span>{`Unlock on (new)`}</span>
                  <span>{dayjs(Number(content?.newDateTimeStamp)).format('YYYY.MM.DD HH:mm')}</span>
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
            You will extend the lockup period by {content?.days} days
          </div>
          <Flex
            vertical
            className="w-full gap-4 mt-10 rounded-lg bg-brandBg px-6 py-4 text-sm font-normal"
          >
            <Flex justify="space-between">
              <span className="text-neutralSecondary">Original unlock date</span>
              <span className="text-neutralPrimary">
                {dayjs(Number(content?.oldDateTimeStamp)).format('YYYY.MM.DD HH:mm')}
              </span>
            </Flex>
            <Flex justify="space-between">
              <span className="text-neutralSecondary">New unlock date</span>
              <span className="text-neutralPrimary">
                {dayjs(Number(content?.newDateTimeStamp)).format('YYYY.MM.DD HH:mm')}
              </span>
            </Flex>
          </Flex>
        </Flex>
      );
    } else if (type === ConfirmModalTypeEnum.UnLock) {
      return (
        <Flex className="text-center" gap={16} vertical>
          <div className="text-xl font-medium text-neutralTitle">You will unlock</div>
          <div className="text-4xl font-semibold text-neutralPrimary">
            {formatTokenPrice(
              BigNumber(content?.amountFromStake || 0).plus(
                BigNumber(content?.amountFromWallet || 0),
              ),
              { decimalPlaces: 2 },
            )}{' '}
            {content?.tokenSymbol}
          </div>
          {BigNumber(content?.amountFromWallet || 0).gt(ZERO) &&
            BigNumber(content?.amountFromStake || 0).gt(ZERO) && (
              <>
                <div className="text-sm font-normal text-neutralPrimary">
                  Unlock principal{' '}
                  {formatTokenPrice(content?.amountFromWallet || 0, {
                    decimalPlaces: 2,
                  })}{' '}
                  {content?.tokenSymbol || ''} and reward{' '}
                  {formatTokenPrice(content?.amountFromStake || 0, {
                    decimalPlaces: 2,
                  })}{' '}
                  {content?.rewardsSymbol || ''}
                </div>
              </>
            )}
          {BigNumber(content?.amountFromStake || 0).gt(ZERO) && (
            <div className="text-sm font-normal mt-4 text-neutralSecondary">
              {`The unlocked amount is your staked ${content?.tokenSymbol} rewards,
               which will not be withdrawn to the wallet and will appear on the "Rewards" page after
               unlocking.`}
            </div>
          )}
        </Flex>
      );
    }
  }, [content, renderResult, status, type]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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
        {status === 'normal' &&
          type === ConfirmModalTypeEnum.UnLock &&
          BigNumber(content?.autoClaimAmount || 0).gt(ZERO) && (
            <Flex
              className="mt-6  text-xs font-normal text-neutralSecondary rounded-lg bg-brandBg p-4 mx-0 lg:mx-4"
              gap={8}
              vertical
            >
              <span>
                When unstaking, {content?.autoClaimAmount} {content?.rewardsSymbol} staking rewards
                will be automatically claimed.
              </span>
              <span>
                <span>{`Your claimed rewards will be available for withdrawal after `}</span>
                <span className="font-medium text-neutralTitle">24h</span>
                <span>{` , appearing on "Rewards" page.`}</span>
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
    content,
    explorerUrl,
    handleConfirm,
    isLG,
    loading,
    renderConfirmBtnText,
    status,
    transactionId,
    type,
  ]);

  return (
    <CommonModal
      destroyOnClose
      open={visible}
      onCancel={handleClose}
      width={580}
      title={renderTitle}
      footer={renderFooter}
    >
      {renderContent}
    </CommonModal>
  );
}

export default ConfirmModal;
