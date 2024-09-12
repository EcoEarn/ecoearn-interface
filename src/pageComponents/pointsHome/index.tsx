// import useDappList from 'hooks/useDappList';
// import DappList from './components/DappList';
import ComingSoon from './components/ComingSoon';

export default function StakeHome() {
  // const { dappList, loading } = useDappList();
  return (
    <div>
      <div className="pt-[24px] pb-[24px] text-[28px] lg:pt-[64px] lg:pb-[24px] lg:text-[36px] font-[600]	 text-neutralTitle">
        Points staking
      </div>
      {/* <DappList items={dappList || []} loading={loading} /> */}
      <ComingSoon name={'Coming soon'} desc={'Stake your points to earn exclusive rewards!'} />
    </div>
  );
}
