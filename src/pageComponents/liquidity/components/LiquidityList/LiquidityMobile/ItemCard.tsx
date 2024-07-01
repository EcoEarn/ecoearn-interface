import { Flex } from 'antd';
import CommonTooltip from 'components/CommonTooltip';
import { useMemo } from 'react';
import { formatTokenPrice, formatUSDPrice } from 'utils/format';
import { LiquidityListTypeEnum } from '../hooks/useLiquidityListService';
import { Button, ToolTip } from 'aelf-design';
import StakeToken, { PoolTypeEnum } from 'components/StakeToken';
import RateTag from 'components/RateTag';
import { divDecimals } from 'utils/calculate';

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
    addBtnTip: string;
    stakeBtnTip: string;
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
    addBtnDisabled,
    stakeBtnDisabled,
    addBtnTip,
    stakeBtnTip,
  } = data || {};

  const balanceText = useMemo(() => {
    return formatTokenPrice(banlance).toString();
  }, [banlance]);

  const valueText = useMemo(() => {
    return formatUSDPrice(value).toString();
  }, [value]);

  const amountOneText = useMemo(() => {
    return `${formatTokenPrice(tokenAAmount).toString()} ${tokenASymbol}`;
  }, [tokenAAmount, tokenASymbol]);

  const amountTwoText = useMemo(() => {
    return `${formatTokenPrice(tokenBAmount).toString()} ${tokenBSymbol}`;
  }, [tokenBAmount, tokenBSymbol]);

  return (
    <section className="flex gap-8 flex-col bg-neutralWhiteBg border-[1px] px-4 py-6 border-neutralBorder rounded-[12px] border-solid text-base">
      <Flex justify="space-between" align="center">
        <StakeToken
          icons={icons}
          tokenName={lpSymbol}
          type={PoolTypeEnum.Lp}
          className="lg:!items-center"
          tokenSymbolClassName="!text-base"
          size="middle"
        />
        <RateTag
          value={Number(rate) * 100}
          className="!text-base lg:!text-base !font-medium !px-2 !py-1 !leading-4"
        />
      </Flex>

      <Flex justify="space-between" className="text-balance font-medium" align="center">
        <span className="text-neutralTertiary">Balance</span>
        <span className="text-neutralTitle">{balanceText}</span>
      </Flex>
      <Flex justify="space-between" className="text-balance font-medium" align="center">
        <span className="text-neutralTertiary">Value</span>
        <span className="text-neutralTitle">{valueText}</span>
      </Flex>
      <Flex justify="space-between" className="text-balance font-medium" align="center">
        <Flex gap={8} align="center">
          <span className="text-neutralTertiary">Amount</span>
          <CommonTooltip title='"Amount" includes the added liquidity as well as the reward you earned through the Swap.' />
        </Flex>
        <span className="text-neutralTitle">{amountOneText}</span>
      </Flex>
      <Flex justify="space-between" className="text-balance font-medium" align="center">
        <Flex gap={8} align="center">
          <span className="text-neutralTertiary">Amount</span>
          <CommonTooltip title='"Amount" includes the added liquidity as well as the reward you earned through the Swap.' />
        </Flex>
        <span className="text-neutralTitle">{amountTwoText}</span>
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
          <>
            <ToolTip title={stakeBtnTip}>
              <Button
                type="primary"
                ghost
                block
                size="medium"
                className="!rounded-md"
                disabled={stakeBtnDisabled}
                onClick={() => {
                  onStake(data);
                }}
              >
                Stake
              </Button>
            </ToolTip>
            <Button
              type="primary"
              ghost
              block
              size="medium"
              className="!rounded-md"
              onClick={() => {
                onRemove(data);
              }}
            >
              Remove
            </Button>
          </>
        )}
      </Flex>
    </section>
  );
}
