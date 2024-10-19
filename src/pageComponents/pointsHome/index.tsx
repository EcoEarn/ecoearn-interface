import { getStakingItems } from 'api/request';
import DappList from './components/DappList';
import { useCallback, useEffect, useState } from 'react';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
// import ComingSoon from './components/ComingSoon';

export default function StakeHome() {
  const [loading, setLoading] = useState(false);
  const [dappList, setDappList] = useState<Array<IStakingItem>>([]);
  const { isLogin } = useGetLoginStatus();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStakingItems();
      if (data) setDappList(data);
    } catch (err) {
      console.error('getStakingItems error', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <div className="pt-[24px] pb-[24px] text-[28px] lg:pt-[64px] lg:pb-[24px] lg:text-[36px] font-[600]	 text-neutralTitle">
        Points Staking
      </div>
      <DappList items={dappList || []} loading={loading} />
      {/* <ComingSoon name={'Coming soon'} desc={'Stake your points to earn exclusive rewards!'} /> */}
    </div>
  );
}
