import { useMount, useRequest } from 'ahooks';
import { getStakingItems } from 'api/request';

export default function useStakingHomeService() {
  const { data, run, loading } = useRequest(getStakingItems, {
    manual: true,
  });

  useMount(() => {
    run();
  });

  return {
    dAppList: data,
    loading,
  };
}
