export interface IClaimParams {
  pool_id: string;
  account: string;
  amount: number;
  seed: string;
  signature: string;
}

export interface IEarlyStakeParams {
  poolId: number | string;
  period: number;
  claimIds: Array<number | string>;
}

export interface ICParams {
  claim_ids: Array<number>;
}

export interface IWithdrawParams {
  claim_ids: Array<number | string>;
}

export interface IGetRewardResult {
  rewardInfos: Array<{
    stake_id: number;
    address: string;
    symbol: string;
    amount: number;
  }>;
}

export interface IGetBalanceParams {
  symbol: string;
  owner: string;
}

export interface IGetAllowanceParams {
  symbol: string;
  owner: string;
  spender: string;
}

export interface IGetAllowanceResponse {
  symbol: string;
  owner: string;
  spender: string;
  allowance: number;
}

export interface IGetLpAllowanceResponse {
  symbol: string;
  owner: string;
  spender: string;
  amount: number;
}

export interface IApproveParams {
  spender: string;
  symbol: string;
  amount: number;
}
