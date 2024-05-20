import { Button, ToolTip } from 'aelf-design';
import { ReactComponent as QuestionIconComp } from 'assets/img/questionCircleOutlined.svg';
import BigNumber from 'bignumber.js';
import ConfirmModal from 'components/ConfirmModal';
import useRewardsAggregation from 'pageComponents/rewards/hooks/useRewardsAggregation';
import { useMemo } from 'react';
import useResponsive from 'utils/useResponsive';

export default function PoolsAmount() {
  const {
    pointsState,
    pointsWithdraw,
    tokenWithdraw,
    LPWithdraw,
    pointsPoolsAmount,
    tokenPoolsAmount,
    LpPoolsAmount,
    confirmModalType,
    confirmModalVisible,
    confirmModalLoading,
    confirmModalContent,
    confirmModalStatus,
    confirmModalTransactionId,
    confirmModalOnClose,
    confirmModalOnConfirm,
    pointsEarlyStakeDisabled,
  } = useRewardsAggregation();

  const { isSM, isMD } = useResponsive();

  const pointsWithdrawDisabled = useMemo(() => {
    return BigNumber(pointsPoolsAmount.rewardsTotal).isZero();
  }, [pointsPoolsAmount.rewardsTotal]);

  const pointsStakeDisabled = useMemo(() => {
    return BigNumber(pointsPoolsAmount.stakeTotal).isZero();
  }, [pointsPoolsAmount.stakeTotal]);

  const tokenWithdrawDisabled = useMemo(() => {
    return BigNumber(tokenPoolsAmount.rewardsTotal).isZero();
  }, [tokenPoolsAmount.rewardsTotal]);

  const lpWithdrawDisabled = useMemo(() => {
    return BigNumber(LpPoolsAmount.rewardsTotal).isZero();
  }, [LpPoolsAmount.rewardsTotal]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2  xl:grid-cols-4 gap-4 md:gap-[24px]">
      {/* Points */}
      <div className="col-span-1 md:col-span-2 border-solid border-neutralBorder border-[1px] rounded-[24px] p-6 overflow-hidden bg-neutralWhiteBg">
        <div className="text-2xl text-neutralPrimary font-semibold">XPSGR Points Pools</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="p-4 bg-brandBg rounded-xl">
            <div className="flex gap-1 items-center">
              <span className="text-base font-medium text-neutralTertiary">
                Stakeable {pointsPoolsAmount.rewardsTokenName} Rewards
              </span>
              <ToolTip title="Stake XPSGR pool to earn more with all claimed SGR rewards (including those in the lock-up period).">
                <QuestionIconComp className="w-4 h-4 cursor-pointer" width={16} height={16} />
              </ToolTip>
            </div>
            <div className="text-xl text-neutralPrimary font-semibold mt-2 break-all">
              {pointsPoolsAmount.stakeTotal}
            </div>
            <div className="mt-1 text-xs text-neutralPrimary font-normal break-all">
              {pointsPoolsAmount.stakeTotalUSD}
            </div>
            <ToolTip title={pointsStakeDisabled ? undefined : 'Stake has expired, please unlock'}>
              <Button
                onClick={pointsState}
                block={isMD}
                size="medium"
                type="primary"
                className="mt-6 !min-w-[120px] !rounded-md !mx-auto"
                disabled={pointsEarlyStakeDisabled}
              >
                Stake
              </Button>
            </ToolTip>
          </div>
          <div className="p-4 bg-brandBg rounded-xl">
            <div className="flex gap-1 items-center">
              <span className="text-sm font-medium text-neutralTertiary">
                Withdrawable {pointsPoolsAmount.rewardsTokenName} Rewards
              </span>
              <ToolTip title="After staking in the XPSGR pool, claimed SGR rewards can be withdrawn to the wallet after the lock-up period, while staking rewards cannot be withdrawn.">
                <QuestionIconComp className="w-4 h-4 cursor-pointer" width={16} height={16} />
              </ToolTip>
            </div>
            <div className="text-xl text-neutralPrimary font-semibold mt-2 break-all">
              {pointsPoolsAmount.rewardsTotal}
            </div>
            <div className="mt-1 text-xs text-neutralPrimary font-normal break-all">
              {pointsPoolsAmount.rewardsTotalUSD}
            </div>
            <Button
              size="medium"
              ghost
              block={isMD}
              type="primary"
              className="mt-6 !min-w-[120px] !rounded-md !mx-auto"
              disabled={pointsWithdrawDisabled}
              onClick={pointsWithdraw}
            >
              Withdraw
            </Button>
          </div>
        </div>
      </div>
      {/* SGR */}
      <div className="col-span-1 md:col-span-1 border-solid border-neutralBorder border-[1px] rounded-[24px] p-6 overflow-hidden bg-neutralWhiteBg">
        <div className="text-2xl text-neutralPrimary font-semibold">SGR Pool</div>
        <div className="p-4 bg-brandBg rounded-xl mt-4">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-neutralTertiary">
              Withdrawable {tokenPoolsAmount.rewardsTokenName} Rewards
            </span>
            <ToolTip
              title={`After staking in the ${tokenPoolsAmount.rewardsTokenName} pool, rewards can be withdrawn to the wallet after the lock-up period.`}
            >
              <QuestionIconComp className="w-4 h-4 cursor-pointer" width={16} height={16} />
            </ToolTip>
          </div>
          <div className="text-xl text-neutralPrimary font-semibold mt-2 break-all">
            {tokenPoolsAmount.rewardsTotal}
          </div>
          <div className="mt-1 text-xs text-neutralPrimary font-normal break-all">
            {tokenPoolsAmount.rewardsTotalUSD}
          </div>
          <Button
            size="medium"
            block={isMD}
            ghost
            type="primary"
            className="mt-6 !min-w-[120px] !mx-auto !rounded-md"
            disabled={tokenWithdrawDisabled}
            onClick={tokenWithdraw}
          >
            Withdraw
          </Button>
        </div>
      </div>
      {/* Lp */}
      <div className="col-span-1 md:col-span-1 border-solid border-neutralBorder border-[1px] rounded-[24px] p-6 overflow-hidden bg-neutralWhiteBg">
        <div className="text-2xl text-neutralPrimary font-semibold">LP Pool</div>
        <div className="p-4 bg-brandBg rounded-xl mt-4">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-neutralTertiary">
              Withdrawable {LpPoolsAmount.rewardsTokenName} Rewards
            </span>
            <ToolTip
              title={`After staking in the ${
                LpPoolsAmount?.rewardsTokenName || ''
              } pool, rewards can be withdrawn to the wallet after the lock-up period.`}
            >
              <QuestionIconComp className="w-4 h-4 cursor-pointer" width={16} height={16} />
            </ToolTip>
          </div>
          <div className="text-xl text-neutralPrimary font-semibold mt-2 break-all">
            {LpPoolsAmount.rewardsTotal}
          </div>
          <div className="mt-1 text-xs text-neutralPrimary font-normal break-all">
            {LpPoolsAmount.rewardsTotalUSD}
          </div>
          <Button
            size="medium"
            block={isMD}
            ghost
            type="primary"
            className="mt-6 !min-w-[120px] !mx-auto !rounded-md"
            disabled={lpWithdrawDisabled}
            onClick={LPWithdraw}
          >
            Withdraw
          </Button>
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
}
