import { Flex } from 'antd';
import useUnlockCount from 'components/StakeCard/hooks/useUnlockCount';
import { useMemo } from 'react';
import styles from './style.module.css';
import clsx from 'clsx';
import { ReactComponent as LockIcon } from 'assets/img/lock.svg';
import { ReactComponent as UnLockIcon } from 'assets/img/unlock.svg';
import { divDecimals } from 'utils/calculate';
import {
  formatNumber,
  formatNumberWithDecimalPlaces,
  formatTokenSymbol,
  formatUSDPrice,
  timeRemaining,
} from 'utils/format';
import { Button, ToolTip } from 'aelf-design';
import { ReactComponent as WarningSVG } from 'assets/img/warning.svg';
import { DEFAULT_DATE_FORMAT, ZERO } from 'constants/index';
import dayjs from 'dayjs';
import RenewalModal from 'components/RenewalModal';
import { useModal } from '@ebay/nice-modal-react';
import CommonTooltip from 'components/CommonTooltip';
import { MAX_STAKE_PERIOD } from 'constants/stake';
import BigNumber from 'bignumber.js';
import useAPRK from 'hooks/useAPRK';
import { format } from 'path';

interface IStakeDetailProps {
  poolInfo: IStakePoolData;
  onRenewal: (poolInfo: IStakePoolData) => void;
  onExtend: (poolInfo: IStakePoolData) => void;
  onAdd: (poolInfo: IStakePoolData) => void;
  onClaim: (poolInfo: IStakePoolData) => void;
  onUnlock: (poolInfo: IStakePoolData) => void;
}

