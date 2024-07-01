import { Flex, Segmented, TableColumnsType } from 'antd';
import clsx from 'clsx';
import Empty from 'components/Empty';
import useLiquidityListService, { LiquidityListTypeEnum } from './hooks/useLiquidityListService';
import styles from './style.module.css';
import CommonTable from 'components/CommonTable';
import { useMemo } from 'react';
import StakeToken, { PoolTypeEnum } from 'components/StakeToken';
import { Button, ToolTip } from 'aelf-design';
import { formatTokenPrice, formatUSDPrice } from 'utils/format';
import CommonTooltip from 'components/CommonTooltip';
import LiquidityMobile from './LiquidityMobile';
import { divDecimals } from 'utils/calculate';

export default function LiquidityList() {
  const {
    isLG,
    currentList,
    data,
    mobileDataList,
    handleSegmentChange,
    segmentedOptions,
    handleAddLiquidity,
    onAddAndStake,
    onRemove,
    getAddBtnTip,
    getStakeBtnTip,
    isAddBtnDisabled,
    isStakeBtnDisabled,
    onStake,
  } = useLiquidityListService();

  const columns: TableColumnsType<ILiquidityItem> = useMemo(() => {
    return [
      {
        key: 'lpSymbol',
        dataIndex: 'lpSymbol',
        width: 280,
        render: (text, item) => {
          return (
            <StakeToken
              icons={item.icons}
              size="middle"
              tokenName={text}
              rate={item.rate}
              type={PoolTypeEnum.Lp}
              className="lg:!items-center"
              tokenSymbolClassName="!text-base"
              tagClassName="!text-base lg:!text-base !font-medium !px-2 !py-1 !leading-4"
            />
          );
        },
      },
      {
        key: 'banlance',
        dataIndex: 'banlance',
        title: 'Banlance',
        width: 150,
        render: (text, item) => {
          return (
            <span className="text-base font-semibold text-neutralTitle">
              {formatTokenPrice(text).toString()}
            </span>
          );
        },
      },
      {
        key: 'value',
        dataIndex: 'value',
        title: 'Value',
        width: 150,
        render: (text, item) => {
          return (
            <span className="text-base font-semibold text-neutralTitle">
              {formatUSDPrice(text).toString()}
            </span>
          );
        },
      },
      {
        key: 'amountOne',
        dataIndex: 'tokenAAmount',
        width: 150,
        title: (
          <Flex align="center" gap={8}>
            <span>Amount</span>
            <CommonTooltip title='"Amount" includes the added liquidity as well as the reward you earned through the Swap.' />
          </Flex>
        ),
        render: (text, item) => {
          return (
            <span className="text-base font-semibold text-neutralTitle">
              {`${formatTokenPrice(text).toString()} ${item.tokenASymbol}`}
            </span>
          );
        },
      },
      {
        key: 'amountTwo',
        dataIndex: 'tokenBAmount',
        width: 150,
        title: (
          <Flex align="center" gap={8}>
            <span>Amount</span>
            <CommonTooltip title='"Amount" includes the added liquidity as well as the reward you earned through the Swap.' />
          </Flex>
        ),
        render: (text, item) => {
          return (
            <span className="text-base font-semibold text-neutralTitle">
              {`${formatTokenPrice(text).toString()} ${item.tokenBSymbol}`}
            </span>
          );
        },
      },
      {
        key: 'Operation',
        dataIndex: 'Operation',
        title: 'Operation',
        align: 'right',
        width: 200,
        render: (text, item, index) => {
          return (
            <Flex gap={16} justify="end">
              <ToolTip title={getAddBtnTip({ index })}>
                <Button
                  type="primary"
                  size="small"
                  className="!rounded-sm"
                  disabled={isAddBtnDisabled({ index })}
                  onClick={() => {
                    onAddAndStake(item);
                  }}
                >
                  Add & Stake
                </Button>
              </ToolTip>

              {currentList === LiquidityListTypeEnum.My && (
                <>
                  <ToolTip title={getStakeBtnTip({ index })}>
                    <Button
                      type="primary"
                      ghost
                      size="small"
                      className="!rounded-sm"
                      disabled={isStakeBtnDisabled({ index })}
                      onClick={() => {
                        onStake(item);
                      }}
                    >
                      Stake
                    </Button>
                  </ToolTip>
                  <Button
                    type="primary"
                    ghost
                    size="small"
                    className="!rounded-sm"
                    onClick={() => {
                      onRemove(item);
                    }}
                  >
                    Remove
                  </Button>
                </>
              )}
            </Flex>
          );
        },
      },
    ];
  }, [
    currentList,
    getAddBtnTip,
    getStakeBtnTip,
    isAddBtnDisabled,
    isStakeBtnDisabled,
    onAddAndStake,
    onRemove,
    onStake,
  ]);

  return (
    <>
      <Segmented
        className={clsx('mt-6 lg:mt-12', styles.segmented)}
        size="large"
        block={isLG}
        value={currentList}
        defaultValue={LiquidityListTypeEnum.My}
        onChange={handleSegmentChange}
        options={segmentedOptions}
      />
      {data?.length && data.length > 0 ? (
        !isLG ? (
          <CommonTable
            columns={columns}
            dataSource={data}
            scroll={{ x: 'max-content' }}
            className="mt-6"
            rowKey={(item) => item.symbol}
          />
        ) : (
          <div className="mt-6">
            <LiquidityMobile
              currentList={currentList}
              onRemove={onRemove}
              onAdd={onAddAndStake}
              onStake={onStake}
              data={mobileDataList}
            />
          </div>
        )
      ) : (
        <Empty
          onClick={handleAddLiquidity}
          emptyBtnText="Add Liquidity"
          emptyText="You have no available liquidity."
        />
      )}
    </>
  );
}
