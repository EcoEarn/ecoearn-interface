import { Button } from 'aelf-design';
import SkeletonImage from 'components/SkeletonImage';
import TokenTextIcon from 'components/TokenTextIcon';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import { useMemo } from 'react';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { formatTokenSymbol } from 'utils/format';

/* eslint-disable @next/next/no-img-element */
interface IStakeTokenTitleProps {
  tokenSymbol: string;
  img?: string;
  type?: 'stake' | 'rewards' | 'stakeRewards';
}

export default function StakeTokenTitle({
  img,
  tokenSymbol,
  type = 'stake',
}: IStakeTokenTitleProps) {
  const { isLogin } = useGetLoginStatus();
  const { checkLogin } = useCheckLoginAndToken();

  const tokenName = useMemo(() => {
    return formatTokenSymbol(tokenSymbol);
  }, [tokenSymbol]);

  const title = useMemo(() => {
    if (type === 'stakeRewards') {
      return `Stake ${tokenName} Rewards`;
    }
    return `${tokenName} ${type === 'stake' ? 'Staking' : 'Staking Rewards'}`;
  }, [tokenName, type]);

  return (
    <div>
      {img ? (
        <SkeletonImage
          alt="token"
          img={img}
          width={64}
          height={64}
          className="mx-auto rounded-[50%] block object-cover"
        />
      ) : (
        <div className="w-[64px] h-[64px] mx-auto">
          <TokenTextIcon size="large" tokenName={tokenName} />
        </div>
      )}
      <p className="text-center mt-4 text-2xl font-semibold !font-poppinsMedium">{title}</p>
      {!isLogin && (
        <>
          <p className="mt-6 text-center">Please connect your wallet to continue</p>
          <Button
            className="!rounded-lg mt-6"
            block
            type="primary"
            onClick={() => {
              checkLogin();
            }}
          >
            Connect Wallet
          </Button>
        </>
      )}
    </div>
  );
}
