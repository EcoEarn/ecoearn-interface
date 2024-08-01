import { Button, ToolTip } from 'aelf-design';
import { Flex } from 'antd';
import BigNumber from 'bignumber.js';
import CommonTooltip from 'components/CommonTooltip';
import { ZERO } from 'constants/index';
import useStakeConfig from 'hooks/useStakeConfig';
import { useMemo } from 'react';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { divDecimals } from 'utils/calculate';
import { formatTokenPrice, formatTokenSymbol, formatUSDPrice } from 'utils/format';
import useResponsive from 'utils/useResponsive';

export interface IRewardCardProps {
  totalAmount: string | number;
  frozenAmount: string | number;
  withdrawnAmount: string | number;
  claimableAmount: string | number;
  totalAmountUsd: string | number;
  frozenAmountUsd: string | number;
  withdrawnAmountUsd: string | number;
  claimableAmountUsd: string | number;
  rewardsTokenSymbol: string;
  earlyStakedAmount: string | number;
  earlyStakedAmountInUsd: string | number;
  earlyStakedPoolIsUnLock: boolean;
  decimal: number;
  onEarlyStake: () => void;
}

export default function RewardCard({
  totalAmount,
  totalAmountUsd,
  frozenAmount,
  frozenAmountUsd,
  claimableAmount,
  claimableAmountUsd,
  withdrawnAmount,
  withdrawnAmountUsd,
  rewardsTokenSymbol,
  earlyStakedAmount,
  earlyStakedAmountInUsd,
  earlyStakedPoolIsUnLock,
  decimal,
  onEarlyStake,
}: IRewardCardProps) {
  const { isLG, isSM } = useResponsive();
  const { isLogin } = useGetLoginStatus();
  const { min } = useStakeConfig();

  const formatRewardsSymbol = useMemo(() => {
    return formatTokenSymbol(rewardsTokenSymbol);
  }, [rewardsTokenSymbol]);

  const totalText = useMemo(() => {
    return !isLogin
      ? '--'
      : totalAmount
      ? `${formatTokenPrice(
          divDecimals(totalAmount, decimal || 8),
        ).toString()} ${formatRewardsSymbol}`
      : '0.00';
  }, [decimal, isLogin, formatRewardsSymbol, totalAmount]);

  const totalUsdText = useMemo(() => {
    return !isLogin
      ? '--'
      : formatUSDPrice(divDecimals(totalAmountUsd || 0, decimal || 8)).toString();
  }, [decimal, isLogin, totalAmountUsd]);

  const frozenText = useMemo(() => {
    return !isLogin
      ? '--'
      : frozenAmount
      ? `${formatTokenPrice(
          divDecimals(frozenAmount, decimal || 8),
        ).toString()} ${formatRewardsSymbol}`
      : '0.00';
  }, [decimal, frozenAmount, isLogin, formatRewardsSymbol]);

  const frozenUsdText = useMemo(() => {
    return !isLogin
      ? '--'
      : formatUSDPrice(divDecimals(frozenAmountUsd || 0, decimal || 8)).toString();
  }, [decimal, frozenAmountUsd, isLogin]);

  const claimableText = useMemo(() => {
    return !isLogin
      ? '--'
      : claimableAmount
      ? `${formatTokenPrice(
          divDecimals(claimableAmount, decimal || 8),
        ).toString()} ${formatRewardsSymbol}`
      : '0.00';
  }, [claimableAmount, decimal, isLogin, formatRewardsSymbol]);

  const claimableUsdText = useMemo(() => {
    return !isLogin
      ? '--'
      : formatUSDPrice(divDecimals(claimableAmountUsd || 0, decimal || 8)).toString();
  }, [claimableAmountUsd, decimal, isLogin]);

  const withdrawnText = useMemo(() => {
    return !isLogin
      ? '--'
      : withdrawnAmount
      ? `${formatTokenPrice(
          divDecimals(withdrawnAmount, decimal || 8),
        ).toString()} ${formatRewardsSymbol}`
      : '0.00';
  }, [decimal, isLogin, formatRewardsSymbol, withdrawnAmount]);

  const withdrawnUsdText = useMemo(() => {
    return !isLogin
      ? '--'
      : formatUSDPrice(divDecimals(withdrawnAmountUsd || 0, decimal || 8)).toString();
  }, [decimal, isLogin, withdrawnAmountUsd]);

  const stakeEarlyTotal = useMemo(() => {
    return divDecimals(
      BigNumber(frozenAmount || 0)
        .plus(BigNumber(claimableAmount || 0))
        .toString(),
      decimal || 8,
    ).toString();
  }, [claimableAmount, decimal, frozenAmount]);

  const stakeEarlyAmountNotEnough = useMemo(() => {
    return ZERO.plus(stakeEarlyTotal).lte(min);
  }, [min, stakeEarlyTotal]);

  const stakeEarlyDisabled = useMemo(() => {
    return !isLogin || stakeEarlyAmountNotEnough || earlyStakedPoolIsUnLock;
  }, [earlyStakedPoolIsUnLock, isLogin, stakeEarlyAmountNotEnough]);

  const stakeEarlyTip = useMemo(() => {
    return !isLogin
      ? ''
      : stakeEarlyAmountNotEnough
      ? ZERO.plus(stakeEarlyTotal || 0).isZero()
        ? ''
        : `Min staking ${min} ${formatRewardsSymbol}`
      : earlyStakedPoolIsUnLock
      ? 'Stake has expired, cannot be added stake.'
      : '';
  }, [
    isLogin,
    stakeEarlyAmountNotEnough,
    stakeEarlyTotal,
    min,
    formatRewardsSymbol,
    earlyStakedPoolIsUnLock,
  ]);

  const stakeEarlyAmount = useMemo(() => {
    return `${formatTokenPrice(
      BigNumber(divDecimals(earlyStakedAmount || 0, decimal || 8)),
    ).toString()} ${formatRewardsSymbol}`;
  }, [decimal, earlyStakedAmount, formatRewardsSymbol]);

  const stakeEarlyUsdAmount = useMemo(() => {
    return formatUSDPrice(
      BigNumber(divDecimals(earlyStakedAmountInUsd || 0, decimal || 8)),
    ).toString();
  }, [decimal, earlyStakedAmountInUsd]);

  const showEarlyStake = useMemo(() => {
    return !BigNumber(earlyStakedAmount || 0).isZero();
  }, [earlyStakedAmount]);

  return (
    <div>
      <Flex gap={24} justify="space-between">
        <Flex
          vertical
          align={isLG ? 'start' : 'center'}
          className="p-5 flex-1 rounded-lg bg-neutralWhiteBg border-[1px] border-solid border-neutralBorder"
        >
          <Flex gap={8} align="center">
            <span className="text-sm text-neutralTertiary font-normal flex-shrink-0">
              Total Reward
            </span>
            <CommonTooltip title="All rewards earned by staking in this pool." />
          </Flex>
          <div className="break-all mt-4 text-neutralTitle text-lg font-semibold lg:text-center text-start">
            {totalText}
          </div>
          <div className="break-all  mt-1 text-neutralSecondary text-sm font-medium lg:text-center text-start">
            {totalUsdText}
          </div>
        </Flex>
        <Flex
          vertical
          align={isLG ? 'start' : 'center'}
          className="p-5 rounded-lg flex-1 bg-neutralWhiteBg border-[1px] border-solid border-neutralBorder"
        >
          <Flex gap={8} align="center">
            <span className="text-sm text-neutralTertiary font-normal flex-shrink-0">
              Withdrawn
            </span>
            <CommonTooltip title="Rewards that have reached the release point." />
          </Flex>
          <div className="mt-4 text-neutralTitle text-lg font-semibold lg:text-center text-start break-all">
            {withdrawnText}
          </div>
          <div className="mt-1 text-neutralSecondary text-sm font-medium lg:text-center text-start break-all">
            {withdrawnUsdText}
          </div>
        </Flex>
      </Flex>
      <div className="mt-6 p-5 rounded-lg bg-brandBg">
        <Flex justify="space-between" gap={16} vertical={isLG}>
          <Flex gap={16} justify="start" className="lg:flex-1">
            <Flex vertical align={isLG ? 'start' : 'center'} className="flex-1">
              <Flex gap={8} align="center">
                <span className="text-sm text-neutralTertiary font-normal">Frozen</span>
                <CommonTooltip title="Before the release point, the rewards are frozen. If you stake or add liquidity early, the amount of frozen rewards needs to be deducted accordingly." />
              </Flex>
              <div className="break-all  mt-4 text-brandPressed text-base font-semibold text-left lg:text-center">
                {frozenText}
              </div>
              <div className="break-all  mt-1 text-neutralSecondary text-sm font-medium text-left lg:text-center">
                {frozenUsdText}
              </div>
            </Flex>
            <Flex vertical align={isLG ? 'start' : 'center'} className="flex-1">
              <Flex gap={8} align="center">
                <span className="text-sm text-neutralTertiary font-normal">Withdrawable</span>
                <CommonTooltip title="After reaching the release point, the rewards can be withdrawn to the wallet. If you stake or add liquidity early, the amount of withdrawable rewards will be deducted accordingly." />
              </Flex>
              <div className="break-all  mt-4 text-brandPressed text-base font-semibold text-left lg:text-center">
                {claimableText}
              </div>
              <div className="break-all  mt-1 text-neutralSecondary text-sm font-medium text-left lg:text-center">
                {claimableUsdText}
              </div>
            </Flex>
          </Flex>
          <Flex align="center">
            <ToolTip title={stakeEarlyTip}>
              <Button
                className="gap-2 !rounded-md"
                block
                type="primary"
                size="medium"
                disabled={stakeEarlyDisabled}
                onClick={onEarlyStake}
              >
                <span>Stake early</span>
                <CommonTooltip
                  className="fill-white"
                  title="Rewards earned from staking can be staked directly, without being withdrawn to the wallet, including frozen and withdrawable rewards."
                />
              </Button>
            </ToolTip>
          </Flex>
        </Flex>
        {showEarlyStake && (
          <Flex
            className="border-neutralDivider pt-4 mt-4 border-[1px] border-solid border-x-0 border-b-0"
            justify="space-between"
            align="start"
            gap={16}
            vertical={isLG}
          >
            <Flex gap={8} align="center">
              <span className="text-sm font-normal text-neutralTertiary">Early staked amount</span>
              <CommonTooltip title="The amount of rewards staked early." />
            </Flex>
            <Flex align={isLG ? 'start' : 'end'} vertical gap={4}>
              <span className="break-all text-base text-brandPressed font-medium">
                {stakeEarlyAmount}
              </span>
              <span className="break-all text-sm text-neutralSecondary font-medium">
                {stakeEarlyUsdAmount}
              </span>
            </Flex>
          </Flex>
        )}
      </div>
    </div>
  );
}
