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
import { IClaimParams, IEarlyStakeParams, IWithdrawParams } from './type';

const pointsStakingContractRequest = async <T, R>(
  method: string,
  params: T,
  options?: IContractOptions,
): Promise<R | ISendResult> => {
  const info = store.getState().info.cmsInfo;

  const addressList = {
    main: '',
    side: info?.pointsContractAddress,
  };

  try {
    const address = (options?.chain === SupportedELFChainId.MAIN_NET
      ? addressList.main
      : addressList.side) as unknown as string;
    const curChain: Chain = options?.chain || info!.curChain;

    console.log('=====pointsStakingContractRequest type: ', method, options?.type);
    console.log('=====pointsStakingContractRequest address: ', method, address);
    console.log('=====pointsStakingContractRequest curChain: ', method, curChain);
    console.log('=====pointsStakingContractRequest params: ', method, params);

    if (options?.type === ContractMethodType.VIEW) {
      const res: { data: R } = await webLoginInstance.callViewMethod(curChain, {
        contractAddress: address,
        methodName: method,
        args: params,
      });

      console.log('=====pointsStakingContractRequest res: ', method, res.data);

      const result = res.data as unknown as IContractError;
      if (result?.error || result?.code || result?.Error) {
        return Promise.reject(formatErrorMsg(result, method));
      }

      return Promise.resolve(res.data);
    } else {
      const res: R = await webLoginInstance.callSendMethod(curChain, {
        contractAddress: address,
        methodName: method,
        args: params,
      });

      console.log('=====pointsStakingContractRequest res: ', method, res);

      const result = res as unknown as IContractError;

      console.log(
        '=====pointsStakingContractRequest result: ',
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

      console.log('=====pointsStakingContractRequest transaction: ', method, transaction);

      return Promise.resolve({
        TransactionId: transaction.TransactionId,
        TransactionResult: transaction.txResult,
      });
    }
  } catch (error) {
    console.error(
      '=====pointsStakingContractRequest error: ',
      method,
      JSON.stringify(error),
      error,
    );
    const resError = error as IContractError;
    return Promise.reject(formatErrorMsg(resError, method));
  }
};

export const Claim = async (
  params: IClaimParams,
  options?: IContractOptions,
): Promise<ISendResult> => await pointsStakingContractRequest('Claim', params, options);

export const EarlyStake = async (
  params: IEarlyStakeParams,
  options?: IContractOptions,
): Promise<ISendResult> => await pointsStakingContractRequest('EarlyStake', params, options);

export const Withdraw = async (
  params: { claimIds: Array<number | string> },
  options?: IContractOptions,
): Promise<ISendResult> => await pointsStakingContractRequest('Withdraw', params, options);
