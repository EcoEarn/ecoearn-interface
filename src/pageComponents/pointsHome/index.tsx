import useDappList from 'hooks/useDappList';
import DappList from './components/DappList';

export default function StakeHome() {
  const { dappList, loading } = useDappList();
  return (
    <div>
      <div className="pt-[56px] pb-[24px] lg:py-[60px] lg:mt-[48px] text-center text-4xl lg:text-6xl font-semibold text-neutralTitle">
        Participate in Points Staking for high rewards
      </div>
      <DappList items={dappList || []} loading={loading} />
    </div>
  );
}
