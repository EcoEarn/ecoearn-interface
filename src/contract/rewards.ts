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
import { checkLoginSuccess } from 'utils/loginUtils';

const rewardsContractRequest = async <T, R>(
  method: string,
  params: T,
  options?: IContractOptions,
): Promise<R | ISendResult> => {
  const info = store.getState().info.cmsInfo;

  const addressList = {
    main: '',
    side: info?.rewardsContractAddress,
  };

  try {
    const address = (options?.chain === SupportedELFChainId.MAIN_NET
      ? addressList.main
      : addressList.side) as unknown as string;
    const curChain: Chain = options?.chain || info!.curChain;

    console.log('=====rewardsContractRequest type: ', method, options?.type);
    console.log('=====rewardsContractRequest address: ', method, address);
    console.log('=====rewardsContractRequest curChain: ', method, curChain);
    console.log('=====rewardsContractRequest params: ', method, params);

    if (options?.type === ContractMethodType.VIEW) {
      const res: { data: R } = await webLoginInstance.callViewMethod(curChain, {
        contractAddress: address,
        methodName: method,
        args: params,
      });

      console.log('=====rewardsContractRequest res: ', method, res.data);

      const result = res.data as unknown as IContractError;
      if (result?.error || result?.code || result?.Error) {
        return Promise.reject(formatErrorMsg(result, method));
      }

      return Promise.resolve(res.data);
    } else {
      if (!checkLoginSuccess()) return Promise.reject();
      const res: R = await webLoginInstance.callSendMethod(curChain, {
        contractAddress: address,
        methodName: method,
        args: params,
      });

      console.log('=====rewardsContractRequest res: ', method, res);

      const result = res as unknown as IContractError;

      console.log(
        '=====rewardsContractRequest result: ',
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

      console.log('=====rewardsContractRequest transaction: ', method, transaction);

      return Promise.resolve({
        TransactionId: transaction.TransactionId,
        TransactionResult: transaction.txResult,
      });
    }
  } catch (error) {
    console.error('=====rewardsContractRequest error: ', method, JSON.stringify(error), error);
    const resError = error as IContractError;
    return Promise.reject(formatErrorMsg(resError, method));
  }
};

export const removeLiquidity = async (
  params: {
    liquidityIds: Array<number | string>;
    tokenAMin: string | number;
    tokenBMin: string | number;
    deadline: {
      seconds: number;
      nanos: number;
    };
    dappId: string | number;
  },
  options?: IContractOptions,
): Promise<ISendResult> => await rewardsContractRequest('RemoveLiquidity', params, options);

export const StakeLiquidity = async (
  params: {
    liquidityIds: Array<number | string>;
    poolId: string | number;
    period: number;
    dappId: string | number;
    lpAmount: string | number;
    longestReleaseTime: string | number;
  },
  options?: IContractOptions,
): Promise<ISendResult> => await rewardsContractRequest('StakeLiquidity', params, options);

export const Join = async (
  params: {
    domain: string;
  },
  options?: IContractOptions,
): Promise<IContractError> => {
  try {
    const res = (await rewardsContractRequest('Join', params, options)) as IContractError;
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const AcceptReferral = async (
  params: {
    referrer: string;
  },
  options?: IContractOptions,
): Promise<IContractError> => {
  try {
    const res = (await rewardsContractRequest('AcceptReferral', params, options)) as IContractError;
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};
