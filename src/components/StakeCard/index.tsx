import { useMemo } from 'react';
import { Button, ToolTip } from 'aelf-design';
import Description from 'components/StakeCardDescription';
import StackToken from 'components/StakeToken';
import { ZERO } from 'constants/index';
import {
  durationFromNow,
  formatNumberWithDecimalPlaces,
  formatTokenAmount,
  formatUSDAmount,
} from 'utils/format';
import styles from './style.module.css';
import dayjs from 'dayjs';
import BigNumber from 'bignumber.js';
import { divDecimals } from 'utils/calculate';
import useCountDownLock from 'hooks/useCountDownLock';
import { PoolType } from 'types/stack';
import { MAX_STAKE_PERIOD } from 'constants/stake';
import Renewal from 'components/Renewal';
import useUnlockCount from './hooks/useUnlockCount';

interface IStackCardProps {
  type: PoolType | string;
  data: IStakePoolData;
  renewText: Array<IRenewText>;
  isLogin: boolean;
  onClaim?: (data: IStakePoolData) => void;
  onAdd?: (data: IStakePoolData) => void;
  onUnlock?: (data: IStakePoolData) => void;
  onExtend?: (data: IStakePoolData) => void;
  onStake?: (data: IStakePoolData) => void;
  onRenewal?: (data: IStakePoolData) => void;
}