export default function StakeDetail(props: IStakeDetailProps) {
  const { poolInfo, onRenewal, onClaim, onUnlock, onAdd, onExtend } = props;
  const renewalModal = useModal(RenewalModal);
  const { isUnLocked, targetUnlockTimeStamp } = useUnlockCount({
    unlockWindowDuration: poolInfo?.unlockWindowDuration || 0,
    stakingPeriod: poolInfo?.stakingPeriod || 0,
    lastOperationTime: poolInfo?.lastOperationTime || 0,
  });
  const { getAprKAve } = useAPRK();

  const lockLabel = useMemo(() => {
    return (
      <div className={clsx('flex gap-1', styles.lockLabel, isUnLocked && styles.unlockLabel)}>
        {isUnLocked ? <UnLockIcon width={12} height={12} /> : <LockIcon width={12} height={12} />}
        <span>{isUnLocked ? 'Unlocked' : 'Locked'}</span>
      </div>
    );
  }, [isUnLocked]);

  const stakedAmount = useMemo(() => {
    const { staked, decimal, stakeSymbol } = poolInfo;
    const stakeAmount = divDecimals(staked, decimal);
    return `${formatNumber(stakeAmount)} ${formatTokenSymbol(stakeSymbol || '')}`;
  }, [poolInfo]);

  const stakedAmountUsd = useMemo(() => {
    const { stakedInUsd, decimal } = poolInfo;
    return formatUSDPrice(divDecimals(stakedInUsd || 0, decimal));
  }, [poolInfo]);

  const earnedAmountUsd = useMemo(() => {
    const { earnedInUsd, decimal } = poolInfo;
    return formatUSDPrice(divDecimals(earnedInUsd || 0, decimal));
  }, [poolInfo]);

  const earnedAmount = useMemo(() => {
    const { earned, decimal, earnedSymbol } = poolInfo;
    return `${formatNumber(divDecimals(earned, decimal))} ${formatTokenSymbol(earnedSymbol || '')}`;
  }, [poolInfo]);

  const renewalTip = useMemo(() => {
    const { unlockWindowDuration } = poolInfo;

    return isUnLocked ? (
      <p className="mt-6 text-sm font-medium text-neutralSecondary">
        <span>Please unstake your assets by</span>{' '}
        <span className="text-neutralTitle">
          {dayjs(targetUnlockTimeStamp)
            .add(Number(unlockWindowDuration || 0), 'second')
            .format(DEFAULT_DATE_FORMAT)}
        </span>
        <span>. After this time, assets will be</span>{' '}
        <span
          className="cursor-pointer text-[#7D48E8]"
          onClick={() => {
            renewalModal.show({ renewText: [] });
          }}
        >
          automatically renewed
        </span>
      </p>
    ) : null;
  }, [isUnLocked, poolInfo, renewalModal, targetUnlockTimeStamp]);

  const disabledExtendBtn = useMemo(() => {
    const remainingDays = dayjs(targetUnlockTimeStamp).diff(dayjs(), 'hour') / 24;
    const canNotExtends = ZERO.plus(remainingDays || 0).gt(MAX_STAKE_PERIOD - 1);
    return isUnLocked || canNotExtends;
  }, [isUnLocked, targetUnlockTimeStamp]);

  const isClaimed = useMemo(() => {
    const { latestClaimTime } = poolInfo;
    return dayjs(latestClaimTime || 0).isAfter(targetUnlockTimeStamp);
  }, [poolInfo, targetUnlockTimeStamp]);

  const canClaim = useMemo(() => {
    const { earned, decimal } = poolInfo;
    if (isUnLocked && !isClaimed) {
      return ZERO.plus(divDecimals(earned, decimal)).gt(0);
    }
    return false;
  }, [isClaimed, isUnLocked, poolInfo]);

  const claimBtnTip = useMemo(() => {
    if (isUnLocked) {
      return isClaimed ? 'Rewards will be claimed simultaneously upon unlocking.' : '';
    }
    return 'You cannot claim rewards during the lock-up period for staking.';
  }, [isClaimed, isUnLocked]);

  const actionButtons = useMemo(() => {
    const { stakeSymbol } = poolInfo;
    const symbol = formatTokenSymbol(stakeSymbol || '');
    return (
      <Flex gap={24} className="py-6">
        {isUnLocked ? (
          <>
            <ToolTip title={claimBtnTip}>
              <Button
                className="flex-1 !rounded-lg"
                type="primary"
                disabled={!canClaim}
                onClick={() => {
                  onClaim?.(poolInfo);
                }}
              >
                Claim Rewards
              </Button>
            </ToolTip>

            <Button
              className="flex-1 !rounded-lg"
              type="primary"
              ghost
              onClick={() => {
                onUnlock?.(poolInfo);
              }}
            >
              {`Unstake ${symbol}`}
            </Button>
          </>
        ) : (
          <>
            <Button
              className="flex-1 !rounded-lg"
              type="primary"
              onClick={() => {
                onAdd?.(poolInfo);
              }}
            >
              {`Add ${symbol}`}
            </Button>
            <Button
              className="flex-1 !rounded-lg"
              type="primary"
              ghost
              disabled={disabledExtendBtn}
              onClick={() => {
                onExtend?.(poolInfo);
              }}
            >
              Extend
            </Button>
          </>
        )}
      </Flex>
    );
  }, [
    canClaim,
    claimBtnTip,
    disabledExtendBtn,
    isUnLocked,
    onAdd,
    onClaim,
    onExtend,
    onUnlock,
    poolInfo,
  ]);

  const apr = useMemo(() => {
    return `${formatNumberWithDecimalPlaces(ZERO.plus(poolInfo?.aprMin || 0).times(100))}%`;
  }, [poolInfo?.aprMin]);

  const aprK = useMemo(() => {
    const { stakeInfos = [], fixedBoostFactor } = poolInfo || {};
    const originAprK = stakeInfos?.length > 0 ? getAprKAve(stakeInfos, fixedBoostFactor || 0) : '';
    return originAprK ? BigNumber(originAprK).toFixed(2, BigNumber.ROUND_DOWN) : '--';
  }, [getAprKAve, poolInfo]);

  const aprText = useMemo(() => {
    return `${apr} (${aprK}x)`;
  }, [apr, aprK]);

  const unlockTimeText = useMemo(() => {
    return `On ${dayjs(targetUnlockTimeStamp).format(DEFAULT_DATE_FORMAT)}`;
  }, [targetUnlockTimeStamp]);

  const lockTimeRemainText = useMemo(() => {
    return timeRemaining(targetUnlockTimeStamp);
  }, [targetUnlockTimeStamp]);

  const autoRenewalLeftTimeText = useMemo(() => {
    return timeRemaining(
      dayjs(targetUnlockTimeStamp)
        .add(Number(poolInfo?.unlockWindowDuration || 0), 'second')
        .valueOf(),
    );
  }, [poolInfo?.unlockWindowDuration, targetUnlockTimeStamp]);

  return (
    <div>
      <Flex justify="space-between" align="center">
        <span className="text-lg font-medium text-neutralTitle">My position</span>
        {lockLabel}
      </Flex>
      <div className="mt-4 p-6 rounded-[16px] border-[#F4F9FE] border-[1px] border-solid bg-[#F9FCFF] flex gap-6">
        <Flex flex={1} vertical>
          <span className="text-sm font-medium text-neutralTertiary">Staked</span>
          <span className="mt-2 text-lg leading-[24px] font-semibold text-neutralTitle">
            {stakedAmount}
          </span>
          <span className="mt-[2px]">{stakedAmountUsd}</span>
        </Flex>
        {isUnLocked ? (
          <Flex flex={1} vertical>
            <Flex gap={4} align="center">
              <span className="text-sm font-medium text-neutralTertiary">Auto-renew in</span>
              <ToolTip title="The lock-up period has ended. Please unstake within the auto-renewal window!">
                <WarningSVG className="w-[20px] h-[20px] cursor-pointer" />
              </ToolTip>
            </Flex>
            <span className="mt-2 text-lg leading-[24px] font-semibold text-neutralTitle">
              {autoRenewalLeftTimeText}
            </span>
            <span
              className="mt-[2px] text-sm font-medium text-[#7D48E8] cursor-pointer"
              onClick={() => {
                onRenewal?.(poolInfo);
              }}
            >
              Renew Now
            </span>
          </Flex>
        ) : (
          <Flex flex={1} vertical>
            <span className="text-sm font-medium text-neutralTertiary">Unlocks in</span>
            <span className="mt-2 text-lg leading-[24px] font-semibold text-neutralTitle">
              {lockTimeRemainText}
            </span>
            <span className="mt-[2px] text-sm font-medium text-neutralSecondary">
              {unlockTimeText}
            </span>
          </Flex>
        )}
      </div>
      {renewalTip}
      {actionButtons}
      <div className="mt-6 p-6 rounded-[16px] border-[#F4F9FE] border-[1px] border-solid bg-[#F9FCFF] flex gap-6">
        <Flex vertical gap={16} className="text-sm font-normal text-[#808080] w-full">
          <Flex justify="space-between">
            <Flex gap={4} align="center">
              APR
              <CommonTooltip
                size={20}
                title="Annual percentage rate (or APR) shows the rate of return you earn over a year. Users who lock their tokens in the longer period pools will receive higher APR."
              />
            </Flex>
            <Flex gap={4} align="center">
              <span className="font-medium text-[#434343]">{aprText}</span>
              <CommonTooltip
                size={20}
                title="Longer staking period increases the multiplier (x), boosting the APR."
              />
            </Flex>
          </Flex>
          <Flex justify="space-between">
            <span>Earned rewards</span>
            <Flex vertical align="end" gap={4} className="font-medium">
              <span className="text-[#434343]">{earnedAmount}</span>
              <span className="text-neutralSecondary">{earnedAmountUsd}</span>
            </Flex>
          </Flex>
        </Flex>
      </div>
    </div>
  );
}
