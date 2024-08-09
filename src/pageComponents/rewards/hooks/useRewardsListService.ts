import { getRewardsList } from 'api/request';
import useLoading from 'hooks/useLoading';
import { useWalletService } from 'hooks/useWallet';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function useRewardsListService({
  rewardsTypeList,
}: {
  rewardsTypeList: Array<IRewardsTypeItem>;
}) {
  const [dataList, setDataList] = useState<Array<IRewardListItem>>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [poolType, setPoolType] = useState<'Points' | 'Token' | 'Lp' | 'All'>('All');
  const [loading, setLoading] = useState(false);
  const { wallet } = useWalletService();
  const { showLoading, closeLoading } = useLoading();
  const [hasHistoryData, setHasHistoryData] = useState(false);
  const [rewardsTypeId, setRewardsTypeId] = useState('');

  const searchParams: IRewardListParams = useMemo(() => {
    const params = {
      poolType,
      skipCount: page === 1 ? 0 : (page - 1) * pageSize,
      maxResultCount: pageSize,
      address: wallet.address || '',
      id: rewardsTypeId || (poolType === 'All' ? 'all' : ''),
    };
    return params;
  }, [page, pageSize, poolType, rewardsTypeId, wallet.address]);

  const fetchData = useCallback(async () => {
    if (!wallet.address) return;
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
  }, [closeLoading, page, poolType, searchParams, showLoading, wallet.address]);

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
      const filteredId = filters?.['pools']?.[0];
      const rewardsType = rewardsTypeList.filter((item) => item?.id === filteredId)?.[0] || {};
      setPoolType(rewardsType?.poolType || 'All');
      setRewardsTypeId(rewardsType?.id || '');
      setPage(1);
    },
    [rewardsTypeList],
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
