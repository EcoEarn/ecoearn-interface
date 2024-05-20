import DappList from './components/DappList';
import useStakingHomeService from './hooks/useStakingHomeService';

export default function StakeHome() {
  const { dAppList, loading } = useStakingHomeService();
  return (
    <div className="">
      <div className="pt-[56px] pb-[24px] md:py-[80px] text-center text-4xl lg:text-6xl font-semibold text-neutralPrimary">
        Participate in Points Staking for high rewards
      </div>
      <DappList items={dAppList || []} loading={loading} />
    </div>
  );
}
