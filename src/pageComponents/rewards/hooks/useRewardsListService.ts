import { getRewardsList } from 'api/request';
import useLoading from 'hooks/useLoading';
import { useWalletService } from 'hooks/useWallet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';

export default function useRewardsListService() {
  const [dataList, setDataList] = useState<Array<IRewardListItem>>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [poolType, setPoolType] = useState<'Points' | 'Token' | 'Lp' | 'All'>('All');
  const [loading, setLoading] = useState(false);
  const { isLogin } = useGetLoginStatus();
  const { wallet } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const [hasHistoryData, setHasHistoryData] = useState(false);

  const searchParams = useMemo(() => {
    const params = {
      poolType,
      skipCount: page === 1 ? 0 : (page - 1) * pageSize,
      maxResultCount: pageSize,
      address: wallet.address || '',
    };
    return params;
  }, [page, pageSize, poolType, wallet.address]);

  const fetchData = useCallback(async () => {
    if (!isLogin || !wallet.address) return;
    try {
      setLoading(true);
      showLoading();
      const { items, totalCount } = await getRewardsList(searchParams);
      setDataList(items || []);
      setTotalCount(totalCount || 0);
      if (page === 1 && poolType === 'All' && items?.length) {
        setHasHistoryData(true);
      }
    } catch (error) {
      console.error('getRewardsList error', error);
    } finally {
      setLoading(false);
      closeLoading();
    }
  }, [closeLoading, isLogin, page, poolType, searchParams, showLoading, wallet.address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onPaginationChange = useCallback(
    ({ page, pageSize }: { page?: number; pageSize?: number }) => {
      page && setPage(page);
      pageSize && setPageSize(pageSize);
    },
    [setPage, setPageSize],
  );

  const onChange = useCallback(
    (pagination: any, filters: Record<string, any>, sorter: any) => {
      const filtered = filters?.['pools']?.[0];
      setPoolType(filtered || 'All');
      setPage(1);
    },
    [setPoolType],
  );

  return {
    loading,
    dataList,
    page,
    pageSize,
    setPage,
    setPageSize,
    setPoolType,
    onPaginationChange,
    onChange,
    poolType,
    hasHistoryData,
    totalCount,
  };
}
