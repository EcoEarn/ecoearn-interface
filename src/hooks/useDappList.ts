import { getStakingItems } from 'api/request';
import useGetStoreInfo from 'redux/hooks/useGetStoreInfo';
import { setDappList } from 'redux/reducer/info';
import { store } from 'redux/store';
import useLoading from './useLoading';
import { useCallback, useEffect } from 'react';

export default function useDappList() {
  const { showLoading, closeLoading, visible } = useLoading();
  const { dappList } = useGetStoreInfo();

  const fetchData = useCallback(async () => {
    if (dappList) return;
    try {
      showLoading();
      const data = await getStakingItems();
      if (data) store.dispatch(setDappList(data));
    } catch (err) {
      console.error('getStakingItems error', err);
    } finally {
      closeLoading();
    }
  }, [closeLoading, dappList, showLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    dappList,
    loading: visible,
  };
}
