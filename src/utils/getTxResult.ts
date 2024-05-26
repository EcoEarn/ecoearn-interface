import { sleep } from '@portkey/utils';
import AElf from 'aelf-sdk';
import { SECONDS_60 } from 'constants/time';
import { getRpcUrls } from 'constants/url';

export interface ITxResultProps {
  TransactionId: string;
  chainId: Chain;
  rePendingEnd?: number;
  reNotexistedCount?: number;
  reGetCount?: number;
}

export function getAElf(rpcUrl?: string) {
  const rpc = rpcUrl || '';
  const httpProviders: any = {};

  if (!httpProviders[rpc]) {
    httpProviders[rpc] = new AElf(new AElf.providers.HttpProvider(rpc));
  }
  return httpProviders[rpc];
}

export async function getTxResultRetry({
  TransactionId,
  chainId,
  reGetCount = 3,
  rePendingEnd,
  reNotexistedCount = 3,
}: ITxResultProps): Promise<any> {
  try {
    const rpcUrl = getRpcUrls()[chainId];
    const txResult = await getAElf(rpcUrl).chain.getTxResult(TransactionId);
    if (txResult.error && txResult.errorMessage) {
      throw Error(txResult.errorMessage.message || txResult.errorMessage.Message);
    }

    if (!txResult) {
      if (reGetCount > 1) {
        await sleep(500);
        reGetCount--;
        return getTxResultRetry({
          TransactionId,
          chainId,
          rePendingEnd,
          reNotexistedCount,
          reGetCount,
        });
      }

      throw Error('Please check your internet connection and try again.');
    }

    if (txResult.Status.toLowerCase() === 'pending') {
      const current = new Date().getTime();
      if (rePendingEnd && rePendingEnd <= current) {
        throw Error('Please check your internet connection and try again.');
      }
      await sleep(1000);
      const pendingEnd: number = rePendingEnd || current + SECONDS_60;
      return getTxResultRetry({
        TransactionId,
        chainId,
        rePendingEnd: pendingEnd,
        reNotexistedCount,
        reGetCount,
      });
    }

    if (txResult.Status.toLowerCase() === 'notexisted' && reNotexistedCount > 1) {
      await sleep(1000);
      reNotexistedCount--;
      return getTxResultRetry({
        TransactionId,
        chainId,
        rePendingEnd,
        reNotexistedCount,
        reGetCount,
      });
    }

    if (txResult.Status.toLowerCase() === 'mined') {
      return { TransactionId, txResult };
    }
    throw Error('Please check your internet connection and try again.');
  } catch (error) {
    console.log('=====getTxResult error', error);
    if (reGetCount > 1) {
      await sleep(1000);
      reGetCount--;
      return getTxResultRetry({
        TransactionId,
        chainId,
        rePendingEnd,
        reNotexistedCount,
        reGetCount,
      });
    }
    throw Error('Please check your internet connection and try again.');
  }
}
