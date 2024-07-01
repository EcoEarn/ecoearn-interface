import { ICMSInfo } from 'redux/types/reducerTypes';
import request, { awakenRequest, cmsRequest, tokenRequest } from './axios';
import qs from 'qs';
import { PoolType } from 'types/stake';

export const fetchToken = async (data: ITokenParams) => {
  return tokenRequest.post<
    ITokenParams,
    {
      access_token: string;
      expires_in: number;
    }
  >('/token', qs.stringify(data) as any);
};

export const fetchStakingPoolsData = async (
  data: IFetchStakeParams,
): Promise<IStakingPoolResult> => {
  return request.post('/app/simple/staking/pools', data);
};

export const getStakingItems = async (): Promise<Array<IStakingItem>> => {
  return request.get('/app/points/staking/items');
};

export const getPointsPoolList = async (
  data: IPointsPoolParams,
): Promise<Array<IPointsPoolItem>> => {
  return request.post('/app/points/staking/pools', data);
};

export const stakingClaim = async (
  data: IStakingClaimParams,
): Promise<{
  signature: Array<string>;
  seed: string;
  expirationTime: {
    seconds: number;
    nanos: number;
  };
}> => {
  return request.post('/app/points/staking/claim/signature', data);
};

export const pointsClaim = async (data: {
  rawTransaction: string;
  chainId: Chain;
}): Promise<string> => {
  return request.post('/app/points/staking/claim', data);
};

export const pointsStakingWithdraw = async (data: ICreateTradeParams): Promise<string> => {
  return request.post('/app/points/staking/withdraw', data);
};

export const simpleStakingWithdraw = async (data: ICreateTradeParams): Promise<string> => {
  return request.post('/app/simple/staking/withdraw', data);
};

export const pointsStakingState = async (data: ICreateTradeParams): Promise<string> => {
  return request.post('/app/points/staking/stake', data);
};

export const getPoolRewards = async (data: { address: string }): Promise<IPoolRewardsData> => {
  return request.post('/app/rewards/aggregation', data);
};

export const getRewardsList = async (data: IRewardListParams): Promise<IRewardListData> => {
  return request.post('/app/rewards/list', data);
};

export const getEarlyStakeInfo = async (
  data: IGetEarlyStakeInfoParams,
): Promise<IEarlyStakeInfo> => {
  return request.post('/app/points/staking/early/stake/info', data);
};

export const getPoolTotalStaked = async (data: {
  poolId: string;
  chainId: string;
}): Promise<number> => {
  return request.post('/app/simple/staking/staked/sum', data);
};

export const getCmsInfo = async (): Promise<{ data: ICMSInfo }> => {
  return cmsRequest.get('/items/config');
};

export const getTokenPrice = async (params: IGetUsdPriceParams): Promise<string> => {
  return awakenRequest.get('/api/app/token/price', { params });
};

export const getSwapTransactionFee = async (): Promise<{ transactionFee: string }> => {
  return awakenRequest.get('/api/app/transaction-fee');
};

export const earlyStakeSign = async (data: IEarlyStakeSignParams): Promise<IEarlyStakeSignData> => {
  return request.post('/app/rewards/early/stake/signature', data);
};

export const earlyStake = async (data: IEarlyStakeParams): Promise<string> => {
  return request.post('/app/rewards/early/stake', data);
};

export const withdrawSign = async (data: IWithdrawSignParams): Promise<IEarlyStakeSignData> => {
  return request.post('/app/rewards/withdraw/signature', data);
};

export const withdraw = async (data: IEarlyStakeParams): Promise<string> => {
  return request.post('/app/rewards/withdraw', data);
};

export const myLiquidity = async (data: { address: string }): Promise<Array<ILiquidityItem>> => {
  return request.post('/app/farm/my/liquidity', data);
};

export const liquidityMarket = async (data: {
  address: string;
}): Promise<Array<ILiquidityItem>> => {
  return request.post('/app/farm/market', data);
};

export const addLiquiditySign = async (
  data: IAddLiquiditySignParams,
): Promise<IEarlyStakeSignData> => {
  return request.post('/app/rewards/add/liquidity/signature', data);
};

export const addLiquidity = async (data: IAddLiquidityParams): Promise<string> => {
  return request.post('/app/rewards/add/liquidity', data);
};

export const cancelSign = async (data: any): Promise<any> => {
  return request.post('/app/rewards/cancel/signature', data);
};

export const liquidityStakeSign = async (
  data: ILiquidityStakeSignParams,
): Promise<IEarlyStakeSignData> => {
  return request.post('/app/rewards/liquidity/stake/signature', data);
};

export const liquidityStake = async (data: IAddLiquidityParams): Promise<string> => {
  return request.post('/app/rewards/liquidity/stake', data);
};

export const liquidityRemoveSign = async (
  data: ILiquidityRemoveSignParams,
): Promise<IEarlyStakeSignData> => {
  return request.post('/app/rewards/remove/liquidity/signature', data);
};

export const liquidityRemove = async (data: IAddLiquidityParams): Promise<string> => {
  return request.post('/app/rewards/remove/liquidity', data);
};
