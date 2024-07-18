import { Flex } from 'antd';
import CommonTooltip from 'components/CommonTooltip';
import { useMemo } from 'react';
import { formatNumber, formatTokenPrice, formatUSDPrice } from 'utils/format';
import { LiquidityListTypeEnum } from '../hooks/useLiquidityListService';
import { Button, ToolTip } from 'aelf-design';
import StakeToken, { PoolTypeEnum } from 'components/StakeToken';
import RateTag from 'components/RateTag';

export default function ItemCard({
  data,
  currentList,
  onAdd,
  onRemove,
  onStake,
}: {
  data: ILiquidityItem & {
    addBtnDisabled: boolean;
    stakeBtnDisabled: boolean;
    removeBtnDisabled: boolean;
    addBtnTip: string;
    stakeBtnTip: string;
    removeBtnTip: string;
  };
  onRemove: (data: ILiquidityItem) => void;
  onAdd: (data: ILiquidityItem) => void;
  onStake: (data: ILiquidityItem) => void;
  currentList: LiquidityListTypeEnum;
}) {
  const {
    banlance,
    value,
    tokenAAmount,
    tokenBAmount,
    lpSymbol,
    tokenASymbol,
    tokenBSymbol,
    icons,
    rate,
    decimal,
    stakingAmount,
    addBtnDisabled,
    stakeBtnDisabled,
    addBtnTip,
    stakeBtnTip,
    removeBtnDisabled,
    removeBtnTip,
  } = data || {};

  const balanceText = useMemo(() => {
    return formatTokenPrice(banlance || 0).toString();
  }, [banlance]);

  const stakingText = useMemo(() => {
    return formatTokenPrice(stakingAmount || 0).toString();
  }, [stakingAmount]);

  const valueText = useMemo(() => {
    return formatUSDPrice(value).toString();
  }, [value]);

  const amountOneText = useMemo(() => {
    return `${formatNumber(tokenAAmount).toString()}`;
  }, [tokenAAmount]);

  const amountTwoText = useMemo(() => {
    return `${formatNumber(tokenBAmount).toString()}`;
  }, [tokenBAmount]);

  return (
    <section className="flex gap-8 flex-col bg-neutralWhiteBg border-[1px] px-4 py-6 border-neutralBorder rounded-[12px] border-solid text-base">
      <Flex justify="space-between" align="center">
        <StakeToken
          icons={icons}
          tokenName={lpSymbol}
          type={PoolTypeEnum.Lp}
          className="lg:!items-center max-w-[200px]"
          tokenSymbolClassName="!text-base"
          size="middle"
          symbolDigs={12}
        />
        <RateTag
          value={Number(rate) * 100}
          className="!text-base lg:!text-base !font-medium !px-2 !py-1 !leading-4"
        />
      </Flex>

      <Flex justify="space-between" className="text-balance font-medium" align="center">
        <Flex gap={8} align="center">
          <span className="text-neutralTertiary">Balance</span>
          {currentList === LiquidityListTypeEnum.My && (
            <CommonTooltip title="The amount of LP you hold, excluding the LP in staking." />
          )}
        </Flex>
        <span className="text-neutralTitle">{balanceText}</span>
      </Flex>
      {currentList === LiquidityListTypeEnum.My && (
        <Flex justify="space-between" className="text-balance font-medium" align="center">
          <Flex gap={8} align="center">
            <span className="text-neutralTertiary">Staking</span>
            <CommonTooltip title="Your LP amount in staking." />
          </Flex>
          <span className="text-neutralTitle">{stakingText}</span>
        </Flex>
      )}
      <Flex justify="space-between" className="text-balance font-medium" align="center">
        <Flex gap={8} align="center">
          <span className="text-neutralTertiary">Value</span>
          {currentList === LiquidityListTypeEnum.My && (
            <CommonTooltip title="The total value of LP obtained by adding liquidity, including the balance and staking amount." />
          )}
        </Flex>
        <span className="text-neutralTitle">{valueText}</span>
      </Flex>
      <Flex justify="space-between" className="text-balance font-medium" align="center">
        <Flex gap={8} align="center">
          <span className="text-neutralTertiary">Amount</span>
          <CommonTooltip title='"Amount" includes the added liquidity as well as the reward you earned through the Swap.' />
        </Flex>
        <span className="text-neutralTitle flex gap-1 items-center truncate max-w-[118px]">
          <span>{amountOneText}</span>
          <ToolTip title={tokenASymbol?.length > 6 ? tokenASymbol : ''}>
            <span className="truncate">{tokenASymbol}</span>
          </ToolTip>
        </span>
      </Flex>
      <Flex justify="space-between" className="text-balance font-medium" align="center">
        <Flex gap={8} align="center">
          <span className="text-neutralTertiary">Amount</span>
          <CommonTooltip title='"Amount" includes the added liquidity as well as the reward you earned through the Swap.' />
        </Flex>
        <span className="text-neutralTitle flex gap-1 items-center truncate max-w-[118px]">
          <span>{amountTwoText}</span>
          <ToolTip title={tokenBSymbol?.length > 6 ? tokenBSymbol : ''}>
            <span className="truncate">{tokenBSymbol}</span>
          </ToolTip>
        </span>
      </Flex>
      <Flex gap={16} vertical>
        <ToolTip title={addBtnTip}>
          <Button
            block
            type="primary"
            size="medium"
            className="!rounded-md"
            disabled={addBtnDisabled}
            onClick={() => {
              onAdd(data);
            }}
          >
            Add & Stake
          </Button>
        </ToolTip>

        {currentList === LiquidityListTypeEnum.My && (
          <div className="flex gap-4">
            <ToolTip title={stakeBtnTip}>
              <Button
                type="primary"
                ghost
                block
                size="medium"
                className="!rounded-md !flex-1"
                disabled={stakeBtnDisabled}
                onClick={() => {
                  onStake(data);
                }}
              >
                Stake
              </Button>
            </ToolTip>
            <ToolTip title={removeBtnTip}>
              <Button
                type="primary"
                ghost
                block
                size="medium"
                disabled={removeBtnDisabled}
                className="!rounded-md !flex-1"
                onClick={() => {
                  onRemove(data);
                }}
              >
                Remove
              </Button>
            </ToolTip>
          </div>
        )}
      </Flex>
    </section>
  );
}
