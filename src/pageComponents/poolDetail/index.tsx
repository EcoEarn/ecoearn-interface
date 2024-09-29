/* eslint-disable @next/next/no-img-element */
import StakeWithConfirm from 'components/StakeWithConfirm';
import usePoolDetailService from './hooks/usePoolDetailService';
import { Flex } from 'antd';
import AmountInfo from './components/AmountInfo';
import FaqList from 'components/FaqList';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import StakeDetail from './components/StakeDetail';
import StakeTokenTitle from 'components/StakeTokenTitle';
import BackCom from './components/BackCom';
import { PoolType } from 'types/stake';
export default function PoolDetailPage() {
  const {
    poolType,
    poolInfo,
    stakeProps,
    stakeRewards,
    isFirstStake,
    onAdd,
    onClaim,
    onExtend,
    onRenewal,
    onUnlock,
    onBack,
  } = usePoolDetailService();
  const { isLogin } = useGetLoginStatus();

  return !poolInfo ? null : (
    <Flex vertical gap={24} className="max-w-[672px] mx-auto mt-6 md:mt-[64px]">
      <div className="bg-white px-4 py-6 md:p-8 rounded-2xl border-[1px] border-solid border-neutralBorder flex flex-col gap-6">
        {stakeRewards && <BackCom onClick={onBack} />}
        <StakeTokenTitle
          imgs={poolInfo?.icons || []}
          poolType={poolType as PoolType}
          tokenSymbol={poolInfo?.stakeSymbol || ''}
          type={stakeRewards ? 'stakeRewards' : 'stake'}
          rate={poolInfo?.rate || 0}
        />
        {isLogin && poolInfo ? (
          isFirstStake || stakeRewards ? (
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
      <AmountInfo poolInfo={poolInfo || {}} poolType={poolType as PoolType} />
      <FaqList />
    </Flex>
  );
}
