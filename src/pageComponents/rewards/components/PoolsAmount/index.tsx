import { Button, ToolTip } from 'aelf-design';
import CommonTooltip from 'components/CommonTooltip';
import ConfirmModal from 'components/ConfirmModal';
import useRewardsAggregation from 'pageComponents/rewards/hooks/useRewardsAggregation';
import { forwardRef, useMemo } from 'react';
import clsx from 'clsx';
import { RightOutlined } from '@ant-design/icons';
import Empty from 'components/Empty';
import { RewardsTypeEnum } from 'pageComponents/rewards';
import { formatTokenSymbol } from 'utils/format';
import RateTag from 'components/RateTag';
import ComingSoon from '../ComingSoon';

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
        emptyText="Participating in staking can earn rewards."
        onClick={onClickEmptyBtn}
      />
    );
  }, [onClickEmptyBtn]);

  return (
    <>
      {dataSource && dataSource?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[24px]">
          {dataSource?.map((rewardItem, index) => {
            const amountTip = `All ${formatTokenSymbol(
              rewardItem?.rewardsTokenName,
            )} rewards claimed in the ${rewardItem?.poolName} pool.`;
            const poolNameFormat = formatTokenSymbol(rewardItem?.poolName);
            return (
              <div
                key={index}
                className="col-span-1 flex flex-col border-solid border-neutralBorder border-[1px] rounded-[24px] p-6 overflow-hidden bg-neutralWhiteBg"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-neutralTitle font-semibold">
                      {poolNameFormat}
                    </span>
                    {Number(rewardItem?.rate || 0) !== 0 && (
                      <RateTag value={Number(rewardItem?.rate || 0) * 100} />
                    )}
                  </div>
                  <div
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
                  </div>
                </div>
                <div className="p-4 flex-1 bg-brandBg rounded-xl mt-4 flex flex-col md:flex-row gap-y-4 gap-x-1  justify-between items-start">
                  <div>
                    <div className="flex gap-2 items-center">
                      <span className="text-base font-medium text-neutralTertiary">
                        Total rewards
                      </span>
                      <CommonTooltip title={amountTip} />
                    </div>
                    <div className="mt-2 break-all text-neutralTitle flex gap-2 items-end">
                      <span className="text-lg font-semibold">
                        {rewardItem?.amount?.totalRewards}
                      </span>
                      <span className="text-base font-normal flex-shrink-0">
                        {rewardItem?.amount?.rewardsTokenName}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-neutralSecondary font-medium break-all">
                      {rewardItem?.amount?.totalRewardsUsd}
                    </div>
                  </div>
                  <div className="w-full md:w-fit md:flex-col gap-4 flex justify-between">
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
