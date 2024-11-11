import { message } from 'antd';
import { getPointsPoolList, pointsClaim, stakingClaim } from 'api/request';
import { TradeConfirmTypeEnum } from 'components/TradeConfrim';
import useDappList from 'hooks/useDappList';
import useEarlyStake from 'hooks/useEarlyStake';
import useLoading from 'hooks/useLoading';
import useNotification from 'hooks/useNotification';
import { useWalletService } from 'hooks/useWallet';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { setConfirmInfo } from 'redux/reducer/info';
import { store } from 'redux/store';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { PoolType } from 'types/stake';
import { getTxResult } from 'utils/aelfUtils';
import { timesDecimals } from 'utils/calculate';
import { getDomain } from 'utils/common';
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
  const router = useRouter();
  const notification = useNotification();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { isLogin } = useGetLoginStatus();

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
      // showLoading();
      setIsLoadingData(true);
      const data = await getPointsPoolList({
        type: currentList,
        sorting: '',
        name: '',
        skipCount: 0,
        maxResultCount: 20,
        address: wallet?.address || '',
        dappId: dappId,
      });
      data && setData(data);
    } catch (err) {
      console.error('getPointsPoolList err', err);
    } finally {
      // closeLoading();
      setIsLoadingData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentList, dappId, isLogin]);

  const onClaim = useCallback(
    async (item: IPointsPoolItem) => {
      if (!wallet?.address) return;
      const amount = timesDecimals(item.earned, item?.decimal || 8).toNumber();
      const domain = getDomain();
      const { signature, seed, expirationTime } =
        (await stakingClaim({
          amount,
          poolId: String(item.poolId),
          address: wallet?.address || '',
          domain,
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
              account: wallet?.address || '',
              amount,
              seed,
              signature,
              expirationTime,
              domain,
            },
            rpcUrl,
            chainId: curChain!,
          });
        } catch (error) {
          throw Error((error as Error)?.message || '');
        }
        console.log('rawTransaction', rawTransaction);
        if (!rawTransaction) throw Error();
        const { data: TransactionId, message: errorMessage } = await pointsClaim({
          chainId: curChain!,
          rawTransaction: rawTransaction || '',
        });
        if (TransactionId) {
          return TransactionId;
        } else {
          const { showInModal, matchedErrorMsg } = matchErrorMsg(errorMessage, 'Claim');
          throw Error(matchedErrorMsg);
        }
      } catch (error) {
        throw Error((error as Error).message);
      }
    },
    [caContractAddress, config, curChain, pointsContractAddress, wallet, walletType],
  );

  console.log('========wallet', wallet);

  const handleConfirm = useCallback(
    async (curItem: IPointsPoolItem) => {
      if (!curItem) return;
      setLoading(true);
      showLoading({ type: 'block' });
      try {
        const transactionId = await onClaim(curItem);
        return transactionId;
      } catch (error) {
        const errorTip = (error as Error).message;
        const { matchedErrorMsg, title } = matchErrorMsg(errorTip, 'Claim');
        if (matchedErrorMsg) {
          notification.error({
            description: matchedErrorMsg,
            message: title || '',
          });
        }
      } finally {
        setLoading(false);
        closeLoading();
      }
    },
    [closeLoading, notification, onClaim, showLoading],
  );

  const handleClaim = useCallback(
    async (item: IPointsPoolItem) => {
      setCurItem(item);
      let txId;
      try {
        txId = await handleConfirm(item);
        if (txId) {
          store.dispatch(
            setConfirmInfo({
              backPath: '/rewards',
              type: TradeConfirmTypeEnum.Claim,
              poolType: PoolType.POINTS,
              content: {
                amount: item.realEarned,
                tokenSymbol: item?.rewardsTokenName,
                rewardsSymbol: item?.rewardsTokenName,
                releasePeriod: item?.releasePeriod,
                supportEarlyStake: true,
                poolType: PoolType.POINTS,
              },
            }),
          );
          router.push(`/tx/${txId}`);
        }
      } catch (err) {
        console.error(err);
      }
    },
    [handleConfirm, router],
  );

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
    isLoadingData,
  };
}
