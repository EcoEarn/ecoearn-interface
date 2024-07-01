import { webLoginInstance } from './webLogin';
import { formatErrorMsg } from 'utils/formatError';
import {
  ContractMethodType,
  IContractError,
  IContractOptions,
  ISendResult,
  SupportedELFChainId,
} from 'types';
import { store } from 'redux/store';
import { getTxResultRetry } from 'utils/getTxResult';
import { sleep } from '@portkey/utils';
import { IGetRewardResult } from './type';

const tokenStakingContractRequest = async <T, R>(
  method: string,
  params: T,
  options?: IContractOptions,
): Promise<R | ISendResult> => {
  const info = store.getState().info.cmsInfo;

  const addressList = {
    main: '',
    side: info?.tokensContractAddress,
  };

  try {
    const address = (options?.chain === SupportedELFChainId.MAIN_NET
      ? addressList.main
      : addressList.side) as unknown as string;
    const curChain: Chain = options?.chain || info!.curChain;

    console.log('=====tokenStakingContractRequest type: ', method, options?.type);
    console.log('=====tokenStakingContractRequest address: ', method, address);
    console.log('=====tokenStakingContractRequest curChain: ', method, curChain);
    console.log('=====tokenStakingContractRequest params: ', method, params);

    if (options?.type === ContractMethodType.VIEW) {
      const res: R = await webLoginInstance.callViewMethod(curChain, {
        contractAddress: address,
        methodName: method,
        args: params,
      });

      console.log('=====tokenStakingContractRequest res: ', method, res);

      const result = res as unknown as IContractError;
      if (result?.error || result?.code || result?.Error) {
        return Promise.reject(formatErrorMsg(result, method));
      }

      return Promise.resolve(res);
    } else {
      const res: R = await webLoginInstance.callSendMethod(curChain, {
        contractAddress: address,
        methodName: method,
        args: params,
      });

      console.log('=====tokenStakingContractRequest res: ', method, res);

      const result = res as unknown as IContractError;

      console.log(
        '=====tokenStakingContractRequest result: ',
        method,
        JSON.stringify(result),
        result?.Error,
      );

      if (result?.error || result?.code || result?.Error) {
        return Promise.reject(formatErrorMsg(result, method));
      }

      const { transactionId, TransactionId } = result.result || result;
      const resTransactionId = TransactionId || transactionId;
      await sleep(1000);
      const transaction = await getTxResultRetry({
        TransactionId: resTransactionId!,
        chainId: info!.curChain,
      });

      console.log('=====tokenStakingContractRequest transaction: ', method, transaction);

      return Promise.resolve({
        TransactionId: transaction.TransactionId,
        TransactionResult: transaction.txResult,
      });
    }
  } catch (error) {
    console.error('=====tokenStakingContractRequest error: ', method, JSON.stringify(error), error);
    const resError = error as IContractError;
    return Promise.reject(formatErrorMsg(resError, method));
  }
};

export const tokenStake = async (
  params: {
    poolId: string;
    amount?: number | string;
    period?: number | string;
  },
  options?: IContractOptions,
): Promise<ISendResult> => await tokenStakingContractRequest('Stake', params, options);

export const Renew = async (
  params: {
    poolId: string;
    period?: number | string;
  },
  options?: IContractOptions,
): Promise<ISendResult> => await tokenStakingContractRequest('Renew', params, options);

export const tokenClaim = async (
  params: string,
  options?: IContractOptions,
): Promise<ISendResult> => await tokenStakingContractRequest('Claim', params, options);

export const tokenUnlock = async (
  params: string,
  options?: IContractOptions,
): Promise<ISendResult> => await tokenStakingContractRequest('Unlock', params, options);

export const tokenWithdraw = async (
  params: { claimIds: Array<number | string> },
  options?: IContractOptions,
): Promise<ISendResult> => await tokenStakingContractRequest('Withdraw', params, options);

export const GetReward = async (
  params: {
    stakeIds: Array<string>;
  },
  options?: IContractOptions,
): Promise<IGetRewardResult> =>
  (await tokenStakingContractRequest('GetReward', params, {
    ...options,
    type: ContractMethodType.VIEW,
  })) as IGetRewardResult;
