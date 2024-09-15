import useRewardsListService from 'pageComponents/rewards/hooks/useRewardsListService';
import PoolsTable from '../PoolsTable';
import { useEffect } from 'react';

export default function RewardListPC({
  rewardsTypeList,
}: {
  rewardsTypeList: Array<IRewardsTypeItem>;
}) {
  const { page, pageSize, dataList, totalCount, onPaginationChange, onChange } =
    useRewardsListService({ rewardsTypeList });
  return (
    <PoolsTable
      rewardsTypeList={rewardsTypeList}
      page={page}
      pageSize={pageSize}
      dataList={dataList}
      onChange={onChange}
      onPaginationChange={onPaginationChange}
      // loading={loading}
      totalCount={totalCount}
    />
  );
}
