import { useModal } from '@ebay/nice-modal-react';
import { checkJoinStatus as checkJoinStatusApi } from 'api/request';
import JoinModal from 'components/JoinModal';
import { useCallback, useState } from 'react';
import useLoading from './useLoading';
import { IContractError } from 'types';
import { message } from 'antd';
import { Join } from 'contract/rewards';
import { useWalletService } from './useWallet';
import { store } from 'redux/store';
import useNotification from './useNotification';

export default function useJoin() {
  const joinModal = useModal(JoinModal);
  const { showLoading, closeLoading } = useLoading();
  const [loading, setLoading] = useState(false);
  const { wallet } = useWalletService();
  const notification = useNotification();

  const checkJoinsStatus = useCallback(async () => {
    let isJoin = false;

    const info = store.getState().info.cmsInfo;
    const params = {
      ChainId: info?.curChain,
      address: wallet?.address,
    };

    if (params.address)
      try {
        showLoading();
        const res = await checkJoinStatusApi(params);
        console.log('res', res);
        isJoin = res;
      } catch (err) {
        console.error(err);
      } finally {
        closeLoading();
      }
    return isJoin;
  }, [closeLoading, showLoading, wallet?.address]);

  const onJoin = useCallback(async () => {
    const isJoin = await checkJoinsStatus();
    if (isJoin) return false;
    try {
      setLoading(true);
      await Join();
      return true;
    } catch (error) {
      console.log('=====error', error);
      const errorMessage = (error as IContractError).errorMessage?.message;
      errorMessage && notification.error({ description: errorMessage });
      return false;
    } finally {
      setLoading(false);
      joinModal.hide();
    }
  }, [checkJoinsStatus, joinModal, notification]);

  return {
    checkJoinsStatus,
    onJoin,
    loading,
  };
}
