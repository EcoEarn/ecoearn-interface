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
import { getPoolRewards, getRewardsList, getRewardsType, liquidityMarket } from 'api/request';
import { useWalletService } from 'hooks/useWallet';
import useLoading from 'hooks/useLoading';
import ComingSoon from './components/ComingSoon';
import LiquidityList from 'pageComponents/liquidity/components/LiquidityList';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import Empty from 'components/Empty';
import { PoolType } from 'types/stake';

export enum RewardsTypeEnum {
  'All' = 'all',
  'Points' = 'points',
  'Simple' = 'simple',
  'Farms' = 'farms',
}

export default function Rewards() {
  const { isLogin } = useGetLoginStatus();
  const [claimData, setClaimData] = useState<Array<IRewardListItem>>();
  const { isMD } = useResponsive();
  const { wallet } = useWalletService();
  const { showLoading, closeLoading, visible } = useLoading();
  const [currentType, setCurrentType] = useState<RewardsTypeEnum>(RewardsTypeEnum.All);
  const [rewardsTypeList, setRewardsTypeList] = useState<Array<IRewardsTypeItem>>();
  const { showLiquidityModule } = useGetCmsInfo() || {};
  const [loading, setLoading] = useState(false);
  const [rewardsData, setRewardsData] = useState<Array<IPoolRewardsItem>>();
  const [liquidityData, setLiquidityData] = useState<Array<ILiquidityItem>>();
  const [total, setTotal] = useState(0);

  console.log('====showLiquidityModule', showLiquidityModule);

  const fetchInitData = useCallback(async () => {
    if (!isLogin) return;
    try {
      showLoading();
      setLoading(true);
      const [rewardsList, rewardsTypeList, rewardsData, liquidityData] = await Promise.all([
        getRewardsList({
          poolType: 'All',
          id: 'all',
          address: wallet?.address || '',
          skipCount: 0,
          maxResultCount: 10,
        }),
        getRewardsType(),
        getPoolRewards({
          address: wallet?.address || '',
          poolType: PoolType.ALL,
        }),
        liquidityMarket({ address: wallet?.address || '' }),
      ]);
      closeLoading();
      setLoading(false);
      const { items, totalCount } = rewardsList || {};
      setClaimData(items || []);
      const total = totalCount || 0;
      setTotal(total > 10000 ? 10000 : total);
      if (rewardsTypeList && rewardsTypeList?.length) {
        setRewardsTypeList(rewardsTypeList);
      }
      setRewardsData(rewardsData || []);
      setLiquidityData(liquidityData);
    } catch (err) {
      console.error(err);
    } finally {
      closeLoading();
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin, showLoading, closeLoading]);

  const hasHistoryData = useMemo(() => {
    return claimData && claimData?.length > 0;
  }, [claimData]);

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
        loading ? null : (
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
              <PoolsAmount currentType={currentType} initData={rewardsData || []} />
            </div>
            {showLiquidityModule && (
              <div className="mt-8">
                <div className="mb-6 text-base font-[600] text-neutralTitle">
                  Rewards Liquidity Pools
                </div>
                <LiquidityList initData={liquidityData} />
              </div>
            )}
            {hasHistoryData && (
              <div className="mt-8">
                <div className="mb-6 text-base font-[600] text-neutralTitle">Claim History</div>
                {isMD ? (
                  <RewardsListMobile
                    rewardsTypeList={rewardsTypeList || []}
                    initData={claimData}
                    total={total}
                  />
                ) : (
                  <RewardListPC
                    rewardsTypeList={rewardsTypeList || []}
                    initData={claimData}
                    total={total}
                  />
                )}
              </div>
            )}
          </div>
        )
      ) : (
        <Empty emptyText="" />
      )}
    </>
  );
}
