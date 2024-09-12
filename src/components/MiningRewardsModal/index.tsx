import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Button } from 'aelf-design';
import BigNumber from 'bignumber.js';
import CommonModal from 'components/CommonModal';
import CommonTooltip from 'components/CommonTooltip';
import RewardCard from 'components/RewardCard';
import { DEFAULT_DATE_FORMAT } from 'constants/index';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { divDecimals } from 'utils/calculate';
import { formatTokenPrice, formatTokenSymbol } from 'utils/format';

export interface IRewardsModalProps {
  symbol: string;
  decimal: number;
  rewardsSymbol: string;
  totalAmount: string | number;
  frozenAmount: string | number;
  claimableAmount: string | number;
  withdrawnAmount: string | number;
  nextReleaseTime: string | number;
  nextReleaseAmount: string | number;
  totalAmountUsd: string | number;
  frozenAmountUsd: string | number;
  withdrawnAmountUsd: string | number;
  claimableAmountUsd: string | number;
  earlyStakedAmountInUsd: string | number;
  earlyStakedAmount: string | number;
  earlyStakedPoolIsUnLock: boolean;
  isAllReleased?: boolean;
  allRewardsRelease: boolean;
  claimInfos: Array<any>;
  showEarlyStake: boolean;
  onEarlyStake: () => void;
}

export default NiceModal.create(function MiningRewardsModal({
  symbol,
  totalAmount,
  frozenAmount,
  claimableAmount,
  withdrawnAmount,
  totalAmountUsd,
  withdrawnAmountUsd,
  frozenAmountUsd,
  claimableAmountUsd,
  earlyStakedAmount,
  earlyStakedAmountInUsd,
  rewardsSymbol,
  nextReleaseAmount,
  nextReleaseTime,
  earlyStakedPoolIsUnLock,
  allRewardsRelease,
  claimInfos,
  onEarlyStake,
  decimal,
  isAllReleased = false,
  showEarlyStake,
}: IRewardsModalProps) {
  const modal = useModal();
  const { isLogin } = useGetLoginStatus();

  const title = useMemo(() => {
    return `${symbol} rewards details`;
  }, [symbol]);

  const releaseAmountText = useMemo(() => {
    return !isLogin || !nextReleaseAmount
      ? '--'
      : `${formatTokenPrice(
          divDecimals(nextReleaseAmount, decimal || 8),
        ).toString()} ${formatTokenSymbol(rewardsSymbol)}`;
  }, [decimal, isLogin, nextReleaseAmount, rewardsSymbol]);

  const releaseTime = useMemo(() => {
    return !isLogin || !nextReleaseTime ? '--' : dayjs(nextReleaseTime).format(DEFAULT_DATE_FORMAT);
  }, [isLogin, nextReleaseTime]);

  const showLastReleaseModule = useMemo(() => {
    if (!isLogin) return false;
    if (!BigNumber(totalAmount || 0).isZero()) {
      if (!claimInfos || !claimInfos?.length) {
        if (allRewardsRelease) return true;
        return false;
      }
      return true;
    }
    return false;
  }, [allRewardsRelease, claimInfos, isLogin, totalAmount]);

  return (
    <CommonModal
      footer={
        <Button
          type="primary"
          size="large"
          className="!min-w-[260px] !rounded-lg"
          onClick={() => {
            modal.hide();
          }}
        >
          Got it
        </Button>
      }
      title={title}
      open={modal.visible}
      onCancel={() => {
        modal.remove();
      }}
      afterClose={() => {
        modal.remove();
      }}
    >
      <RewardCard
        totalAmount={totalAmount}
        totalAmountUsd={totalAmountUsd}
        frozenAmount={frozenAmount}
        frozenAmountUsd={frozenAmountUsd}
        claimableAmount={claimableAmount}
        claimableAmountUsd={claimableAmountUsd}
        withdrawnAmount={withdrawnAmount}
        withdrawnAmountUsd={withdrawnAmountUsd}
        rewardsTokenSymbol={rewardsSymbol}
        onEarlyStake={onEarlyStake}
        earlyStakedAmount={earlyStakedAmount}
        earlyStakedAmountInUsd={earlyStakedAmountInUsd}
        earlyStakedPoolIsUnLock={earlyStakedPoolIsUnLock}
        decimal={decimal}
        showEarlyStake={showEarlyStake}
      />
      {showLastReleaseModule && (
        <div className="mt-6 bg-brandBg rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-neutralTitle">Next release on</span>
              <CommonTooltip title="There is a release period for claimed rewards; Rewards with similar release periods will be released together." />
            </div>
            {isAllReleased && (
              <span className="text-base text-neutralTitle font-medium">All released</span>
            )}
          </div>
          {!isAllReleased && (
            <div className="mt-4 flex justify-between text-base font-medium text-neutralTitle">
              <span>{releaseTime}</span>
              <span>{releaseAmountText}</span>
            </div>
          )}
        </div>
      )}
    </CommonModal>
  );
});
