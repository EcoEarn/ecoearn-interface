import { Button, ToolTip } from 'aelf-design';
import CommonTooltip from 'components/CommonTooltip';
import ConfirmModal from 'components/ConfirmModal';
import useRewardsAggregation from 'pageComponents/rewards/hooks/useRewardsAggregation';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { RightOutlined } from '@ant-design/icons';
import Empty from 'components/Empty';
import { RewardsTypeEnum } from 'pageComponents/rewards';
import { formatTokenSymbol } from 'utils/format';
import { useRouter } from 'next/navigation';

export default forwardRef(function PoolsAmount({
  currentType,
  visible,
}: {
  currentType: RewardsTypeEnum;
  visible: Boolean;
}) {
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
    fetchDone,
    handleDetail,
    confirmModalOnConfirm,
    onClickEmptyBtn,
  } = useRewardsAggregation({
    currentType,
  });

  const renderEmpty = useMemo(() => {
    return (
      <>
        {fetchDone && !visible && (
          <Empty
            emptyBtnText="Stake"
            emptyText="Participating in staking can earn rewards."
            onClick={onClickEmptyBtn}
          />
        )}
      </>
    );
  }, [onClickEmptyBtn, fetchDone, visible]);

  const router = useRouter();

  return (
    <>
      {dataSource && dataSource?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[24px]">
          {dataSource?.map((rewardItem, index) => {
            const amountTip = `All ${formatTokenSymbol(
              rewardItem?.rewardsTokenName,
            )} rewards claimed in the ${rewardItem?.poolName} pool.`;
            const poolNameFormat = formatTokenSymbol(rewardItem?.poolName);
            const icons = rewardItem?.tokenIcon;
            return (
              <div
                key={index}
                className="col-span-1 flex flex-col border-solid border-neutralBorder border-[1px] rounded-[24px] p-6 overflow-hidden bg-neutralWhiteBg transition-all ease-in-out duration-300 hover:shadow-xl hover:ease hover:duration-300 group"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-[16px]">
                    {icons && <img className="w-[48px]" src={icons} alt="" />}
                    <span className="text-[20px] text-neutralTitle font-[600]">
                      {poolNameFormat}
                    </span>
                    {/* {Number(rewardItem?.rate || 0) !== 0 && (
                        <RateTag value={Number(rewardItem?.rate || 0) * 100} />
                      )} */}
                  </div>
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
                  <div className="w-full h-full absolute -bottom-[20px] left-0 opacity-0 transition-all ease-in-out duration-300 group-hover:bg-white group-hover:opacity-100 group-hover:bottom-0 group-hover:transition-all group-hover:ease-in-out group-hover:duration-300 flex items-end">
                    <Button
                      className="w-full !h-[40px] lg:self-center !rounded-lg m-auto"
                      type="primary"
                      onClick={() => {
                        router.push(
                          `/rewards-detail?poolId=${rewardItem.poolId}&poolType=${rewardItem.poolType}`,
                        );
                      }}
                    >
                      View details
                    </Button>
                  </div>
                </div>
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
