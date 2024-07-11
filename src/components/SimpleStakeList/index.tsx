import StakeCard from 'components/StakeCard';
import useSimpleStakeListService from './hooks/useSimpleStakeListService';
import { PoolTypeEnum } from 'components/StakeToken';
import clsx from 'clsx';
import { RightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

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
    <div className="flex flex-col gap-6 lg:gap-12">
      <div className="flex flex-col gap-2 lg:gap-4">
        <div className="pt-[32px] lg:pt-[48px] text-4xl font-semibold text-neutral-title">
          {title}
        </div>
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <span className="text-neutralSecondary text-base font-medium">{description}</span>
          {poolType === 'Lp' && (
            <span
              className="text-sm font-medium text-brandDefault cursor-pointer"
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
      <div className="flex flex-col gap-6">
        {stakeData.map((item, index) => {
          return (
            <StakeCard
              type={poolType === 'Lp' ? PoolTypeEnum.Lp : PoolTypeEnum.Token}
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
      </div>
    </div>
  );
}
