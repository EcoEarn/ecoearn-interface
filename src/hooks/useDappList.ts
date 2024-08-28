import { getStakingItems } from 'api/request';
import useGetStoreInfo from 'redux/hooks/useGetStoreInfo';
import { setDappList } from 'redux/reducer/info';
import { store } from 'redux/store';
import { useCallback, useEffect, useState } from 'react';

export default function useDappList() {
  const [loading, setLoading] = useState(false);
  const { dappList } = useGetStoreInfo();

  const fetchData = useCallback(async () => {
    if (dappList) return;
    try {
      setLoading(true);
      const data = await getStakingItems();
      if (data) store.dispatch(setDappList(data));
    } catch (err) {
      console.error('getStakingItems error', err);
    } finally {
      setLoading(false);
    }
  }, [dappList]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    dappList,
    loading,
  };
}
