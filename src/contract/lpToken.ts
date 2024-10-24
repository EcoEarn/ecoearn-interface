import { webLoginInstance } from './webLogin';
import { formatErrorMsg } from 'utils/formatError';
import {
  ContractMethodType,
  IContractError,
  IContractOptions,
  ISendResult,
  ISwapContractResult,
  SupportedELFChainId,
} from 'types';
import { store } from 'redux/store';
import { getTxResultRetry } from 'utils/getTxResult';
import { sleep } from '@portkey/utils';
import {
  IApproveParams,
  IGetAllowanceParams,
  IGetAllowanceResponse,
  IGetBalanceParams,
  IGetLpAllowanceResponse,
} from './type';
import { checkLoginSuccess } from 'utils/loginUtils';

const lpTokenContractRequest = async <T, R>(
  method: string,
  contractAddress: string,
  params: T,
  options?: IContractOptions,
): Promise<R | ISendResult> => {
  const info = store.getState().info.cmsInfo;

  try {
    const address = contractAddress;
    const curChain: Chain = options?.chain || info!.curChain;

    console.log('=====lpTokenContractRequest type: ', method, options?.type);
    console.log('=====lpTokenContractRequest address: ', method, address);
    console.log('=====lpTokenContractRequest curChain: ', method, curChain);
    console.log('=====lpTokenContractRequest params: ', method, params);

    if (options?.type === ContractMethodType.VIEW) {
      const res: { data: R } = await webLoginInstance.callViewMethod(curChain, {
        contractAddress: address,
        methodName: method,
        args: params,
      });

      console.log('=====lpTokenContractRequest res: ', method, res.data);

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

      console.log('=====lpTokenContractRequest res: ', method, res);

      const result = res as unknown as IContractError;

      console.log(
        '=====lpTokenContractRequest result: ',
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

      console.log('=====lpTokenContractRequest transaction: ', method, transaction);

      return Promise.resolve({
        TransactionId: transaction.TransactionId,
        TransactionResult: transaction.txResult,
      });
    }
  } catch (error) {
    console.error('=====lpTokenContractRequest error: ', method, JSON.stringify(error), error);
    const resError = error as IContractError;
    return Promise.reject(formatErrorMsg(resError, method));
  }
};

export const GetBalance = async (
  params: IGetBalanceParams,
  contractAddress: string,
  options?: IContractOptions,
): Promise<{ amount: number; balance: number } & IContractError> => {
  try {
    const res = (await lpTokenContractRequest('GetBalance', contractAddress, params, {
      ...options,
      type: ContractMethodType.VIEW,
    })) as { amount: number; balance: number } & IContractError;
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const GetAllowance = async (
  params: IGetAllowanceParams,
  contractAddress: string,
  options?: IContractOptions,
): Promise<IGetLpAllowanceResponse & IContractError> => {
  try {
    const res = (await lpTokenContractRequest('GetAllowance', contractAddress, params, {
      ...options,
      type: ContractMethodType.VIEW,
    })) as IGetLpAllowanceResponse & IContractError;
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const Approve = async (
  params: IApproveParams,
  contractAddress: string,
  options?: IContractOptions,
): Promise<any> => {
  try {
    const networkType = store?.getState()?.info?.cmsInfo?.networkTypeV2;
    const res = (await lpTokenContractRequest(
      'Approve',
      contractAddress,
      { ...params, networkType },
      {
        ...options,
      },
    )) as any;
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const GetReserves = async (
  params: any,
  contractAddress: string,
  options?: IContractOptions,
): Promise<ISwapContractResult & IContractError> => {
  try {
    const res = (await lpTokenContractRequest('GetReserves', contractAddress, params, {
      ...options,
      type: ContractMethodType.VIEW,
    })) as ISwapContractResult & IContractError;
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const GetTotalSupply = async (
  params: any,
  contractAddress: string,
  options?: IContractOptions,
): Promise<ISwapContractResult & IContractError> => {
  try {
    const res = (await lpTokenContractRequest('GetTotalSupply', contractAddress, params, {
      ...options,
      type: ContractMethodType.VIEW,
    })) as ISwapContractResult & IContractError;
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const GetTokenInfo = async (
  params: any,
  contractAddress: string,
  options?: IContractOptions,
): Promise<{ supply: string } & IContractError> => {
  try {
    const res = (await lpTokenContractRequest('GetTokenInfo', contractAddress, params, {
      ...options,
      type: ContractMethodType.VIEW,
    })) as { supply: string } & IContractError;
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};
