import { ICMSInfo } from 'redux/types/reducerTypes';
import request, { cmsRequest, tokenRequest } from './axios';
import qs from 'qs';
import { PoolType } from 'types/stake';
import { store } from 'redux/store';

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
}): Promise<ISendTransactionResult> => {
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

export const getPoolRewards = async (data: {
  address: string;
  poolType: PoolType;
}): Promise<Array<IPoolRewardsItem>> => {
  return request.post('/app/rewards/aggregation', data);
};

export const getRewardsList = async (data: IRewardListParams): Promise<IRewardListData> => {
  return request.post('/app/rewards/list', data);
};

export const getEarlyStakeInfo = async (
  data: IGetEarlyStakeInfoParams,
): Promise<Array<IEarlyStakeInfo>> => {
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
  const awakenUrl = store.getState()?.info?.cmsInfo?.awakenUrl || '';
  return request.get('/api/app/token/price', { params, baseURL: awakenUrl });
};

export const getSwapTransactionFee = async (): Promise<{ transactionFee: string }> => {
  const awakenUrl = store.getState()?.info?.cmsInfo?.awakenUrl || '';
  return request.get('/api/app/transaction-fee', { baseURL: awakenUrl });
};

export const earlyStakeSign = async (data: IEarlyStakeSignParams): Promise<IEarlyStakeSignData> => {
  return request.post('/app/rewards/early/stake/signature', data);
};

export const earlyStake = async (data: IEarlyStakeParams): Promise<ISendTransactionResult> => {
  return request.post('/app/rewards/early/stake', data);
};

export const withdrawSign = async (data: IWithdrawSignParams): Promise<IEarlyStakeSignData> => {
  return request.post('/app/rewards/withdraw/signature', data);
};

export const withdraw = async (data: IEarlyStakeParams): Promise<ISendTransactionResult> => {
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

export const addLiquidity = async (data: IAddLiquidityParams): Promise<ISendTransactionResult> => {
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

export const liquidityStake = async (
  data: IAddLiquidityParams,
): Promise<ISendTransactionResult> => {
  return request.post('/app/rewards/liquidity/stake', data);
};

export const liquidityRemoveSign = async (
  data: ILiquidityRemoveSignParams,
): Promise<IEarlyStakeSignData> => {
  return request.post('/app/rewards/remove/liquidity/signature', data);
};

export const liquidityRemove = async (
  data: IAddLiquidityParams,
): Promise<ISendTransactionResult> => {
  return request.post('/app/rewards/remove/liquidity', data);
};

export const getRewardsType = async (): Promise<any> => {
  return request.get('/app/rewards/filter/items');
};

export const saveTransaction = async (data: ISaveTransactionParams): Promise<any> => {
  return request.post('/app/rewards/transaction/record', data);
};

export const getLeaderboardInfo = async (
  data: ILeaderBoardParams,
): Promise<ILeaderBoardListData> => {
  return request.post('/app/ranking/list', data);
};

export const checkJoinStatus = async (params: IUseJoin): Promise<any> => {
  return request.get('/app/ranking/join/check', { params: params });
};
