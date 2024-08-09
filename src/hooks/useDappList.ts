import { useMount, useRequest } from 'ahooks';
import { getStakingItems } from 'api/request';
import useGetStoreInfo from 'redux/hooks/useGetStoreInfo';
import { setDappList } from 'redux/reducer/info';
import { store } from 'redux/store';
import useLoading from './useLoading';
import { useEffect } from 'react';

export default function useDappList() {
  const { showLoading, closeLoading } = useLoading();

  const { run, loading } = useRequest(
    async () => {
      const data = await getStakingItems();
      if (data) store.dispatch(setDappList(data));
    },
    {
      manual: true,
    },
  );
  const { dappList } = useGetStoreInfo();

  useEffect(() => {
    if (loading) showLoading();
    else closeLoading();
  }, [closeLoading, loading, showLoading]);

  useMount(() => {
    if (!dappList) {
      run();
    }
  });

  return {
    dappList,
    loading,
  };
}
