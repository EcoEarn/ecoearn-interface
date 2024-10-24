import useRewardsListService from 'pageComponents/rewards/hooks/useRewardsListService';
import PoolsTable from '../PoolsTable';
import { useEffect } from 'react';

export default function RewardListPC({
  rewardsTypeList,
  initData,
  total: initTotal,
}: {
  rewardsTypeList: Array<IRewardsTypeItem>;
  initData?: IRewardListItem[];
  total?: number;
}) {
  const { page, pageSize, dataList, totalCount, onPaginationChange, onChange, loading } =
    useRewardsListService({ rewardsTypeList, initData, initTotal });
  return (
    <PoolsTable
      rewardsTypeList={rewardsTypeList}
      page={page}
      pageSize={pageSize}
      dataList={dataList}
      onChange={onChange}
      onPaginationChange={onPaginationChange}
      loading={loading}
      totalCount={totalCount}
    />
  );
}
