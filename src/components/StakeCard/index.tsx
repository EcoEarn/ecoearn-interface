import { useMemo } from 'react';
import { Button, ToolTip } from 'aelf-design';
import Description from 'components/StakeCardDescription';
import StakeToken, { PoolType } from 'components/StakeToken';
import { ZERO, DEFAULT_DATE_FORMAT } from 'constants/index';
import {
  formatNumber,
  formatNumberWithDecimalPlaces,
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
import { useRouter } from 'next/navigation';

import { ReactComponent as Lock } from 'assets/img/lock.svg';
import { ReactComponent as UnLock } from 'assets/img/unLock.svg';

interface IStakeCardProps {
  type: PoolType;
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

export default function StakeCard({ type, data, isLogin }: IStakeCardProps) {
  const {
    projectOwner,
    aprMax,
    aprMin,
    earnedSymbol,
    totalStakeInUsd,
    stakeSymbol,
    staked,
    icons,
    decimal = 8,
    rate,
    unlockWindowDuration,
    stakingPeriod,
    lastOperationTime,
  } = data;

  const { isUnLocked } = useUnlockCount({
    unlockWindowDuration: unlockWindowDuration || 0,
    stakingPeriod: stakingPeriod || 0,
    lastOperationTime: lastOperationTime || 0,
  });

  const router = useRouter();

  const showStakeInfo = useMemo(
    () => !BigNumber(data?.staked || '').isZero() && isLogin,
    [data?.staked, isLogin],
  );

  const aprRange = useMemo(() => {
    if (!aprMin || !aprMax) return '--';
    // return `${formatNumberWithDecimalPlaces(
    //   ZERO.plus(aprMin).times(100),
    // )}% ~ ${formatNumberWithDecimalPlaces(ZERO.plus(aprMax).times(100))}%`;
    return `Up to ${formatNumberWithDecimalPlaces(ZERO.plus(aprMax).times(100))}%`;
  }, [aprMax, aprMin]);

  const displayEarnSymbol = useMemo(() => {
    return formatTokenSymbol(earnedSymbol || '');
  }, [earnedSymbol]);

  return (
    <div className="stake-card px-4 py-4 md:px-8 md:py-8 rounded-xl border border-solid border-neutralDivider bg-neutralWhiteBg transition-all ease-in-out duration-300 hover:shadow-xl hover:ease hover:duration-300 group">
      <div className="flex !items-center justify-between lg:flex-row lg:items-start">
        <StakeToken
          type={type}
          icons={icons}
          rate={rate}
          tokenName={stakeSymbol}
          projectName={projectOwner || '--'}
          symbolDigs={12}
        />
        {showStakeInfo && typeof isUnLocked === 'boolean' && (
          <>
            {!isUnLocked ? (
              <div className="rounded-xl bg-brandDefaultOpacity text-brandDefault px-[8px] py-[2px] flex items-center justify-center text-[13px]">
                <Lock className="w-[14px] h-[14px] mb-0.5" />
                <span className="pl-[4px]">{`${formatNumberWithDecimalPlaces(
                  divDecimals(staked, decimal),
                )}`}</span>
                <span className="pl-[4px]">{`${formatTokenSymbol(stakeSymbol || '')}`}</span>
              </div>
            ) : (
              <div className="rounded-xl bg-brandDefaultGreenOpacity text-brandDefaultGreen px-[8px] py-[2px] flex items-center text-[13px]">
                <UnLock className="w-[14px] h-[14px] mb-0.5" />
                <span className="pl-[4px]">{`${formatNumberWithDecimalPlaces(
                  divDecimals(staked, decimal),
                )}`}</span>
                <span className="pl-[4px]">{`${formatTokenSymbol(stakeSymbol || '')}`}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="relative mt-[32px] lg:mt-[64px]">
        <div className="flex items-center gap-[20px] transition-all ease-in-out duration-300 opacity-1 lg:group-hover:opacity-0 ">
          <Description
            className="text-[12px] border-solid border-r border-y-0 border-l-0 border-neutralDivider pr-[20px]"
            label="APR"
            value={aprRange}
            tip="It indicates APR range obtained based on the different staking cycles. A longer cycle will bring a higher APR."
          />
          <Description
            className="border-solid border-r border-y-0 border-l-0 border-neutralDivider pr-[20px]"
            label="Staked (TVL)"
            // value={formatNumberWithDecimalPlaces(divDecimals(totalStake, decimal))}
            value={`${formatUSDPrice(divDecimals(totalStakeInUsd || 0, decimal), {
              decimalPlaces: 0,
            })}`}
          />
          <Description label="Earn" value={displayEarnSymbol || '--'} className="" />
        </div>
        <div className="w-full mt-[20px] lg:mt-0 lg:absolute -bottom-[20px] left-0 lg:opacity-0 transition-all ease-in-out duration-300 group-hover:bg-white group-hover:opacity-100 group-hover:bottom-0 group-hover:transition-all group-hover:ease-in-out group-hover:duration-300">
          <Button
            className="w-full !h-[40px] lg:self-center !rounded-lg m-auto"
            type="primary"
            onClick={() => {
              router.push(`/pool-detail?poolId=${data.poolId}&poolType=${type}`);
            }}
          >
            {!showStakeInfo ? 'Stake' : 'View details'}
          </Button>
        </div>
      </div>
    </div>
  );
}
