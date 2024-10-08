import SimpleStakeList from 'components/SimpleStakeList';
// import ComingSoon from '../pointsHome/components/ComingSoon';

export default function Farm() {
  return (
    <>
      <SimpleStakeList
        title="Farms"
        description="Stake LP tokens to earn high rewards efficiently."
        poolType="Lp"
      />
      {/* <ComingSoon
        name="Coming soon"
        desc="Stake your liquidity pool tokens and unlock high-yield rewards!"
      /> */}
    </>
  );
}
