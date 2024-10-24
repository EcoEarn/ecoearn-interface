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
import {
  IApproveParams,
  IGetAllowanceParams,
  IGetAllowanceResponse,
  IGetBalanceParams,
} from './type';
import { checkLoginSuccess } from 'utils/loginUtils';

const multiTokenContractRequest = async <T, R>(
  method: string,
  params: T,
  options?: IContractOptions,
): Promise<R | ISendResult> => {
  const info = store.getState().info.cmsInfo;

  const addressList = {
    main: '',
    side: info?.multiTokenContractAddress,
  };

  try {
    const address = (options?.chain === SupportedELFChainId.MAIN_NET
      ? addressList.main
      : addressList.side) as unknown as string;
    const curChain: Chain = options?.chain || info!.curChain;

    console.log('=====multiTokenContractRequest type: ', method, options?.type);
    console.log('=====multiTokenContractRequest address: ', method, address);
    console.log('=====multiTokenContractRequest curChain: ', method, curChain);
    console.log('=====multiTokenContractRequest params: ', method, params);

    if (options?.type === ContractMethodType.VIEW) {
      const res: { data: R } = await webLoginInstance.callViewMethod(curChain, {
        contractAddress: address,
        methodName: method,
        args: params,
      });

      console.log('=====multiTokenContractRequest res: ', method, res.data);

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

      console.log('=====multiTokenContractRequest res: ', method, res);

      const result = res as unknown as IContractError;

      console.log(
        '=====multiTokenContractRequest result: ',
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

      console.log('=====multiTokenContractRequest transaction: ', method, transaction);

      return Promise.resolve({
        TransactionId: transaction.TransactionId,
        TransactionResult: transaction.txResult,
      });
    }
  } catch (error) {
    console.error('=====multiTokenContractRequest error: ', method, JSON.stringify(error), error);
    const resError = error as IContractError;
    return Promise.reject(formatErrorMsg(resError, method));
  }
};

export const GetBalance = async (
  params: IGetBalanceParams,
  options?: IContractOptions,
): Promise<{ balance: number }> => {
  try {
    const res = (await multiTokenContractRequest('GetBalance', params, {
      ...options,
      type: ContractMethodType.VIEW,
    })) as { balance: number };
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const GetAllowance = async (
  params: IGetAllowanceParams,
  options?: IContractOptions,
): Promise<any> => {
  try {
    const res = (await multiTokenContractRequest('GetAllowance', params, {
      ...options,
      type: ContractMethodType.VIEW,
    })) as IGetAllowanceResponse & IContractError;
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const Approve = async (params: IApproveParams, options?: IContractOptions): Promise<any> => {
  try {
    const networkType = store?.getState()?.info?.cmsInfo?.networkTypeV2;
    const res = (await multiTokenContractRequest(
      'Approve',
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
