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

interface IStakeInfoItem {
  stakeId?: string | number;
  earned?: string | number;
  earnedInUsd?: string | number;
  staked?: string;
  stakedInUsD?: string;
  unlockTime?: number | string;
  stakeApr?: string | number;
  stakedAmount?: string;
  earlyStakedAmount?: string;
  stakedTime?: number;
  period?: number;
  boostedAmount?: number | string;
  decimal?: number;
  stakingPeriod?: number | string;
  lastOperationTime?: number | string;
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
  unlockWindowDuration?: number | string;
  boostedAmount?: number | string;
  stakingPeriod?: number | string;
  releasePeriod?: number | string;
  lastOperationTime?: number | string;
  minimumClaimAmount?: number | string;
  stakeInfos?: Array<IStakeInfoItem>;
  latestClaimTime?: string | number;
  usdRate?: number | string;
  longestReleaseTime?: number | string;
}

type TStakePoolDataKey = keyof IStakePoolData;
interface IStakingItem {
  dappName: string;
  icon: string;
  tvl: string;
  stakingAddress: number;
  isOpenStake: boolean;
  projectOwner: string;
}

interface IChildTextNode {
  textWord: string;
  ChildTextNodes: IChildTextNode;
}

interface IRenewText {
  textWord: string;
  childTextNodes: Array<IChildTextNode>;
}

interface IStakingPoolResult {
  pools: Array<IStakePoolData>;
  textNodes: Array<IRenewText>;
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
  realEarned: number | string;
  symbolName: string;
  staked: number;
  decimal: number;
  rewardsTokenName: string;
  stakeTokenName: string;
  releasePeriod: number;
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
  dappId: string;
  pointsPoolAgg: {
    claimInfos: Array<{
      claimId: string;
      releaseTime: number;
    }>;
    withdrawableClaimInfos: Array<{
      claimId: string;
      releaseTime: number;
    }>;
    totalRewards: string;
    totalRewardsInUsd: string;
    rewardsTokenName: string;
    decimal: string;
    withdrawn: string;
    withdrawnInUsd: string;
    frozen: string;
    frozenInUsd: string;
    withdrawable: string;
    withdrawableInUsd: string;
    earlyStakedAmount: string;
    earlyStakedAmountInUsd: string;
    nextRewardsRelease: number;
    nextRewardsReleaseAmount: string;
    allRewardsRelease: boolean;
  };
  tokenPoolAgg: {
    claimInfos: Array<{
      claimId: string;
      releaseTime: number;
    }>;
    withdrawableClaimInfos: Array<{
      claimId: string;
      releaseTime: number;
    }>;
    totalRewards: string;
    totalRewardsInUsd: string;
    rewardsTokenName: string;
    decimal: string;
    withdrawn: string;
    withdrawnInUsd: string;
    frozen: string;
    frozenInUsd: string;
    withdrawable: string;
    withdrawableInUsd: string;
    earlyStakedAmount: string;
    earlyStakedAmountInUsd: string;
    nextRewardsRelease: number;
    nextRewardsReleaseAmount: string;
    allRewardsRelease: boolean;
  };
  lpPoolAgg: {
    claimInfos: Array<{
      claimId: string;
      releaseTime: number;
    }>;
    withdrawableClaimInfos: Array<{
      claimId: string;
      releaseTime: number;
    }>;
    totalRewards: string;
    totalRewardsInUsd: string;
    rewardsTokenName: string;
    decimal: string;
    withdrawn: string;
    withdrawnInUsd: string;
    frozen: string;
    frozenInUsd: string;
    withdrawable: string;
    withdrawableInUsd: string;
    earlyStakedAmount: string;
    earlyStakedAmountInUsd: string;
    nextRewardsRelease: number;
    nextRewardsReleaseAmount: string;
    allRewardsRelease: boolean;
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

interface IGetEarlyStakeInfoParams {
  tokenName: string;
  address: string;
  chainId: Chain;
  poolType: PoolType;
  rate: string | number;
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
  fixedBoostFactor?: number | string;
  unlockWindowDuration?: number | string;
  stakingPeriod?: number | string;
  lastOperationTime?: number | string;
  subStakeInfos: Array<IStakeInfoItem>;
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

interface IGetUsdPriceParams {
  chainId: ChainId;
  TokenAddress: string;
  Symbol: string;
}

interface IEarlyStakeSignParams {
  amount: number;
  poolType: import('types/stake').PoolType;
  address: string;
  claimInfos: Array<{
    claimId: string;
    releaseTime: number;
  }>;
  dappId: string;
  poolId: string;
  period: number;
}

interface IWithdrawSignParams {
  amount: number;
  poolType: import('types/stake').PoolType;
  address: string;
  claimInfos: Array<{
    claimId: string;
    releaseTime: number;
  }>;
  dappId: string;
}

interface IEarlyStakeSignData {
  signature: string;
  seed: Array<number>;
  expirationTime: number;
}

interface IEarlyStakeParams {
  chainId: ChainId;
  rawTransaction: string;
}

interface ILiquidityItem {
  banlance: string | number;
  decimal: number;
  icons: Array<string>;
  lpSymbol: string;
  rate: number | string;
  tokenAAmount: string | number;
  tokenASymbol: string;
  tokenBAmount: string | number;
  tokenBSymbol: string;
  value: string | number;
  liquidityIds: Array<any>;
  usdDecimal: number;
  ecoEarnBanlance?: string;
  ecoEarnTokenAAmount?: string;
  ecoEarnTokenBAmount?: string;
  lpAmount?: string;
}

interface IAddLiquidityParams {
  chainId: Chain;
  rawTransaction: string;
}

interface IAddLiquiditySignParams {
  amount: string | number;
  poolType: string;
  address: string;
  dappId: string;
  claimInfos: Array<{ claimId: string; releaseTime: string | number }>;
  poolId: string | number;
  period: number;
  tokenAMin: string | number;
  tokenBMin: string | number;
}

interface ILiquidityStakeSignParams {
  lpAmount: string | number;
  poolId: string | number;
  period: number;
  address: string;
  dappId: string;
  liquidityIds: Array<any>;
}

interface ILiquidityRemoveSignParams {
  lpAmount: string | number;
  address: string;
  dappId: string;
  tokenAMin: string | number;
  tokenBMin: string | number;
  liquidityIds: Array<any>;
}
