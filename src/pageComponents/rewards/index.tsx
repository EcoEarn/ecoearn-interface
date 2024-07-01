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
      emptyText="Participating in staking can earn rewards."
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
          There is a 90-day release period for your claimed rewards, and they can only be withdrawn
          after the release period expires.
        </p>
        <p>
          After staking, you can restake your claimed SGR rewards early to the SGR pool, or stake
          them early to the Farms through adding liquidity. Rewards that can be staked early include
          frozen and withdrawable amounts.
        </p>
      </div>
      {isLogin && (
        <div className={clsx(!hasHistoryData && 'invisible h-0')}>
          <div className="mt-6 sm:mt-8 lg:mt-12">
            <PoolsAmount ref={rewardDataRef} />
          </div>
          <div className="mt-6">
            <div className="mb-4 text-base font-semibold text-neutralTitle">Claim Record</div>
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
