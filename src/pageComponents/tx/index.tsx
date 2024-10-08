import { useConnectWallet } from '@aelf-web-login/wallet-adapter-react';
import { useInterval } from 'ahooks';
import { checkScanConfirm } from 'api/request';
import TradeConfirm, { TTradeConfirmStatus } from 'components/TradeConfrim';
import useEarlyStake from 'hooks/useEarlyStake';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import useGetConfirmInfo from 'redux/hooks/useGetConfirmInfo';
import { ICMSInfo } from 'redux/types/reducerTypes';
import { PoolType } from 'types/stake';
import { getTxResult } from 'utils/aelfUtils';

export default function TxPage() {
  const { transactionId } = useParams() as {
    transactionId: string;
  };
  const confirmInfo = useGetConfirmInfo();
  const config = useGetCmsInfo();
  const [txId, setTransactionId] = useState('');
  const [status, setStatus] = useState<TTradeConfirmStatus>('normal');
  const [loading, setLoading] = useState(true);
  const [isScanConfirm, setIsScanConfirm] = useState(false);
  const [blockNumber, setBlockNumber] = useState('');
  const { stake } = useEarlyStake();
  const { isConnected } = useConnectWallet();
  const router = useRouter();

  const getTxRes = useCallback(async () => {
    if (!config || !transactionId) return;
    const rpcUrl = (config as Partial<ICMSInfo>)[`rpcUrl${config?.curChain?.toLocaleUpperCase()}`];
    const { TransactionId: resultTransactionId, txResult } = await getTxResult(
      transactionId,
      rpcUrl,
      config?.curChain,
    );
    if (resultTransactionId) {
      setBlockNumber(txResult?.BlockNumber);
      setTransactionId(resultTransactionId);
    }
  }, [config, transactionId]);

  const getScanConfirm = useCallback(async () => {
    if (!blockNumber || !config || isScanConfirm) return;
    try {
      const res = await checkScanConfirm({
        chainId: config?.curChain,
        transactionBlockHeight: blockNumber || 0,
      });
      if (res) {
        setIsScanConfirm(true);
        setLoading(false);
        setStatus('success');
      }
    } catch (err) {
      console.error(err);
    }
  }, [blockNumber, config, isScanConfirm]);

  useEffect(() => {
    getTxRes();
  }, [getTxRes]);

  useInterval(
    () => {
      getScanConfirm();
    },
    1000,
    {
      immediate: true,
    },
  );

  useEffect(() => {
    if (!isConnected) {
      router.push('/staking');
    }
  }, [isConnected, router]);

  const onEarlyStake = useCallback(() => {
    stake({
      poolType: confirmInfo?.content?.poolType || PoolType.TOKEN,
      rewardsTokenName: confirmInfo?.content?.rewardsSymbol,
    });
  }, [confirmInfo?.content?.poolType, confirmInfo?.content?.rewardsSymbol, stake]);

  return confirmInfo ? (
    <TradeConfirm
      transactionId={txId}
      loading={loading}
      status={status}
      onEarlyStake={onEarlyStake}
      {...confirmInfo}
    />
  ) : null;
}
