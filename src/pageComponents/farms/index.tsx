// import SimpleStakeList from 'components/SimpleStakeList';
import ComingSoon from '../pointsHome/components/ComingSoon';

export default function Farm() {
  return (
    // <SimpleStakeList
    //   title="Farms"
    //   description="Stake LP tokens to earn high rewards efficiently."
    //   poolType="Lp"
    // />
    <>
      <div className="pt-[24px] pb-[24px] text-[28px] lg:pt-[64px] lg:pb-[24px] lg:text-[36px] font-[600]	 text-neutralTitle">
        Farms
      </div>
      <ComingSoon
        name="Coming Soon"
        desc="Stake your liquidity pool tokens and unlock high-yield rewards!"
      />
    </>
  );
}
