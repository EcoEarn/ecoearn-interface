import { useMemo } from 'react';
import { Button, ToolTip } from 'aelf-design';
import Description from 'components/StakeCardDescription';
import StakeToken, { PoolTypeEnum } from 'components/StakeToken';
import { ZERO } from 'constants/index';
import {
  formatNumber,
  formatNumberWithDecimalPlaces,
  formatTokenAmount,
  formatTokenSymbol,
  formatUSDPrice,
} from 'utils/format';
import styles from './style.module.css';
import dayjs from 'dayjs';
import BigNumber from 'bignumber.js';
import { divDecimals } from 'utils/calculate';
import { MAX_STAKE_PERIOD } from 'constants/stake';
import Renewal from 'components/Renewal';
import useUnlockCount from './hooks/useUnlockCount';
import TextEllipsis from 'components/TextEllipsis';

interface IStakeCardProps {
  type: PoolTypeEnum;
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

export default function StakeCard({
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
}: IStakeCardProps) {
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
    stakedInUsd,
    stakeApr,
    icons,
    decimal = 8,
    rate,
    unlockWindowDuration,
    stakingPeriod,
    lastOperationTime,
    minimumClaimAmount,
    latestClaimTime,
  } = data;

  const { countDisplay, isUnLocked, targetUnlockTimeStamp } = useUnlockCount({
    unlockWindowDuration: unlockWindowDuration || 0,
    stakingPeriod: stakingPeriod || 0,
    lastOperationTime: lastOperationTime || 0,
  });

  const showStakeInfo = useMemo(
    () => !BigNumber(data?.staked || '').isZero() && isLogin,
    [data?.staked, isLogin],
  );

  const aprRange = useMemo(() => {
    if (!aprMin || !aprMax) return '--';
    return `${formatNumberWithDecimalPlaces(
      ZERO.plus(aprMin).times(100),
    )}% ~ ${formatNumberWithDecimalPlaces(ZERO.plus(aprMax).times(100))}%`;
  }, [aprMax, aprMin]);

  const isClaimed = useMemo(() => {
    return dayjs(latestClaimTime || 0).isAfter(targetUnlockTimeStamp);
  }, [latestClaimTime, targetUnlockTimeStamp]);

  const canClaim = useMemo(() => {
    if (isUnLocked && !isClaimed) {
      return ZERO.plus(divDecimals(earned, decimal)).gt(0);
    }
    return false;
  }, [decimal, earned, isClaimed, isUnLocked]);

  const claimBtnTip = useMemo(() => {
    if (isUnLocked) {
      return isClaimed ? 'Rewards will be claimed simultaneously upon unlocking.' : '';
    }
    return 'You cannot claim rewards during the lock-up period for staking.';
  }, [isClaimed, isUnLocked]);

  const unStakeTip = useMemo(
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
    return formatNumber(stakeAmount);
  }, [decimal, staked]);

  const disabledExtendBtn = useMemo(() => {
    const remainingDays = dayjs(targetUnlockTimeStamp).diff(dayjs(), 'hour') / 24;
    const canNotExtends = ZERO.plus(remainingDays || 0).gt(MAX_STAKE_PERIOD - 1);
    return isUnLocked || canNotExtends;
  }, [isUnLocked, targetUnlockTimeStamp]);

  const earnAmountText = useMemo(() => {
    return formatNumber(divDecimals(earned, decimal));
  }, [decimal, earned]);

  const displayEarnSymbol = useMemo(() => {
    return formatTokenSymbol(earnedSymbol || '');
  }, [earnedSymbol]);

  return (
    <div className="stake-card flex flex-col gap-6 px-4 py-6 md:gap-4 md:px-8 md:py-8 rounded-xl border border-solid border-neutralDivider bg-neutralWhiteBg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <StakeToken
          className="w-full lg:w-[350px]"
          type={type}
          icons={icons}
          rate={rate}
          tokenName={stakeSymbol}
          projectName={projectOwner || '--'}
          symbolDigs={12}
        />
        <Description
          className="w-full lg:w-[274px]"
          label="APR"
          value={aprRange}
          tip="It indicates APR range obtained based on the different staking cycles. A longer cycle will bring a higher APR."
        />
        <Description
          label="Earn"
          value={displayEarnSymbol || '--'}
          className="w-full lg:w-[140px]"
        />
        <Description
          className="w-full lg:w-[300px] items-start lg:items-end"
          label="Total Staked"
          valueTextAlign="right"
          value={formatNumberWithDecimalPlaces(divDecimals(totalStake, decimal))}
          extra={`${formatUSDPrice(divDecimals(totalStakeInUsd || 0, decimal))}`}
        />
      </div>

      {!showStakeInfo && (
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

      {showStakeInfo && isUnLocked !== null && (
        <div className="relative flex flex-col px-4 pt-10 pb-6 gap-6 md:flex-row md:justify-between bg-brandFooterBg md:px-8 md:py-8 lg:gap-8 rounded-xl">
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
              </div>
              <div className="flex flex-col gap-1 items-end md:items-start">
                <div className="text-base font-semibold text-neutralTitle flex items-center gap-1">
                  <span>{earnAmountText}</span>
                  <span>
                    <TextEllipsis text={displayEarnSymbol || ''} digits={10} />
                  </span>
                </div>
                <div className="text-sm font-medium text-neutralTitle">
                  {formatUSDPrice(divDecimals(earnedInUsd || 0, decimal))}
                </div>
              </div>
            </div>
            <ToolTip title={claimBtnTip} overlayStyle={{ maxWidth: 205 }}>
              <Button
                className="lg:w-[100px] !rounded-md xl:!mt-2"
                type="primary"
                ghost={canClaim}
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
          <div className="h-[1px] w-full md:w-[1px] md:h-[inherit] xl:h-[100px] bg-neutralDivider"></div>
          <div className="flex flex-1 flex-col xl:flex-row justify-between md:max-w-[336px] gap-6 md:gap-4">
            <div className="flex justify-between md:flex-col md:justify-start md:gap-2">
              <div className="text-base text-neutralSecondary font-medium">Staked</div>
              <div className="flex flex-col gap-1 items-end md:items-start">
                <div className="flex gap-1 text-base font-semibold text-neutralTitle flex-grow-0">
                  <ToolTip title="The number of rewards included">
                    <span>{stakedStr}</span>
                  </ToolTip>
                  <span>
                    <TextEllipsis text={formatTokenSymbol(stakeSymbol || '')} digits={10} />
                  </span>
                </div>
                <div className="text-sm font-medium text-neutralTitle">
                  {formatUSDPrice(divDecimals(stakedInUsd || 0, decimal))}
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
                  disabled={!!isUnLocked}
                >
                  Add
                </Button>
              </ToolTip>
              <ToolTip title={unStakeTip}>
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
          <div className="h-[1px] w-full md:w-[1px] md:h-[inherit] xl:h-[100px] bg-neutralDivider"></div>
          <div className="flex flex-1 flex-col gap-6 xl:flex-row md:gap-4 md:max-w-[336px] justify-between">
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
                    {!!targetUnlockTimeStamp && (
                      <div className="text-sm font-medium text-neutralDisable">
                        Unlock on {dayjs(targetUnlockTimeStamp).format('YYYY-MM-DD HH:mm')}
                      </div>
                    )}
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
