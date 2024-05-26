import { useDebounceFn } from 'ahooks';
import { getRewardsList } from 'api/request';
import useLoading from 'hooks/useLoading';
import { useWalletService } from 'hooks/useWallet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
const PAGE_CONTAINER_ID = 'pageContainer';

const pageSize = 10;

export default function useRewardsListMobileService() {
  const [total, setTotal] = useState(0);
  const [dataSource, setDataSource] = useState<IRewardListItem[]>([]);
  const loading = useRef(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [current, setCurrent] = useState(1);
  const { showLoading, closeLoading, visible: isLoading } = useLoading();
  const { wallet } = useWalletService();
  const [poolType, setPoolType] = useState<'Points' | 'Token' | 'Lp' | 'All'>('All');
  const [hasHistoryData, setHasHistoryData] = useState(false);

  const selectOptions = useMemo(() => {
    return [
      { value: 'All', label: 'All' },
      { value: 'Points', label: 'XPSGR' },
      { value: 'Token', label: 'SGR' },
      { value: 'Lp', label: 'LP' },
    ];
  }, []);

  const requestParams = useMemo(() => {
    const params: IRewardListParams = {
      address: wallet?.address || '',
      skipCount: current === 1 ? 0 : (current - 1) * pageSize,
      maxResultCount: pageSize,
      poolType,
    };
    return params;
  }, [current, poolType, wallet?.address]);

  const fetchData = useCallback(async () => {
    if (loading.current || !hasMore) {
      return;
    } else {
      loading.current = true;
      showLoading();
    }
    try {
      const res = await getRewardsList(requestParams);
      loading.current = false;
      setTotal(res.totalCount ?? 0);
      if (current > 1) {
        setDataSource((preData) => [...preData, ...res.items]);
      } else {
        setDataSource(res.items);
      }
      if (current * pageSize > res.totalCount) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      if (current === 1 && poolType === 'All' && res.items?.length) {
        setHasHistoryData(true);
      }
    } finally {
      closeLoading();
      loading.current = false;
    }
  }, [closeLoading, current, hasMore, poolType, requestParams, showLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (value: 'Points' | 'Token' | 'Lp' | 'All') => {
    setPoolType(value);
    setHasMore(true);
    setCurrent(1);
  };

  const loadMoreData = useCallback(() => {
    if (loading.current || !hasMore) return;
    setCurrent((current) => {
      return current + 1;
    });
  }, [hasMore]);

  const { run } = useDebounceFn(loadMoreData, {
    wait: 100,
  });

  const handleScroll = useCallback(
    async (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.scrollHeight - target.scrollTop - target.clientHeight <= 75) {
        run();
      }
    },
    [run],
  );
  useEffect(() => {
    document.querySelector(`#${PAGE_CONTAINER_ID}`)?.addEventListener('scroll', handleScroll);
    console.log(
      document.querySelector(`#${PAGE_CONTAINER_ID}`)?.addEventListener('scroll', handleScroll),
    );

    return () => {
      document.querySelector(`#${PAGE_CONTAINER_ID}`)?.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    currentSelect: poolType,
    handleChange,
    hasMore,
    selectOptions,
    isLoading,
    dataSource,
    total,
    loadMoreData,
    loading: loading.current,
    hasHistoryData,
  };
}
