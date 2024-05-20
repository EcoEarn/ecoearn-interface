import { ICMSInfo } from 'redux/types/reducerTypes';
import request, { cmsRequest, tokenRequest } from './axios';
import qs from 'qs';

export const fetchToken = async (data: ITokenParams) => {
  return tokenRequest.post<
    ITokenParams,
    {
      access_token: string;
      expires_in: number;
    }
  >('/token', qs.stringify(data) as any);
};

export const fetchStackingPoolsData = async (
  data: IFetchStakeParams,
): Promise<Array<IStakePoolData>> => {
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

export const getEarlyStakeInfo = async (data: {
  tokenName: string;
  address: string;
  chainId: Chain;
}): Promise<IEarlyStakeInfo> => {
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
