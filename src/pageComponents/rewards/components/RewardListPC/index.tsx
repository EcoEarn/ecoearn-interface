import useRewardsListService from 'pageComponents/rewards/hooks/useRewardsListService';
import PoolsTable from '../PoolsTable';
import { useEffect } from 'react';

export default function RewardListPC({
  rewardsTypeList,
  initData,
}: {
  rewardsTypeList: Array<IRewardsTypeItem>;
  initData?: IRewardListItem[];
}) {
  const { page, pageSize, dataList, totalCount, onPaginationChange, onChange, loading } =
    useRewardsListService({ rewardsTypeList, initData });
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
