/* eslint-disable @next/next/no-img-element */
import StakeWithConfirm from 'components/StakeWithConfirm';
import usePoolDetailService from './hooks/usePoolDetailService';
import { Flex } from 'antd';
import AmountInfo from './components/AmountInfo';
import FaqList from 'components/FaqList';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import StakeDetail from './components/StakeDetail';
import StakeTokenTitle from 'components/StakeTokenTitle';

export default function PoolDetailPage() {
  const { poolInfo, stakeProps, isFirstStake, onAdd, onClaim, onExtend, onRenewal, onUnlock } =
    usePoolDetailService();
  const { isLogin } = useGetLoginStatus();

  return (
    <Flex vertical gap={24} className="max-w-[677px] mx-auto mt-6 md:mt-[64px]">
      <div className="bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder">
        <StakeTokenTitle img={poolInfo?.icons?.[0]} tokenSymbol={poolInfo?.stakeSymbol || ''} />
        {isLogin && poolInfo ? (
          isFirstStake ? (
            <StakeWithConfirm {...stakeProps} />
          ) : (
            <StakeDetail
              poolInfo={poolInfo}
              onAdd={onAdd}
              onClaim={onClaim}
              onExtend={onExtend}
              onRenewal={onRenewal}
              onUnlock={onUnlock}
            />
          )
        ) : null}
      </div>
      <AmountInfo poolInfo={poolInfo || {}} />
      <FaqList />
    </Flex>
  );
}
