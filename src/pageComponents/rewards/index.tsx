import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import PoolsAmount from './components/PoolsAmount';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useResponsive from 'utils/useResponsive';
import RewardsListMobile from './components/RewardsListMobile';
import RewardListPC from './components/RewardListPC';
import clsx from 'clsx';
import React from 'react';
import { Segmented, Select } from 'antd';
import styles from './styles.module.css';
import { getRewardsList, getRewardsType } from 'api/request';
import { useWalletService } from 'hooks/useWallet';
import useLoading from 'hooks/useLoading';
import ComingSoon from './components/ComingSoon';
import LiquidityList from 'pageComponents/liquidity/components/LiquidityList';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import Empty from 'components/Empty';

export enum RewardsTypeEnum {
  'All' = 'all',
  'Points' = 'points',
  'Simple' = 'simple',
  'Farms' = 'farms',
}

export default function Rewards() {
  const { isLogin } = useGetLoginStatus();
  const [initData, setInitData] = useState<Array<IRewardListItem>>();
  const { isMD } = useResponsive();
  const { wallet } = useWalletService();
  const { showLoading, closeLoading, visible } = useLoading();
  const [currentType, setCurrentType] = useState<RewardsTypeEnum>(RewardsTypeEnum.All);
  const [rewardsTypeList, setRewardsTypeList] = useState<Array<IRewardsTypeItem>>();
  const { showLiquidityModule } = useGetCmsInfo() || {};

  console.log('====showLiquidityModule', showLiquidityModule);

  const fetchInitData = useCallback(async () => {
    if (!wallet?.address) return;
    try {
      showLoading();
      const [rewardsList, rewardsTypeList] = await Promise.all([
        getRewardsList({
          poolType: 'All',
          id: 'all',
          address: wallet.address,
          skipCount: 0,
          maxResultCount: 10,
        }),
        getRewardsType(),
      ]);
      closeLoading();
      const { items } = rewardsList || {};
      if (items && items?.length) {
        setInitData(items);
      }
      if (rewardsTypeList && rewardsTypeList?.length) {
        setRewardsTypeList(rewardsTypeList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      closeLoading();
    }
  }, [closeLoading, showLoading, wallet?.address]);

  const hasHistoryData = useMemo(() => {
    return initData && initData?.length > 0;
  }, [initData]);

  useEffect(() => {
    fetchInitData();
  }, [fetchInitData]);

  const options: Array<{ label: ReactNode; value: string }> = [
    { label: 'All', value: RewardsTypeEnum.All },
    { label: 'Simple Staking', value: RewardsTypeEnum.Simple },
    { label: 'Points Staking', value: RewardsTypeEnum.Points },
    { label: 'Farms', value: RewardsTypeEnum.Farms },
  ];

  const handleChange = useCallback((value: string) => {
    setCurrentType(value as RewardsTypeEnum);
  }, []);

  return (
    <>
      <h2 className="text-4xl lg:text-5xl font-[600] text-neutralTitle pt-8 lg:pt-10">Rewards</h2>
      {isLogin ? (
        <div>
          <div className="text-[16px] font-[600] mt-[48px]">My Rewards</div>
          {!isMD ? (
            <Segmented
              className={clsx('mt-8 lg:mt-[24px]', styles.segmented)}
              size="large"
              value={currentType}
              defaultValue={RewardsTypeEnum.All}
              onChange={handleChange}
              options={options}
            />
          ) : (
            <Select
              className={clsx(styles.select, 'mt-[24px] min-w-[164px]')}
              popupClassName={styles.selectOverlay}
              value={currentType}
              onChange={handleChange}
              options={options}
            />
          )}
          <div className="mt-6">
            <PoolsAmount currentType={currentType} />
          </div>
          {showLiquidityModule && (
            <div className="mt-8">
              <div className="mb-6 text-base font-[600] text-neutralTitle">
                Rewards Liquidity Pools
              </div>
              <LiquidityList />
            </div>
          )}
          {hasHistoryData && (
            <div className="mt-8">
              <div className="mb-6 text-base font-[600] text-neutralTitle">Claim History</div>
              {isMD ? (
                <RewardsListMobile rewardsTypeList={rewardsTypeList || []} />
              ) : (
                <RewardListPC rewardsTypeList={rewardsTypeList || []} />
              )}
            </div>
          )}
        </div>
      ) : (
        <Empty emptyText="" />
      )}
    </>
  );
}
