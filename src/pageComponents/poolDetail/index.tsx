import StakeWithConfirm from 'components/StakeWithConfirm';
import usePoolDetailService from './hooks/usePoolDetailService';
import { Flex } from 'antd';
import AmountInfo from './components/AmountInfo';
import FaqList from './components/FaqList';
import { useMemo } from 'react';
import { formatTokenSymbol } from 'utils/format';
import SkeletonImage from 'components/SkeletonImage';
import { Button } from 'aelf-design';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';

export default function PoolDetailPage() {
  const { poolInfo, stakeProps, isFirstStake } = usePoolDetailService();
  const { checkLogin } = useCheckLoginAndToken();
  const { isLogin } = useGetLoginStatus();

  const title = useMemo(() => {
    return `${formatTokenSymbol(poolInfo?.stakeSymbol || '')} Staking`;
  }, [poolInfo?.stakeSymbol]);

  return (
    <Flex vertical gap={24} className="max-w-[677px] mx-auto mt-6 md:mt-[64px]">
      <div className="bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder mt-6">
        <SkeletonImage
          img={poolInfo?.icons?.[0]}
          width={64}
          height={64}
          className="mx-auto rounded-[50%] block object-cover"
        />
        <p className="text-center mt-4 text-2xl  font-semibold !mb-6">{title}</p>
        {!isLogin ? (
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
        ) : isFirstStake ? (
          <StakeWithConfirm {...stakeProps} />
        ) : null}
      </div>
      <AmountInfo poolInfo={poolInfo || {}} />
      <FaqList />
    </Flex>
  );
}
