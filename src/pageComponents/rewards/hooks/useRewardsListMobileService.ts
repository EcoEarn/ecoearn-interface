import { useDebounceFn } from 'ahooks';
import { getRewardsList } from 'api/request';
import useLoading from 'hooks/useLoading';
import { useWalletService } from 'hooks/useWallet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
const PAGE_CONTAINER_ID = 'pageContainer';

const pageSize = 10;

const maxPage = 10000 / pageSize;

export default function useRewardsListMobileService({
  rewardsTypeList,
  initData,
  initTotal,
}: {
  rewardsTypeList: Array<IRewardsTypeItem>;
  initData?: IRewardListItem[];
  initTotal?: number;
}) {
  const [total, setTotal] = useState(initTotal || 0);
  const [dataSource, setDataSource] = useState<IRewardListItem[]>([]);
  const loading = useRef(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [current, setCurrent] = useState(1);
  const { showLoading, closeLoading, visible: isLoading } = useLoading();
  const { wallet } = useWalletService();
  const [poolType, setPoolType] = useState<'Points' | 'Token' | 'Lp' | 'All'>('All');
  const [rewardsTypeId, setRewardsTypeId] = useState('');
  const isReadInitData = useRef(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const selectOptions = useMemo(() => {
    return rewardsTypeList?.map((item) => {
      return {
        value: item?.id,
        label: item?.filterName,
      };
    });
  }, [rewardsTypeList]);

  const requestParams = useMemo(() => {
    const params: IRewardListParams = {
      address: wallet?.address || '',
      skipCount: current === 1 ? 0 : (current - 1) * pageSize,
      maxResultCount: pageSize,
      poolType,
      id: rewardsTypeId || (poolType === 'All' ? 'all' : ''),
    };
    return params;
  }, [current, poolType, rewardsTypeId, wallet?.address]);

  const fetchData = useCallback(async () => {
    if (loading.current || !hasMore) {
      return;
    }
    if (initData && !isReadInitData.current && requestParams.poolType === 'All') {
      setDataSource(initData);
      isReadInitData.current = true;
      return;
    }
    loading.current = true;
    // showLoading();
    if (current === 1) {
      setIsLoadingList(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const res = await getRewardsList(requestParams);
      loading.current = false;
      setTotal(res?.totalCount ?? 0);
      if (current > 1) {
        setDataSource((preData) => [...preData, ...(res?.items || [])]);
      } else {
        setDataSource(res?.items || []);
      }
      if (current * pageSize > res?.totalCount) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } finally {
      // closeLoading();
      setIsLoadingList(false);
      setIsLoadingMore(false);
      loading.current = false;
    }
  }, [current, hasMore, initData, requestParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = useCallback(
    (value: string) => {
      setRewardsTypeId(value || '');
      const poolType = rewardsTypeList?.find((item) => item?.id === value)?.poolType || 'All';
      setPoolType(poolType);
      setHasMore(true);
      setCurrent(1);
    },
    [rewardsTypeList],
  );

  const loadMoreData = useCallback(() => {
    if (loading.current || !hasMore || current >= maxPage) return;
    setCurrent((current) => {
      return current + 1;
    });
  }, [current, hasMore]);

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
    isLoadingMore,
    isLoadingList,
  };
}
