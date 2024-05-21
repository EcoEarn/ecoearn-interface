interface ITokenParams {
  grant_type: string;
  scope: string;
  client_id: string;
  pubkey?: string;
  version?: string;
  signature?: string;
  timestamp?: number;
  accountInfo?: Array<{ chainId: string; address: string }>;
  source: string;
}

interface IStakePoolData {
  icons?: Array<string>;
  poolName?: string;
  poolId?: string;
  stakeId?: string | number;
  projectOwner?: string;
  aprMin?: string | number;
  aprMax?: string | number;
  earnedSymbol?: string;
  totalStake?: string | number;
  totalStakeInUsd?: string | number;
  stakeSymbol?: string;
  earned?: string | number;
  earnedInUsd?: string | number;
  staked?: string;
  stakedTime?: number;
  period?: number;
  yearlyRewards?: number;
  stakedInUsD?: string | number;
  unlockTime?: number | string;
  stakeApr?: string | number;
  stakedAmount?: string;
  earlyStakedAmount?: string;
  staked?: string;
  stakedInUsD?: string;
  decimal?: number;
  rate?: number | string;
  fixedBoostFactor?: number | string;
}

type TStackPoolDataKey = keyof IStakePoolData;
interface IStakingItem {
  dappName: string;
  icon: string;
  tvl: string;
  stakingAddress: number;
  isOpenStake: boolean;
  projectOwner: string;
}

interface IPointsPoolParams {
  type: string;
  sorting: string;
  name: string;
  skipCount: number;
  maxResultCount: number;
  address: string;
}

interface IPointsPoolItem {
  poolId: string | number;
  poolName: string;
  dailyRewards: number;
  poolDailyRewards: number;
  totalStake: number;
  earned: number;
  symbolName: string;
  staked: number;
  decimal: number;
  rewardsTokenName: string;
}

interface IStakingClaimParams {
  amount: number;
  poolId: string;
  address: string;
}

interface ICreateTradeParams {
  rawTransaction: string;
  chainId: Chain;
}

interface IPoolRewardsData {
  pointsPoolAgg: {
    total: number;
    totalInUsd: number;
    rewardsTotal: number;
    rewardsTotalInUsd: number;
    rewardsTokenName: string;
    decimal: number;
    stakeClaimIds: Array<string>;
    withDrawClaimIds: Array<string>;
  };
  tokenPoolAgg: {
    rewardsTotal: number;
    rewardsTotalInUsd: number;
    rewardsTokenName: string;
    decimal: number;
    withDrawClaimIds: Array<string>;
  };
  lpPoolAgg: {
    rewardsTotal: number;
    rewardsTotalInUsd: number;
    rewardsTokenName: string;
    decimal: number;
    withDrawClaimIds: Array<string>;
  };
}

interface IRewardListParams {
  poolType?: 'Points' | 'Token' | 'Lp' | 'All';
  skipCount: number;
  maxResultCount: number;
  filterUnlocked?: boolean;
  address: string;
}

interface IRewardListItem {
  poolType: string;
  projectOwner: string;
  rewardsToken: string;
  rewardsInUsd: number;
  rewards: number;
  claimId: number;
  tokenName: string;
  tokenIcon: Array<string>;
  date: number;
  lockUpPeriod: number;
  rewardsTokenDecimal: number;
}

interface IRewardListData {
  items: Array<IRewardListItem>;
  totalCount: number;
}

interface IEarlyStakeInfo {
  stakeSymbol: string;
  stakeId: string;
  staked: string;
  unlockTime: number;
  stakeApr: number;
  stakedTime: number;
  period: number;
  yearlyRewards: number;
  chainId: ChainId;
  poolId: string;
}

interface IFetchStakeParams {
  poolType: 'Token' | 'Lp';
  sorting: string;
  name: string;
  skipCount: number;
  maxResultCount: number;
  address: string;
  chainId: Chain;
}