export default function StackCard({
  type,
  data,
  renewText,
  isLogin,
  onStake,
  onAdd,
  onClaim,
  onExtend,
  onUnlock,
  onRenewal,
}: IStackCardProps) {
  const {
    projectOwner,
    aprMax,
    aprMin,
    earnedSymbol,
    totalStake,
    totalStakeInUsd,
    stakeSymbol,
    earned = '0',
    earnedInUsd,
    staked,
    stakedInUsD,
    stakeApr,
    icons,
    decimal = 8,
    rate,
    unlockWindowDuration,
    stakingPeriod,
    lastOperationTime,
    minimumClaimAmount,
  } = data;

  const { countDisplay, isUnLocked, targetUnlockTimeStamp } = useUnlockCount({
    unlockWindowDuration: unlockWindowDuration || 0,
    stakingPeriod: stakingPeriod || 0,
    lastOperationTime: lastOperationTime || 0,
  });

  const showStackInfo = useMemo(
    () => !BigNumber(data?.staked || '').isZero() && isLogin,
    [data?.staked, isLogin],
  );

  const aprRange = useMemo(() => {
    if (!aprMin || !aprMax) return '--';
    return `${formatNumberWithDecimalPlaces(
      ZERO.plus(aprMin).times(100),
    )}% ~ ${formatNumberWithDecimalPlaces(ZERO.plus(aprMax).times(100))}%`;
  }, [aprMax, aprMin]);

  const canClaim = useMemo(
    () => ZERO.plus(divDecimals(earned, decimal)).gt(minimumClaimAmount || 0),
    [decimal, earned, minimumClaimAmount],
  );

  const claimBtnTip = useMemo(() => {
    return canClaim
      ? undefined
      : `The rewards amount is less than ${minimumClaimAmount} ${earnedSymbol} and cannot be claimed.`;
  }, [canClaim, earnedSymbol, minimumClaimAmount]);

  const unStackTip = useMemo(
    () => (!isUnLocked ? 'You cannot unlock during the lock-up period for staking.' : ''),
    [isUnLocked],
  );

  const stakingExpiredTip = useMemo(
    () =>
      isUnLocked ? 'Stake has expired, cannot be added stake. Please renew the staking first.' : '',
    [isUnLocked],
  );

  const stakedStr = useMemo(() => {
    const stakeAmount = divDecimals(staked, decimal);
    return formatNumberWithDecimalPlaces(stakeAmount);
  }, [decimal, staked]);

  const disabledExtendBtn = useMemo(() => {
    const days = dayjs.duration(Number(stakingPeriod || 0), 'seconds').asDays();
    const canNotExtends = ZERO.plus(days || 0).gt(MAX_STAKE_PERIOD - 1);
    return isUnLocked || canNotExtends;
  }, [isUnLocked, stakingPeriod]);

  return (
    <div className="stack-card flex flex-col gap-6 px-4 py-6 md:gap-4 md:px-8 md:py-8 rounded-xl border border-solid border-neutralDivider bg-neutralWhiteBg">
      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-start">
        <StackToken
          className="lg:min-w-[280px]"
          type={type as PoolType}
          icons={icons}
          rate={rate}
          tokenName={stakeSymbol || '--'}
          projectName={projectOwner || '--'}
        />
        <Description
          className="lg:min-w-[263px]"
          label="APR"
          value={aprRange}
          tip="It indicates APR range obtained based on the different staking cycles. A longer cycle will bring a higher APR."
        />
        <Description label="Earn" value={earnedSymbol || '--'} />
        <Description
          className="lg:min-w-[150px] items-start lg:items-end"
          valueTextAlign="right"
          label="Total Staked"
          value={formatNumberWithDecimalPlaces(divDecimals(totalStake, decimal))}
          extra={`$ ${formatNumberWithDecimalPlaces(totalStakeInUsd || 0)}`}
        />
      </div>

      {!showStackInfo && (
        <Button
          className="lg:w-[200px] lg:self-center !rounded-lg"
          type="primary"
          onClick={() => {
            onStake?.(data);
          }}
        >
          {'Stake'}
        </Button>
      )}

      {showStackInfo && (
        <div className="relative flex flex-col px-4 pt-10 pb-6 gap-6 md:flex-row md:justify-between bg-brandFooterBg md:px-8 md:py-8 md:gap-8 rounded-xl">
          <ToolTip title="APR from Staking">
            <div className={styles['apr-tag']}>
              <span className={styles['apr-text']}>
                APR: {formatNumberWithDecimalPlaces(BigNumber(stakeApr || '').times(100)) || '--'}%
              </span>
            </div>
          </ToolTip>

          <div className="flex flex-1 flex-col xl:flex-row justify-between md:max-w-[336px] gap-6 md:gap-4">
            <div className="flex justify-between md:flex-col md:justify-start md:gap-2">
              <div className="text-base text-neutralSecondary font-medium">
                <span>Earned</span>
                <span className="ml-2 text-sm">{earnedSymbol}</span>
              </div>
              <div className="flex flex-col gap-1 items-end md:items-start">
                <div className="text-base font-semibold text-neutralTitle">
                  {formatTokenAmount(divDecimals(earned, decimal).toFixed())}
                </div>
                <div className="text-sm font-medium text-neutralTitle">
                  {formatUSDAmount(earnedInUsd || 0)}
                </div>
              </div>
            </div>
            <ToolTip title={claimBtnTip}>
              <Button
                className="lg:w-[100px] !rounded-md xl:!mt-2"
                type="primary"
                ghost
                size="medium"
                disabled={!canClaim}
                onClick={() => {
                  onClaim?.(data);
                }}
              >
                Claim
              </Button>
            </ToolTip>
          </div>
          <div className="h-[1px] w-full md:w-[1px] md:h-[inherit] bg-neutralDivider"></div>
          <div className="flex flex-1 flex-col xl:flex-row justify-between md:max-w-[336px] gap-6 md:gap-4">
            <div className="flex justify-between md:flex-col md:justify-start md:gap-2">
              <div className="text-base text-neutralSecondary font-medium">Staked</div>
              <div className="flex flex-col gap-1 items-end md:items-start">
                <div className="flex gap-1 text-base font-semibold text-neutralTitle flex-grow-0">
                  <ToolTip title="The number of rewards included">
                    <span>{stakedStr}</span>
                  </ToolTip>
                  <span>{stakeSymbol}</span>
                </div>
                <div className="text-sm font-medium text-neutralTitle">
                  $ {formatNumberWithDecimalPlaces(stakedInUsD || 0)}
                </div>
              </div>
            </div>
            <div className="flex gap-4 md:gap-3 xl:flex-col xl:mt-2">
              <ToolTip title={stakingExpiredTip}>
                <Button
                  className="flex-1 lg:flex-initial lg:w-[100px] !rounded-md"
                  type="primary"
                  size="medium"
                  onClick={() => {
                    onAdd?.(data);
                  }}
                  disabled={isUnLocked}
                >
                  Add
                </Button>
              </ToolTip>
              <ToolTip title={unStackTip}>
                <Button
                  className="flex-1 lg:flex-initial lg:w-[100px] !rounded-md"
                  size="medium"
                  disabled={!isUnLocked}
                  onClick={() => {
                    onUnlock?.(data);
                  }}
                >
                  Unlock
                </Button>
              </ToolTip>
            </div>
          </div>
          <div className="h-[1px] w-full md:w-[1px] md:h-[inherit] bg-neutralDivider"></div>
          <div className="flex flex-1 flex-col gap-6 xl:flex-row md:gap-4 ">
            {isUnLocked ? (
              <Renewal
                unlockTimeStamp={targetUnlockTimeStamp || ''}
                unlockWindowDuration={unlockWindowDuration || ''}
                renewText={renewText}
                onRenewal={() => {
                  onRenewal?.(data);
                }}
              />
            ) : (
              <>
                <div className="flex flex-col gap-2 lg:min-w-[210px]">
                  <div className="text-base text-neutralSecondary font-medium">
                    Remaining Lock-up Period
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-base font-semibold text-neutralTitle">
                      {isUnLocked ? 'Unlockable' : countDisplay}
                    </div>
                    <div className="text-sm font-medium text-neutralDisable">
                      Unlock on {dayjs(targetUnlockTimeStamp).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                </div>
                <ToolTip title={stakingExpiredTip}>
                  <Button
                    className="!rounded-md xl:w-[100px] xl:!mt-2"
                    type="primary"
                    size="medium"
                    ghost
                    disabled={disabledExtendBtn}
                    onClick={() => {
                      onExtend?.(data);
                    }}
                  >
                    Extend
                  </Button>
                </ToolTip>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
