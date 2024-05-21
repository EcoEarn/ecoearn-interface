import StackCard from 'components/StakeCard';
import useSimpleStakeListService from './hooks/useSimpleStakeListService';

export interface IStakeListProps {
  title: string;
  description: string;
  poolType: 'Token' | 'Lp';
}

export default function SimpleStakeList({ title, description, poolType }: IStakeListProps) {
  const { stakeData, onClaim, onUnlock, onExtend, onAdd, onStake, isLogin } =
    useSimpleStakeListService({
      poolType,
    });
  return (
    <div className="flex flex-col gap-6 lg:gap-12">
      <div className="flex flex-col gap-2 lg:gap-4">
        <div className="pt-[32px] lg:pt-[48px] text-4xl font-semibold text-neutral-title">
          {title}
        </div>
        <div className="text-neutralSecondary text-base font-medium">{description}</div>
      </div>
      <div className="flex flex-col gap-6">
        {stakeData.map((item, index) => {
          return (
            <StackCard
              type={poolType}
              key={index}
              data={item}
              isLogin={isLogin}
              onStake={onStake}
              onClaim={onClaim}
              onAdd={onAdd}
              onUnlock={onUnlock}
              onExtend={onExtend}
            />
          );
        })}
      </div>
    </div>
  );
}
