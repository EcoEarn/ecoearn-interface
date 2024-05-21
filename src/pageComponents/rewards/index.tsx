import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import PoolsAmount from './components/PoolsAmount';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Empty from '../../components/Empty';
import useResponsive from 'utils/useResponsive';
import RewardsListMobile from './components/RewardsListMobile';
import RewardListPC from './components/RewardListPC';
import clsx from 'clsx';

export default function Rewards() {
  const { isLogin } = useGetLoginStatus();
  const router = useRouter();
  const [hasHistoryData, setHasHistoryData] = useState(false);

  const updateHasHistoryDate = useCallback((value: boolean) => {
    setHasHistoryData(value);
  }, []);

  useEffect(() => {
    !isLogin && setHasHistoryData(false);
  }, [isLogin]);

  const { isMD } = useResponsive();

  const renderEmpty = (
    <Empty
      emptyBtnText="Stake"
      emptyText="You have not claimed the rewards"
      onClick={() => {
        router.push('/simple');
      }}
    />
  );

  return (
    <>
      <h2 className="text-4xl lg:text-5xl font-semibold text-neutralTitle pt-8 lg:pt-10">
        Rewards
      </h2>
      <div className="text-base text-neutralPrimary font-medium flex flex-col gap-1 mt-2 lg:mt-4">
        <p>
          There is a lock-up period for rewards you claimed, and the period varies among different
          mining pools. The rewards can only be withdrawn after the lock-up period is ended.
        </p>
        <p>
          After staking points in the XPSGR mining pool, the SGR rewards claimed can be staked
          again, including SGR rewards during the lock-up period.
        </p>
      </div>
      {isLogin && (
        <div className={clsx(!hasHistoryData && 'invisible h-0')}>
          <div className="mt-6 sm:mt-8 lg:mt-12">
            <PoolsAmount />
          </div>
          <div className="mt-4 sm:mt-6">
            {isMD ? (
              <RewardsListMobile updateHasHistoryDate={updateHasHistoryDate} />
            ) : (
              <RewardListPC updateHasHistoryDate={updateHasHistoryDate} />
            )}
          </div>
        </div>
      )}
      {!hasHistoryData && renderEmpty}
    </>
  );
}
