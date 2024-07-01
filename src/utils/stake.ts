import { PoolType } from 'types/stake';

export default function getBalanceTip(poolTye: PoolType) {
  const poolTypeName = {
    [PoolType.POINTS]: 'Points staking',
    [PoolType.TOKEN]: 'Simple staking',
    [PoolType.LP]: 'Farms(LP staking)',
  };
  return `It is the amount of earned rewards (frozen & withdrawable) in EcoEarn ${poolTypeName[poolTye]}`;
}
