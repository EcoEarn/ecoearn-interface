import { Button, ToolTip } from 'aelf-design';
import CommonTooltip from 'components/CommonTooltip';
import ConfirmModal from 'components/ConfirmModal';
import useRewardsAggregation from 'pageComponents/rewards/hooks/useRewardsAggregation';
import { forwardRef, useLayoutEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { RightOutlined } from '@ant-design/icons';
import Empty from 'components/Empty';
import { RewardsTypeEnum } from 'pageComponents/rewards';
import { formatTokenSymbol } from 'utils/format';
import { useRouter } from 'next/navigation';
import { useTimeout } from 'ahooks';
import RewardsPoolName from '../RewardsPoolName';

export default forwardRef(function PoolsAmount({ currentType }: { currentType: RewardsTypeEnum }) {
  const {
    earlyStake,
    onWithdraw,
    confirmModalType,
    confirmModalVisible,
    confirmModalLoading,
    confirmModalContent,
    confirmModalStatus,
    confirmModalTransactionId,
    confirmModalOnClose,
    confirmModalErrorTip,
    dataSource,
    handleDetail,
    confirmModalOnConfirm,
    onClickEmptyBtn,
  } = useRewardsAggregation({
    currentType,
  });

  const renderEmpty = useMemo(() => {
    return (
      <Empty
        emptyBtnText="Stake"
        emptyText="Participate in staking to earn rewards!"
        onClick={onClickEmptyBtn}
      />
    );
  }, [onClickEmptyBtn]);

  const router = useRouter();

  return (
    <>
      {dataSource && dataSource?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[24px]">
          {dataSource?.map((rewardItem, index) => {
            const amountTip = `All ${formatTokenSymbol(
              rewardItem?.rewardsTokenName,
            )} rewards claimed in the ${rewardItem?.poolName} pool.`;
            const icons = rewardItem?.tokenIcon;
            return (
              <div
                key={index}
                className="col-span-1 flex flex-col border-solid border-neutralBorder border-[1px] rounded-[24px] p-6 overflow-hidden bg-neutralWhiteBg transition-all ease-in-out duration-300 hover:shadow-xl hover:ease hover:duration-300 group"
              >
                <div className="flex justify-between items-center">
                  <RewardsPoolName
                    poolType={rewardItem?.poolType}
                    name={rewardItem?.poolName}
                    icons={icons}
                    rate={rewardItem?.rate}
                  />
                  {/* <div
                      className="flex gap-1 items-center text-sm font-medium text-brandDefault w-fit cursor-pointer"
                      onClick={() => {
                        handleDetail(rewardItem);
                      }}
                    >
                      <span>Details</span>
                      <RightOutlined
                        className={clsx('w-[14px] h-[14px] text-sm leading-[14px] text-brandDefault')}
                        width={14}
                        height={14}
                      />
                    </div> */}
                </div>
                <div className="flex-1 rounded-xl mt-[32px] flex flex-col md:flex-row gap-y-4 gap-x-1  justify-between items-start relative">
                  <div>
                    <div className="flex gap-1 items-center">
                      <span className="text-[16px] font-[500]  text-neutralTertiary">
                        Total rewards
                      </span>
                      {/* <CommonTooltip title={amountTip} /> */}
                    </div>
                    <div className="mt-[8px] break-all text-neutralTitle flex gap-2 items-end">
                      <span className="text-lg text-[18px] font-[600]">
                        {rewardItem?.amount?.totalRewards}
                      </span>
                      <span className="text-[16px] flex-shrink-0">
                        {rewardItem?.amount?.rewardsTokenName}
                      </span>
                    </div>
                    <div className="text-[14px] text-neutralSecondary break-all">
                      {rewardItem?.amount?.totalRewardsUsd}
                    </div>
                  </div>
                  {/* <div className="w-full md:w-fit md:flex-col gap-4 flex justify-between">
                      {rewardItem.supportEarlyStake && (
                        <ToolTip title={rewardItem.earlyStakeTip}>
                          <Button
                            onClick={() => {
                              earlyStake(rewardItem);
                            }}
                            size="medium"
                            type="primary"
                            className="md:!w-[100px] !rounded-md flex-1 md:flex-none"
                            disabled={rewardItem.earlyStakeDisabled}
                          >
                            Stake early
                          </Button>
                        </ToolTip>
                      )}
                      <ToolTip title={rewardItem.withdrawTip}>
                        <Button
                          ghost={!rewardItem.withdrawDisabled}
                          type="primary"
                          onClick={() => {
                            onWithdraw(rewardItem);
                          }}
                          size="medium"
                          className="md:!w-[100px] !rounded-md flex-1 md:flex-none"
                          disabled={rewardItem.withdrawDisabled}
                        >
                          Withdraw
                        </Button>
                      </ToolTip>
                    </div> */}
                  <div className="hidden lg:flex w-full h-full absolute -bottom-[20px] left-0 opacity-0 transition-all ease-in-out duration-300 group-hover:bg-white group-hover:opacity-100 group-hover:bottom-0 group-hover:transition-all group-hover:ease-in-out group-hover:duration-300 items-end">
                    <Button
                      className="w-full !h-[40px] lg:self-center !rounded-lg m-auto"
                      type="primary"
                      onClick={() => {
                        router.push(
                          `/rewards-detail?poolId=${rewardItem.poolId}&dappId=${rewardItem.dappId}&poolType=${rewardItem.poolType}`,
                        );
                      }}
                    >
                      View details
                    </Button>
                  </div>
                </div>
                <Button
                  className="!h-[40px] !rounded-lg mt-[20px] lg:!hidden"
                  block
                  type="primary"
                  onClick={() => {
                    router.push(
                      `/rewards-detail?poolId=${rewardItem.poolId}&dappId=${rewardItem.dappId}&poolType=${rewardItem.poolType}`,
                    );
                  }}
                >
                  View details
                </Button>
              </div>
            );
          })}
          <ConfirmModal
            type={confirmModalType}
            content={confirmModalContent}
            errorTip={confirmModalErrorTip}
            status={confirmModalStatus}
            loading={confirmModalLoading}
            visible={confirmModalVisible}
            onClose={confirmModalOnClose}
            onConfirm={() => {
              confirmModalOnConfirm();
            }}
            transactionId={confirmModalTransactionId}
          />
        </div>
      ) : (
        renderEmpty
      )}
    </>
  );
});
