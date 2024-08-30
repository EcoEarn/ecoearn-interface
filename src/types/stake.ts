export enum StakeType {
  STAKE = 'stake',
  ADD = 'add',
  EXTEND = 'extend',
  RENEW = 'renew',
}

export enum PoolType {
  POINTS = 'Points',
  TOKEN = 'Token',
  LP = 'Lp',
  ALL = 'All',
}

export enum TransactionType {
  TokenStake = 'TokenStake',
  TokenAddStake = 'TokenAddStake',
  TokenStakeExtend = 'TokenStakeExtend',
  TokenStakeRenew = 'TokenStakeRenew',
  TokenStakeUnlock = 'TokenStakeUnlock',
  TokenClaim = 'TokenClaim',
  LpStake = 'LpStake',
  LpAddStake = 'LpAddStake',
  LpStakeExtend = 'LpStakeExtend',
  LpStakeRenew = 'LpStakeRenew',
  LpStakeUnlock = 'LpStakeUnlock',
  LpClaim = 'LpClaim',
}
