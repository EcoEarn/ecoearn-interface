import SimpleStakeList from 'components/SimpleStakeList';

export default function Farm() {
  return (
    <SimpleStakeList
      title="Liquidity Staking"
      description="Stake LP tokens to gain rewards."
      poolType="Lp"
    />
  );
}
