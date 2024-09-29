import { Button } from 'aelf-design';
import { Flex } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { formatTokenPrice, formatTokenSymbol } from 'utils/format';
import useResponsive from 'utils/useResponsive';
import { ReactComponent as SuccessIcon } from 'assets/img/tx/success.svg';
import { ReactComponent as ErrorIcon } from 'assets/img/result-error-icon.svg';
import { ReactComponent as CloseIcon } from 'assets/img/tx/close.svg';
import { ExportOutlined } from '@ant-design/icons';
import BigNumber from 'bignumber.js';
import { DEFAULT_DATE_FORMAT, ZERO } from 'constants/index';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import clsx from 'clsx';
import Loading from './components/Loading';
import { PoolType } from 'types/stake';
import { useRouter } from 'next/navigation';
import RateTag from 'components/RateTag';

export enum TradeConfirmTypeEnum {
  Stake = 'Stake',
  Add = 'Add',
  Extend = 'Extend',
  Renew = 'Renew',
  Unstake = 'Unstake',
  Claim = 'Claim',
  WithDraw = 'WithDraw',
}

export type TTradeConfirmStatus = 'normal' | 'success' | 'error';

export interface IClaimContent {
  amount?: number | string;
  tokenSymbol?: string;
  releasePeriod?: number | string;
  supportEarlyStake?: boolean;
  poolType?: PoolType;
}

export interface IWithDrawContent {
  amount?: number | string;
  unlockDateTimeStamp?: string | number;
  tokenSymbol?: string;
  days?: number | string;
}

export interface IExtendedLockupContent {
  days?: number | string;
  unlockDateTimeStamp?: string | number;
}

export interface IStakeContent {
  amount?: number | string;
  unlockDateTimeStamp?: string | number;
  tokenSymbol?: string;
  days?: number | string;
  rate?: number | string;
}

export interface IUnLockContent {
  amountFromEarlyStake?: string;
  amountFromWallet?: string;
  tokenSymbol?: string;
  rewardsSymbol?: string;
  releasePeriod?: number | string;
  supportEarlyStake?: boolean;
  autoClaimAmount?: string;
  poolType?: PoolType;
  rate?: number | string;
}

export type TConfirmModalContentType = IExtendedLockupContent &
  IUnLockContent &
  IStakeContent &
  IClaimContent &
  IExtendedLockupContent &
  IWithDrawContent;

export interface ITradeConfirmProps {
  type: TradeConfirmTypeEnum;
  content: TConfirmModalContentType;
  backPath?: string;
  poolType?: PoolType;
  isStakeRewards?: boolean;
  poolDetailPath?: string;
  status?: TTradeConfirmStatus;
  loading?: boolean;
  transactionId?: string;
  onEarlyStake?: () => void;
}

