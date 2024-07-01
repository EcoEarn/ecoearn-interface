import { Button, ToolTip } from 'aelf-design';
import CommonTooltip from 'components/CommonTooltip';
import ConfirmModal from 'components/ConfirmModal';
import useRewardsAggregation from 'pageComponents/rewards/hooks/useRewardsAggregation';
import { forwardRef, useImperativeHandle } from 'react';
import clsx from 'clsx';
import { RightOutlined } from '@ant-design/icons';
import { PoolType } from 'types/stake';

export default forwardRef(function PoolsAmount(props, ref) {
  const {
    earlyStake,
    pointsWithdraw,
    tokenWithdraw,
    LPWithdraw,
    pointsPoolsAmount,
    tokenPoolsAmount,
    lpPoolsAmount,
    confirmModalType,
    confirmModalVisible,
    confirmModalLoading,
    confirmModalContent,
    confirmModalStatus,
    confirmModalTransactionId,
    confirmModalOnClose,
    confirmModalOnConfirm,
    pointsEarlyStakeDisabled,
    tokenEarlyStakeDisabled,
    lpEarlyStakeDisabled,
    pointsStakeDisabledTip,
    tokenStakeDisabledTip,
    lpStakeDisabledTip,
    lpWithdrawDisabled,
    pointsWithdrawDisabled,
    tokenWithdrawDisabled,
    pointsWithdrawTip,
    tokenWithdrawTip,
    lpWithdrawTip,
    fetchData,
    handleLpDetail,
    handleTokenDetail,
    handlePointsDetail,
  } = useRewardsAggregation();

  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchData({ needLoading: false });
    },
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-[24px]">
      {/* Points */}
      <div className="col-span-1 flex flex-col border-solid border-neutralBorder border-[1px] rounded-[24px] p-6 overflow-hidden bg-neutralWhiteBg">
        <div className="flex justify-between items-center">
          <span className="text-xl text-neutralTitle font-semibold">XPSGR Points Pools</span>
          <div
            className="flex gap-1 items-center text-sm font-medium text-brandDefault w-fit cursor-pointer"
            onClick={handlePointsDetail}
          >
            <span>Details</span>
            <RightOutlined
              className={clsx('w-[14px] h-[14px] text-sm leading-[14px] text-brandDefault')}
              width={14}
              height={14}
            />
          </div>
        </div>
        <div className="p-4 flex-1 bg-brandBg rounded-xl mt-4 flex flex-col md:flex-row gap-y-4 gap-x-1  justify-between items-start">
          <div>
            <div className="flex gap-2 items-center">
              <span className="text-base font-medium text-neutralTertiary">Total rewards</span>
              <CommonTooltip title="All SGR rewards claimed in the XPSGR pool." />
            </div>
            <div className="mt-2 break-all text-neutralTitle flex gap-2 items-end">
              <span className="text-lg font-semibold">{pointsPoolsAmount.totalRewards}</span>
              <span className="text-base font-normal flex-shrink-0">
                {pointsPoolsAmount.rewardsTokenName}
              </span>
            </div>
            <div className="mt-1 text-sm text-neutralSecondary font-medium break-all">
              {pointsPoolsAmount.totalRewardsUsd}
            </div>
          </div>
          <div className="w-full md:w-fit md:flex-col gap-4 flex justify-between">
            <ToolTip title={pointsStakeDisabledTip}>
              <Button
                onClick={() => {
                  earlyStake(PoolType.POINTS);
                }}
                size="medium"
                type="primary"
                className="md:!w-[100px] !rounded-md flex-1 md:flex-none"
                disabled={pointsEarlyStakeDisabled}
              >
                Stake
              </Button>
            </ToolTip>
            <ToolTip title={pointsWithdrawTip}>
              <Button
                ghost={!pointsWithdrawDisabled}
                type="primary"
                onClick={pointsWithdraw}
                size="medium"
                className="md:!w-[100px] !rounded-md flex-1 md:flex-none"
                disabled={pointsWithdrawDisabled}
              >
                Withdraw
              </Button>
            </ToolTip>
          </div>
        </div>
      </div>
      {/* SGR */}
      <div className="col-span-1 flex flex-col border-solid border-neutralBorder border-[1px] rounded-[24px] p-6 overflow-hidden bg-neutralWhiteBg">
        <div className="flex justify-between items-center">
          <span className="text-xl text-neutralTitle font-semibold">SGR Pools</span>
          <div
            className="flex gap-1 items-center text-sm font-medium text-brandDefault w-fit cursor-pointer"
            onClick={handleTokenDetail}
          >
            <span>Details</span>
            <RightOutlined
              className={clsx('w-[14px] h-[14px] text-sm leading-[14px] text-brandDefault')}
              width={14}
              height={14}
            />
          </div>
        </div>
        <div className="p-4 flex-1 bg-brandBg rounded-xl mt-4 flex flex-col md:flex-row gap-x-1 gap-y-4 justify-between items-start">
          <div>
            <div className="flex gap-2 items-center">
              <span className="text-base font-medium text-neutralTertiary">Total rewards</span>
              <CommonTooltip title="All SGR rewards claimed in the SGR pool." />
            </div>
            <div className="mt-2 break-all text-neutralTitle flex gap-2 items-end">
              <span className="text-lg font-semibold">{tokenPoolsAmount.totalRewards}</span>
              <span className="text-base font-normal flex-shrink-0">
                {tokenPoolsAmount.rewardsTokenName}
              </span>
            </div>
            <div className="mt-1 text-sm text-neutralSecondary font-medium break-all">
              {tokenPoolsAmount.totalRewardsUsd}
            </div>
          </div>
          <div className="w-full md:flex-col md:w-fit gap-4 flex justify-between">
            <ToolTip title={tokenStakeDisabledTip}>
              <Button
                onClick={() => {
                  earlyStake(PoolType.TOKEN);
                }}
                size="medium"
                type="primary"
                className="md:!w-[100px] !rounded-md flex-1 md:flex-none"
                disabled={tokenEarlyStakeDisabled}
              >
                Stake
              </Button>
            </ToolTip>
            <ToolTip title={tokenWithdrawTip}>
              <Button
                ghost={!tokenWithdrawDisabled}
                type="primary"
                onClick={tokenWithdraw}
                size="medium"
                className="md:!w-[100px] !rounded-md flex-1 md:flex-none"
                disabled={tokenWithdrawDisabled}
              >
                Withdraw
              </Button>
            </ToolTip>
          </div>
        </div>
      </div>
      {/* Lp */}
      <div className="col-span-1 flex flex-col border-solid border-neutralBorder border-[1px] rounded-[24px] p-6 overflow-hidden bg-neutralWhiteBg">
        <div className="flex justify-between items-center">
          <span className="text-xl text-neutralTitle font-semibold">LP Pools</span>
          <div
            className="flex gap-1 items-center text-sm font-medium text-brandDefault w-fit cursor-pointer"
            onClick={handleLpDetail}
          >
            <span>Details</span>
            <RightOutlined
              className={clsx('w-[14px] h-[14px] text-sm leading-[14px] text-brandDefault')}
              width={14}
              height={14}
            />
          </div>
        </div>
        <div className="flex-1 bg-brandBg p-4 rounded-xl mt-4">
          <div className="flex flex-col md:flex-row gap-x-1 gap-y-4 justify-between h-full">
            <div>
              <div className="flex gap-2 items-center">
                <span className="text-base font-medium text-neutralTertiary">Total rewards</span>
                <CommonTooltip title="All SGR rewards claimed in the LP pool." />
              </div>
              <div className="mt-2 break-all text-neutralTitle flex gap-2 items-end">
                <span className="text-lg font-semibold">{lpPoolsAmount.totalRewards}</span>
                <span className="text-base font-normal flex-shrink-0">
                  {lpPoolsAmount.rewardsTokenName}
                </span>
              </div>
              <div className="mt-1 text-sm text-neutralSecondary font-medium break-all">
                {lpPoolsAmount.totalRewardsUsd}
              </div>
            </div>
            <div className="w-full md:flex-col md:w-fit gap-4 flex justify-between">
              <ToolTip title={lpStakeDisabledTip}>
                <Button
                  onClick={() => {
                    earlyStake(PoolType.LP);
                  }}
                  size="medium"
                  type="primary"
                  className="md:!w-[100px] !rounded-md flex-1 md:flex-none"
                  disabled={lpEarlyStakeDisabled}
                >
                  Stake
                </Button>
              </ToolTip>
              <ToolTip title={lpWithdrawTip}>
                <Button
                  ghost={!lpWithdrawDisabled}
                  type="primary"
                  onClick={LPWithdraw}
                  size="medium"
                  className="md:!w-[100px] !rounded-md flex-1 md:flex-none"
                  disabled={lpWithdrawDisabled}
                >
                  Withdraw
                </Button>
              </ToolTip>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        type={confirmModalType}
        content={confirmModalContent}
        status={confirmModalStatus}
        loading={confirmModalLoading}
        visible={confirmModalVisible}
        onClose={confirmModalOnClose}
        onConfirm={confirmModalOnConfirm}
        transactionId={confirmModalTransactionId}
      />
    </div>
  );
});
