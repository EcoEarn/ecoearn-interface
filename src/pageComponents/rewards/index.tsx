import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import PoolsAmount from './components/PoolsAmount';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Empty from '../../components/Empty';
import useResponsive from 'utils/useResponsive';
import RewardsListMobile from './components/RewardsListMobile';
import RewardListPC from './components/RewardListPC';
import clsx from 'clsx';
import React from 'react';

export default function Rewards() {
  const { isLogin } = useGetLoginStatus();
  const router = useRouter();
  const [hasHistoryData, setHasHistoryData] = useState(false);
  const rewardDataRef = useRef<{ refresh: () => void }>();

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
      emptyText="You have not claimed the rewards."
      onClick={() => {
        router.push('/simple');
      }}
    />
  );

  const onCountFinish = useCallback(() => {
    rewardDataRef.current?.refresh();
  }, []);

  return (
    <>
      <h2 className="text-4xl lg:text-5xl font-semibold text-neutralTitle pt-8 lg:pt-10">
        Rewards
      </h2>
      <div className="text-base text-neutralPrimary font-medium flex flex-col gap-1 mt-2 lg:mt-4">
        <p>
          There is a lock-up period for rewards you claimed, and the period varies among different
          mining pools.
        </p>
        <p>The rewards can only be withdrawn after the lock-up period is ended.</p>
        <p>
          After staking points in the XPSGR mining pool, the SGR rewards claimed can be staked
          again, including SGR rewards during the lock-up period.
        </p>
      </div>
      {isLogin && (
        <div className={clsx(!hasHistoryData && 'invisible h-0')}>
          <div className="mt-6 sm:mt-8 lg:mt-12">
            <PoolsAmount ref={rewardDataRef} />
          </div>
          <div className="mt-4 sm:mt-6">
            {isMD ? (
              <RewardsListMobile
                updateHasHistoryDate={updateHasHistoryDate}
                onCountDownFinish={onCountFinish}
              />
            ) : (
              <RewardListPC
                updateHasHistoryDate={updateHasHistoryDate}
                onCountDownFinish={onCountFinish}
              />
            )}
          </div>
        </div>
      )}
      {!hasHistoryData && renderEmpty}
    </>
  );
}