function TradeConfirm(props: ITradeConfirmProps) {
  const {
    content,
    type,
    backPath,
    poolType,
    isStakeRewards = false,
    poolDetailPath = '',
    status,
    loading,
    transactionId,
    onEarlyStake,
  } = props;
  const { isXS } = useResponsive();
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

  const operationName = useMemo(() => {
    return {
      [TradeConfirmTypeEnum.Stake]: isStakeRewards ? 'Stake rewards' : 'Stake',
      [TradeConfirmTypeEnum.Add]: isStakeRewards ? 'Add stake rewards' : 'Add stake',
      [TradeConfirmTypeEnum.Extend]: 'Extend stake',
      [TradeConfirmTypeEnum.Renew]: 'Renew stake',
      [TradeConfirmTypeEnum.Unstake]: 'Unstake',
      [TradeConfirmTypeEnum.Claim]: 'Rewards claim',
      [TradeConfirmTypeEnum.WithDraw]: 'Withdrawal',
    }?.[type];
  }, [isStakeRewards, type]);

  const unStakeHasAmountFromWallet = useMemo(() => {
    return BigNumber(content?.amountFromWallet || 0).gt(ZERO);
  }, [content?.amountFromWallet]);

  const unStakeHasAmountFromEarlyStake = useMemo(() => {
    return BigNumber(content?.amountFromEarlyStake || 0).gt(ZERO);
  }, [content?.amountFromEarlyStake]);

  const renderHeader = useMemo(() => {
    return (
      <div className="flex flex-col gap-4 items-center text-center">
        {status === 'normal' ? <Loading /> : status === 'success' ? <SuccessIcon /> : <ErrorIcon />}
        <p className="text-2xl font-semibold text-neutralTitle">{`${
          status === 'normal'
            ? operationName + ' is pending'
            : status === 'success'
            ? operationName + ' successful'
            : operationName + ' failed'
        }`}</p>
        {status === 'normal' && (
          <p className="text-base font-normal text-neutralPrimary">
            {type === TradeConfirmTypeEnum.Unstake
              ? poolType === PoolType.LP
                ? BigNumber(content?.autoClaimAmount || 0).gt(0)
                  ? 'Your transaction is being processed. You may close this window. Once completed, your unstaked amount and the rewards will appear on the rewards page.'
                  : 'Your transaction is being processed. You may close this window. Once completed, your unstaked amount will appear on the rewards page. '
                : unStakeHasAmountFromEarlyStake && unStakeHasAmountFromWallet
                ? 'Your transaction is being processed. You may close this window. Once completed, your withdrawn amount will be transferred to your wallet, while the rewards will appear on the rewards page.'
                : unStakeHasAmountFromWallet
                ? 'Your transaction is being processed. You may close this window. Once completed, your withdrawn amount will be transferred to your wallet.'
                : 'Your transaction is being processed. You may close this window. Once completed, your rewards will appear on the rewards page.'
              : type === TradeConfirmTypeEnum.Claim
              ? poolType === PoolType.POINTS
                ? 'Your transaction is being processed. You may close this window. Once completed, your rewards will appear on the rewards page.'
                : 'Your transaction is being processed. You may close this window. Once completed, your claimed rewards will appear on the rewards page.'
              : type === TradeConfirmTypeEnum.WithDraw
              ? 'Your transaction is being processed. You may close this window. Once completed, the withdrawn amount will be transferred to your wallet.'
              : 'Your transaction is being processed. You may close this window. Once completed, you can check your staking balance and earned rewards on the staking details page.'}
          </p>
        )}
      </div>
    );
  }, [
    content?.autoClaimAmount,
    operationName,
    poolType,
    status,
    type,
    unStakeHasAmountFromEarlyStake,
    unStakeHasAmountFromWallet,
  ]);

  console.log(
    '======Amount',
    content?.autoClaimAmount,
    content?.amountFromWallet,
    content?.amountFromEarlyStake,
  );

  const resultActions = useMemo(() => {
    return (
      <Flex justify="center" gap={12} vertical={isXS}>
        <Button
          className="!rounded-lg !min-w-[200px]"
          onClick={() => {
            backPath && router.replace(backPath);
          }}
        >
          {type === TradeConfirmTypeEnum.Unstake ||
          type === TradeConfirmTypeEnum.Claim ||
          type === TradeConfirmTypeEnum.WithDraw
            ? 'View Rewards'
            : 'View My Staking'}
        </Button>
        {((type === TradeConfirmTypeEnum.Unstake &&
          BigNumber(content?.autoClaimAmount || 0).gt(ZERO)) ||
          type === TradeConfirmTypeEnum.Claim) &&
          content?.supportEarlyStake && (
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
  }, [
    backPath,
    content?.autoClaimAmount,
    content?.supportEarlyStake,
    isXS,
    onEarlyStake,
    router,
    type,
  ]);

  const onClose = useCallback(() => {
    let path = '';
    if (isStakeRewards) {
      path = type === TradeConfirmTypeEnum.Stake ? '/staking' : poolDetailPath || '/staking';
    } else if (type === TradeConfirmTypeEnum.Stake || type === TradeConfirmTypeEnum.Unstake) {
      path = '/staking';
    } else {
      router.back();
      return;
    }
    router.replace(path);
  }, [isStakeRewards, poolDetailPath, router, type]);

  const renderContent = useMemo(() => {
    if (!content) return null;
    return (
      <>
        <Flex
          vertical
          className="w-full gap-4 py-4 px-6 rounded-lg bg-brandBg text-sm font-normal text-neutralSecondary"
        >
          {type !== TradeConfirmTypeEnum.Unstake &&
          type !== TradeConfirmTypeEnum.Claim &&
          type !== TradeConfirmTypeEnum.WithDraw ? (
            <>
              {type !== TradeConfirmTypeEnum.Extend && (
                <Flex justify="space-between">
                  <span>
                    {type === TradeConfirmTypeEnum.Add
                      ? isStakeRewards
                        ? 'Add staked rewards'
                        : 'Add staked'
                      : isStakeRewards
                      ? 'Staked rewards'
                      : 'Staked'}
                  </span>
                  <Flex align="center" gap={8}>
                    <span className="text-neutralPrimary font-medium">
                      {`${formatTokenPrice(BigNumber(content?.amount || 0))} ${formatTokenSymbol(
                        content?.tokenSymbol || '',
                      )}`}
                    </span>
                    {!!content?.rate && !isStakeRewards && (
                      <RateTag
                        value={Number(content?.rate) * 100}
                        className="!ml-0 !font-[500] !text-xs !px-[6px] !py-0 !rounded-sm"
                      />
                    )}
                  </Flex>
                </Flex>
              )}
              <Flex justify="space-between">
                <span>
                  {type === TradeConfirmTypeEnum.Stake || type === TradeConfirmTypeEnum.Renew
                    ? 'Stake duration'
                    : 'Extend stake duration'}
                </span>
                <span className="text-neutralPrimary font-medium">{`${
                  content?.days || 0
                } Days`}</span>
              </Flex>
              <Flex justify="space-between">
                <span>Unlock on</span>
                <span className="text-neutralPrimary font-medium">
                  {dayjs(Number(content?.unlockDateTimeStamp || 0)).format(DEFAULT_DATE_FORMAT)}
                </span>
              </Flex>
            </>
          ) : type === TradeConfirmTypeEnum.Claim ? (
            <>
              <Flex justify="space-between">
                <span>Claimed rewards</span>
                <span className="text-neutralPrimary font-medium">
                  {`${formatTokenPrice(content?.amount || 0)} ${formatTokenSymbol(
                    content?.tokenSymbol || '',
                  )}`}
                </span>
              </Flex>
            </>
          ) : type === TradeConfirmTypeEnum.WithDraw ? (
            <>
              <Flex justify="space-between">
                <span>Withdrawn</span>
                <span className="text-neutralPrimary font-medium">
                  {`${formatTokenPrice(content?.amount || 0)} ${formatTokenSymbol(
                    content?.tokenSymbol || '',
                  )}`}
                </span>
              </Flex>
            </>
          ) : (
            <>
              {poolType !== PoolType.LP && (
                <Flex justify="space-between">
                  <span>
                    {(unStakeHasAmountFromWallet && !unStakeHasAmountFromEarlyStake) ||
                    (unStakeHasAmountFromWallet && unStakeHasAmountFromEarlyStake)
                      ? 'Withdrawn'
                      : 'Unstaked rewards'}
                  </span>
                  <span className="text-neutralPrimary font-medium">
                    {`${formatTokenPrice(
                      BigNumber(content?.amountFromWallet || 0).gt(ZERO)
                        ? content?.amountFromWallet || 0
                        : BigNumber(content?.amountFromEarlyStake || 0).gt(ZERO)
                        ? content?.amountFromEarlyStake || 0
                        : 0,
                    )} ${formatTokenSymbol(
                      unStakeHasAmountFromEarlyStake && !unStakeHasAmountFromWallet
                        ? content?.rewardsSymbol || ''
                        : content?.tokenSymbol || '',
                    )}`}
                  </span>
                </Flex>
              )}
              {unStakeHasAmountFromEarlyStake &&
                unStakeHasAmountFromWallet &&
                poolType !== PoolType.LP && (
                  <Flex justify="space-between">
                    <span>Unstaked rewards</span>
                    <span className="text-neutralPrimary font-medium">
                      {`${formatTokenPrice(content?.amountFromEarlyStake || 0)} ${formatTokenSymbol(
                        content?.rewardsSymbol || '',
                      )}`}
                    </span>
                  </Flex>
                )}
              {poolType === PoolType.LP && (
                <Flex justify="space-between">
                  <span>Unstaked</span>
                  <Flex align="center" gap={8}>
                    <span className="text-neutralPrimary font-medium">
                      {`${formatTokenPrice(
                        BigNumber(content?.amountFromWallet || 0).plus(
                          BigNumber(content?.amountFromEarlyStake || 0),
                        ),
                      )} ${formatTokenSymbol(content?.tokenSymbol || '')}`}
                    </span>
                    {!!content?.rate && !isStakeRewards && (
                      <RateTag
                        value={Number(content?.rate) * 100}
                        className="!ml-0 !font-[500] !text-xs !px-[6px] !py-0 !rounded-sm"
                      />
                    )}
                  </Flex>
                </Flex>
              )}
              {BigNumber(content?.autoClaimAmount || 0).gt(ZERO) && (
                <Flex justify="space-between">
                  <span>Claimed rewards</span>
                  <span className="text-neutralPrimary font-medium">
                    {`${formatTokenPrice(content?.autoClaimAmount || 0)} ${formatTokenSymbol(
                      content?.rewardsSymbol || '',
                    )}`}
                  </span>
                </Flex>
              )}
            </>
          )}
        </Flex>
        {(type === TradeConfirmTypeEnum.Claim ||
          (type === TradeConfirmTypeEnum.Unstake &&
            BigNumber(content?.autoClaimAmount || 0).gt(ZERO))) && (
          <p
            className={clsx(
              'text-sm font-normal text-neutralSecondary',
              status === 'normal' ? 'mt-6' : 'mt-4',
            )}
          >
            Note: Your claimed rewards will be gradually released over a{` `}
            <span className="font-bold text-neutralTitle"> {`${withDrawPeriod}`}</span>
            {` `}
            period.
          </p>
        )}
      </>
    );
  }, [
    content,
    isStakeRewards,
    poolType,
    status,
    type,
    unStakeHasAmountFromEarlyStake,
    unStakeHasAmountFromWallet,
    withDrawPeriod,
  ]);

  const handleClose = useCallback(() => {
    //
  }, []);

  const renderFooter = useMemo(() => {
    if (status !== 'success') return null;
    return (
      <div className="flex flex-col text-center w-full gap-4">
        {resultActions}
        {transactionId && (
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
  }, [explorerUrl, resultActions, status, transactionId]);

  return (
    <div className="w-full max-w-[672px] mx-auto mt-6 lg:mt-[64px] border-[1px] border-solid border-[#E0E0E0] rounded-2xl p-8 bg-white relative">
      {status === 'normal' && (
        <CloseIcon className="absolute cursor-pointer top-5 right-5" onClick={onClose} />
      )}
      {renderHeader}
      <div className="mt-4">{renderContent}</div>
      <div className="mt-6">{renderFooter}</div>
    </div>
  );
}

export default TradeConfirm;
