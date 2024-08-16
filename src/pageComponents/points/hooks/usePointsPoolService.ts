import { message } from 'antd';
import { getPointsPoolList, pointsClaim, stakingClaim } from 'api/request';
import useDappList from 'hooks/useDappList';
import useEarlyStake from 'hooks/useEarlyStake';
import useLoading from 'hooks/useLoading';
import { useWalletService } from 'hooks/useWallet';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { PoolType } from 'types/stake';
import { getTxResult } from 'utils/aelfUtils';
import { timesDecimals } from 'utils/calculate';
import { matchErrorMsg } from 'utils/formatError';
import { getRawTransaction } from 'utils/getRawTransaction';
import { useResponsive } from 'utils/useResponsive';

export enum ListTypeEnum {
  Staked = 'Staked',
  All = 'All',
}

export default function usePointsPoolService({ dappName }: { dappName: string }) {
  const [currentList, setCurrentList] = useState<ListTypeEnum>(ListTypeEnum.All);
  const { showLoading, closeLoading } = useLoading();
  const { wallet, walletType } = useWalletService();
  const { pointsContractAddress, curChain, caContractAddress, ...config } = useGetCmsInfo() || {};
  const { isLG } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [curItem, setCurItem] = useState<IPointsPoolItem>();
  const [status, setStatus] = useState<'normal' | 'success' | 'error'>('normal');
  const [transactionId, setTransactionId] = useState<string>();
  const [errorTip, setErrorTip] = useState('');
  const { stake } = useEarlyStake();
  const { dappList } = useDappList();
  const [data, setData] = useState<Array<IPointsPoolItem>>();

  const segmentedOptions: Array<{ label: ReactNode; value: string }> = [
    { label: 'All', value: ListTypeEnum.All },
    { label: 'Staked', value: ListTypeEnum.Staked },
  ];

  const dappId = useMemo(() => {
    return dappList?.filter((item) => item?.dappName === dappName)?.[0]?.dappId || '';
  }, [dappList, dappName]);

  const gainUrl = useMemo(() => {
    return dappList?.filter((item) => item?.dappName === dappName)?.[0]?.gainUrl || '';
  }, [dappList, dappName]);

  const handleSegmentChange = useCallback(
    (value: string) => {
      setCurrentList(value as ListTypeEnum);
    },
    [setCurrentList],
  );

  const handleGain = useCallback(() => {
    gainUrl && window.open(gainUrl, '_blank');
  }, [gainUrl]);

  const handleClaim = useCallback((item: IPointsPoolItem) => {
    setCurItem(item);
    setModalVisible(true);
  }, []);

  const resetState = useCallback(() => {
    setLoading(false);
    setModalVisible(false);
    setStatus('normal');
    setTransactionId('');
    setCurItem(undefined);
  }, []);

  const fetchData = useCallback(async () => {
    if (!dappId) {
      return;
    }
    try {
      showLoading();
      const data = await getPointsPoolList({
        type: currentList,
        sorting: '',
        name: '',
        skipCount: 0,
        maxResultCount: 20,
        address: wallet.address || '',
        dappId: dappId,
      });
      data && setData(data);
    } catch (err) {
      console.error('getPointsPoolList err', err);
    } finally {
      closeLoading();
    }
  }, [closeLoading, currentList, dappId, showLoading, wallet.address]);

  const onClaim = useCallback(
    async (item: IPointsPoolItem) => {
      const amount = timesDecimals(item.earned, item?.decimal || 8).toNumber();
      const { signature, seed, expirationTime } =
        (await stakingClaim({
          amount,
          poolId: String(item.poolId),
          address: wallet.address,
        })) || {};
      if (!signature || !seed || !expirationTime) throw Error();
      try {
        const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${curChain?.toLocaleUpperCase()}`];
        let rawTransaction = null;
        try {
          rawTransaction = await getRawTransaction({
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
            rpcUrl,
            chainId: curChain!,
          });
        } catch (error) {
          throw Error();
        }
        console.log('rawTransaction', rawTransaction);
        if (!rawTransaction) throw Error();
        const { data: TransactionId, message: errorMessage } = await pointsClaim({
          chainId: curChain!,
          rawTransaction: rawTransaction || '',
        });
        if (TransactionId) {
          const { TransactionId: resultTransactionId } = await getTxResult(
            TransactionId,
            rpcUrl,
            curChain!,
          );
          if (resultTransactionId) {
            return resultTransactionId;
          } else {
            throw Error();
          }
        } else {
          const { showInModal, matchedErrorMsg } = matchErrorMsg(errorMessage, 'Claim');
          if (!showInModal) message.error(matchedErrorMsg);
          throw Error(showInModal ? matchedErrorMsg : '');
        }
      } catch (error) {
        throw Error((error as Error).message);
      }
    },
    [caContractAddress, config, curChain, pointsContractAddress, wallet, walletType],
  );

  const handleConfirm = useCallback(async () => {
    if (!curItem) return;
    setLoading(true);
    try {
      const transactionId = await onClaim(curItem);
      if (transactionId) {
        setStatus('success');
        setTransactionId(transactionId);
      } else {
        throw new Error();
      }
    } catch (error) {
      const errorTip = (error as Error).message;
      console.error('Points Claim error', errorTip);
      setStatus('error');
      setErrorTip(errorTip);
    } finally {
      setLoading(false);
    }
  }, [curItem, onClaim]);

  const handleEarlyStake = useCallback(
    async (tokenName: string) => {
      await stake({
        poolType: PoolType.POINTS,
        rewardsTokenName: tokenName,
        onSuccess: () => {
          setModalVisible(false);
        },
      });
    },
    [stake],
  );

  useEffect(() => {
    fetchData();
  }, [currentList, fetchData]);

  return {
    data,
    loading,
    currentList,
    setCurrentList,
    fetchData,
    onClaim,
    curItem,
    modalVisible,
    setModalVisible,
    transactionId,
    errorTip,
    resetState,
    handleConfirm,
    handleEarlyStake,
    isLG,
    handleSegmentChange,
    segmentedOptions,
    handleClaim,
    handleGain,
    status,
  };
}
