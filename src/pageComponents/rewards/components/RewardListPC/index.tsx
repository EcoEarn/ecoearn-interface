import useRewardsListService from 'pageComponents/rewards/hooks/useRewardsListService';
import PoolsTable from '../PoolsTable';
import { useEffect } from 'react';

export default function RewardListPC({
  updateHasHistoryDate,
  onCountDownFinish,
}: {
  updateHasHistoryDate: (value: boolean) => void;
  onCountDownFinish?: () => void;
}) {
  const {
    page,
    pageSize,
    dataList,
    loading,
    poolType,
    totalCount,
    onPaginationChange,
    onChange,
    hasHistoryData,
  } = useRewardsListService();

  useEffect(() => {
    updateHasHistoryDate(hasHistoryData);
  }, [hasHistoryData, updateHasHistoryDate]);

  return (
    <PoolsTable
      page={page}
      pageSize={pageSize}
      dataList={dataList}
      onChange={onChange}
      onPaginationChange={onPaginationChange}
      loading={loading}
      totalCount={totalCount}
      onCountDownFinish={onCountDownFinish}
    />
  );
}
