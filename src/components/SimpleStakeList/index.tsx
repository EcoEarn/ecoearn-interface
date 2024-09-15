import StakeCard from 'components/StakeCard';
import useSimpleStakeListService from './hooks/useSimpleStakeListService';
import { PoolType } from 'components/StakeToken';
import clsx from 'clsx';
import { RightOutlined } from '@ant-design/icons';
import { Skeleton } from 'antd';

export interface IStakeListProps {
  title: string;
  description: string;
  poolType: 'Token' | 'Lp';
}

export default function SimpleStakeList({ title, description, poolType }: IStakeListProps) {
  const {
    stakeData,
    onClaim,
    onUnlock,
    onExtend,
    onAdd,
    onStake,
    isLogin,
    onRenewal,
    renewText,
    goLiquidity,
  } = useSimpleStakeListService({
    poolType,
  });

  return (
    <>
      <div className="flex flex-col">
        <div className="pt-[24px] pb-[24px] text-[28px] lg:pt-[64px] lg:pb-[24px] font-[600] lg:text-[36px] text-neutralTitle">
          {title}
        </div>
        <div className="md:items-center">
          {poolType === 'Lp' && (
            <span
              className="text-sm text-brandDefault font-[600] cursor-pointer inline-block mb-[24px]"
              onClick={goLiquidity}
            >
              My Liquidity
              <RightOutlined
                className={clsx('w-[14px] h-[14px] text-sm leading-[14px] text-brandDefault ml-2')}
                width={14}
                height={14}
              />
            </span>
          )}
        </div>
      </div>
      <div className="grid gap-[16px] grid-cols-1 lg:grid-cols-auto-fill-400">
        {stakeData.length > 0 ? (
          <>
            {stakeData.map((item, index) => {
              return (
                <StakeCard
                  type={poolType === 'Lp' ? PoolType['LP'] : PoolType['TOKEN']}
                  key={index}
                  data={item}
                  isLogin={isLogin}
                  onStake={onStake}
                  onClaim={onClaim}
                  onAdd={onAdd}
                  onUnlock={onUnlock}
                  onExtend={onExtend}
                  onRenewal={onRenewal}
                  renewText={renewText || []}
                />
              );
            })}
          </>
        ) : (
          <>
            {[1, 2].map((list, index) => {
              return (
                <div
                  key={index}
                  className="stake-card h-[156px] lg:h-[230px] lg:w-[443px] flex flex-col lg:gap-[64px] gap-[32px] px-4 py-4 md:px-8 md:py-8 rounded-xl border border-solid border-neutralDivider bg-neutralWhiteBg "
                >
                  <Skeleton avatar active paragraph={{ rows: 2 }} round />
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
