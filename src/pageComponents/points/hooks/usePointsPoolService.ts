import { sleep } from '@portkey/utils';
import { WebLoginEvents, useWebLoginEvent } from 'aelf-web-login';
import { useRequest } from 'ahooks';
import { getPointsPoolList, pointsClaim, stakingClaim } from 'api/request';
import { Claim } from 'contract/pointsStaking';
import useLoading from 'hooks/useLoading';
import { useWalletService } from 'hooks/useWallet';
import { config } from 'process';
import { useCallback, useEffect, useState } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { timesDecimals } from 'utils/calculate';
import { getRawTransaction } from 'utils/getRawTransaction';

export enum ListTypeEnum {
  Staked = 'Staked',
  All = 'All',
}

export default function usePointsPoolService() {
  const [currentList, setCurrentList] = useState<ListTypeEnum>(ListTypeEnum.All);
  const { isLogin } = useGetLoginStatus();
  const { showLoading, closeLoading } = useLoading();
  const { wallet, walletType } = useWalletService();
  const { pointsContractAddress, curChain, caContractAddress, ...config } = useGetCmsInfo() || {};

  const { run, data, loading, refresh } = useRequest(
    () => {
      if (!isLogin && currentList === ListTypeEnum.Staked) return Promise.resolve(null);
      return getPointsPoolList({
        type: currentList,
        sorting: '',
        name: '',
        skipCount: 0,
        maxResultCount: 20,
        address: wallet.address || '',
      });
    },
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (loading) {
      showLoading();
    } else {
      closeLoading();
    }
  }, [closeLoading, loading, showLoading]);

  const onClaim = useCallback(
    async (item: IPointsPoolItem) => {
      const amount = timesDecimals(item.earned, item?.decimal || 8).toNumber();
      const { signature, seed, expirationTime } = await stakingClaim({
        amount,
        poolId: String(item.poolId),
        address: wallet.address,
      });
      if (!signature || !seed || !expirationTime) throw Error('sign error');
      try {
        const rawTransaction = await getRawTransaction({
          walletInfo: wallet,
          walletType,
          caContractAddress: caContractAddress || '',
          contractAddress: pointsContractAddress || '',
          methodName: 'Claim',
          params: {
            poolId: String(item.poolId || ''),
            account: wallet.address,
            amount,
            seed,
            signature,
            expirationTime,
          },
          rpcUrl: (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`],
          chainId: curChain!,
        });
        console.log('rawTransaction', rawTransaction);
        const TransactionId = await pointsClaim({
          chainId: curChain!,
          rawTransaction: rawTransaction || '',
        });
        return TransactionId;
      } catch (error) {
        throw Error('claim error');
      }
    },
    [caContractAddress, config, curChain, pointsContractAddress, wallet, walletType],
  );

  useEffect(() => {
    currentList && run();
  }, [currentList, run]);

  useWebLoginEvent(WebLoginEvents.LOGOUT, () => {
    if (currentList === ListTypeEnum.All) {
      run();
    } else {
      setCurrentList(ListTypeEnum.All);
    }
  });

  useWebLoginEvent(WebLoginEvents.LOGINED, async () => {
    if (currentList === ListTypeEnum.All) {
      await sleep(500);
      run();
    }
  });

  return {
    data,
    loading,
    currentList,
    setCurrentList,
    fetchData: run,
    onClaim,
  };
}
