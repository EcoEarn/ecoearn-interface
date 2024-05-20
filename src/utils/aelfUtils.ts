import AElf from 'aelf-sdk';
import { Approve, GetAllowance } from 'contract/multiToken';
import { Approve as ApproveLp, GetAllowance as GetAllowanceLp } from 'contract/lpToken';
import { message } from 'antd';
import { DEFAULT_ERROR } from './formatError';
import { timesDecimals } from './calculate';
import BigNumber from 'bignumber.js';
import { IContractError } from 'types';
import { CONTRACT_AMOUNT } from 'constants/common';
import { MethodType, SentryMessageType, captureMessage } from './captureMessage';
import { IGetAllowanceResponse, IGetLpAllowanceResponse } from 'contract/type';

const httpProviders: any = {};
export function getAElf(rpcUrl?: string) {
  const rpc = rpcUrl || '';
  if (!httpProviders[rpc]) {
    httpProviders[rpc] = new AElf(new AElf.providers.HttpProvider(rpc));
  }
  return httpProviders[rpc];
}

const isNightElf = () => {
  const walletInfo = localStorage.getItem('wallet-info');
  const walletInfoObj = walletInfo ? JSON.parse(walletInfo) : {};
  let isNightElfStatus = true;
  if (walletInfoObj?.discoverInfo || walletInfoObj?.portkeyInfo) {
    isNightElfStatus = false;
  }

  return isNightElfStatus;
};

export const approve = async (
  spender: string,
  symbol: string,
  amount: string,
  chainId?: Chain,
  contractType?: 'Token' | 'Lp',
  contractAddress?: string,
) => {
  try {
    let approveResult;
    if (contractType === 'Lp') {
      approveResult = await ApproveLp(
        {
          spender: spender,
          symbol,
          amount: Number(amount),
        },
        contractAddress || '',
        {
          chain: chainId,
        },
      );
    } else {
      approveResult = await Approve(
        {
          spender: spender,
          symbol,
          amount: Number(amount),
        },
        {
          chain: chainId,
        },
      );
    }

    if (approveResult.error) {
      message.error(approveResult?.errorMessage?.message || DEFAULT_ERROR);
      captureMessage({
        type: SentryMessageType.CONTRACT,
        params: {
          name: 'approve',
          method: MethodType.CALLSENDMETHOD,
          query: {
            spender: spender,
            symbol,
            amount: Number(amount),
          },
          description: approveResult,
        },
      });
      return false;
    }

    // const { TransactionId } = approveResult.result || approveResult;

    // if (chainId) {
    //   await MessageTxToExplore(TransactionId!, chainId);
    // }

    return true;
  } catch (error) {
    const resError = error as unknown as IContractError;
    if (resError) {
      message.error(resError?.errorMessage?.message || DEFAULT_ERROR);
    }
    captureMessage({
      type: SentryMessageType.CONTRACT,
      params: {
        name: 'approve error',
        method: MethodType.CALLSENDMETHOD,
        query: {
          spender: spender,
          symbol,
          amount: Number(amount),
        },
        description: error,
      },
    });
    return false;
  }
};

export const checkAllowanceAndApprove = async (options: {
  spender: string;
  address: string;
  chainId?: Chain;
  symbol?: string;
  decimals?: number;
  amount: string;
  contractType?: 'Token' | 'Lp';
  contractAddress?: string;
}) => {
  const {
    chainId,
    symbol = 'ELF',
    address,
    spender,
    amount,
    decimals = 8,
    contractType = 'Token',
    contractAddress,
  } = options;
  try {
    let allowance;
    if (contractType === 'Lp') {
      allowance = await GetAllowanceLp(
        {
          symbol: symbol,
          owner: address,
          spender: spender,
        },
        contractAddress || '',
        {
          chain: chainId,
        },
      );
    } else {
      allowance = await GetAllowance(
        {
          symbol: symbol,
          owner: address,
          spender: spender,
        },
        {
          chain: chainId,
        },
      );
    }
    if (allowance.error) {
      message.error(allowance.errorMessage?.message || allowance.error.toString() || DEFAULT_ERROR);
      return false;
    }

    const bigA = timesDecimals(amount, decimals ?? 8);

    let allowanceBN;
    if (contractType === 'Token') {
      allowanceBN = new BigNumber((allowance as IGetAllowanceResponse)?.allowance);
    } else {
      allowanceBN = new BigNumber((allowance as IGetLpAllowanceResponse)?.amount);
    }

    if (allowanceBN.lt(bigA)) {
      const approveAmount = isNightElf() ? CONTRACT_AMOUNT : bigA.toNumber();
      return await approve(
        spender,
        symbol,
        `${approveAmount}`,
        chainId,
        contractType,
        contractAddress,
      );
    }
    return true;
  } catch (error) {
    message.destroy();
    const resError = error as unknown as IContractError;
    if (resError) {
      message.error(resError.errorMessage?.message || DEFAULT_ERROR);
    }
    captureMessage({
      type: SentryMessageType.CONTRACT,
      params: {
        name: 'checkAllowanceAndApproveGetAllowance',
        method: MethodType.CALLVIEWMETHOD,
        query: options,
        description: error,
      },
    });
    return false;
  }
};
