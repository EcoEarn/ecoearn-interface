import { PoolType } from 'types/stake';
import { getTargetUnlockTimeStamp } from './calculate';

export default function getBalanceTip(poolTye: PoolType) {
  const poolTypeName: Partial<Record<PoolType, string>> = {
    [PoolType.POINTS]: 'Points staking',
    [PoolType.TOKEN]: 'Simple staking',
    [PoolType.LP]: 'Farms(LP staking)',
  };
  return `It is the amount of earned rewards (frozen & withdrawable) in EcoEarn ${poolTypeName[poolTye]}`;
}

export function fixEarlyStakeData(data: IEarlyStakeInfo | Array<IEarlyStakeInfo>) {
  if (Array.isArray(data)) {
    return data.map((earlyStakeData) => {
      return {
        ...earlyStakeData,
        unlockTime: getTargetUnlockTimeStamp(
          earlyStakeData?.stakingPeriod || 0,
          earlyStakeData?.lastOperationTime || 0,
          earlyStakeData?.unlockWindowDuration || 0,
        ).unlockTime,
      };
    });
  }
  return {
    ...data,
    unlockTime: getTargetUnlockTimeStamp(
      data?.stakingPeriod || 0,
      data?.lastOperationTime || 0,
      data?.unlockWindowDuration || 0,
    ).unlockTime,
  };
}
