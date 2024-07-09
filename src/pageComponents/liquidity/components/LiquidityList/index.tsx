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
import OperationDrop from '../OperationDrop';

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
    getRemoveBtnTip,
    isRemoveBtnDisabled,
    onStake,
  } = useLiquidityListService();

  const columns: TableColumnsType<ILiquidityItem> = useMemo(() => {
    const allColumns: TableColumnsType<ILiquidityItem> = [
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
        title: (
          <Flex align="center" gap={8}>
            <span>Balance</span>
            {currentList === LiquidityListTypeEnum.My && (
              <CommonTooltip title="The amount of LP you hold, excluding the LP in staking." />
            )}
          </Flex>
        ),
        width: currentList === LiquidityListTypeEnum.My ? 142 : 150,
        render: (text, item) => {
          return (
            <span className="text-base font-semibold text-neutralTitle">
              {formatTokenPrice(text).toString()}
            </span>
          );
        },
      },
      {
        key: 'stakingAmount',
        dataIndex: 'stakingAmount',
        title: (
          <Flex align="center" gap={8}>
            <span>Staking</span>
            <CommonTooltip title="Your LP amount in staking." />
          </Flex>
        ),
        width: currentList === LiquidityListTypeEnum.My ? 142 : 150,
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
        title: (
          <Flex align="center" gap={8}>
            <span>Value</span>
            {currentList === LiquidityListTypeEnum.My && (
              <CommonTooltip title="The total value of LP obtained by adding liquidity, including the balance and staking amount." />
            )}
          </Flex>
        ),
        width: currentList === LiquidityListTypeEnum.My ? 142 : 150,
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
        width: currentList === LiquidityListTypeEnum.My ? 142 : 150,
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
        width: currentList === LiquidityListTypeEnum.My ? 142 : 150,
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
                <OperationDrop
                  items={[
                    {
                      key: 'stake',
                      label: (
                        <ToolTip title={getStakeBtnTip({ index })}>
                          <div
                            className={clsx(
                              'text-base font-medium text-neutralTitle w-full',
                              isStakeBtnDisabled({ index }) &&
                                '!text-neutralDisable !cursor-not-allowed',
                            )}
                            onClick={() => {
                              onStake(item);
                            }}
                          >
                            Stake
                          </div>
                        </ToolTip>
                      ),
                    },
                    {
                      key: 'remove',
                      label: (
                        <ToolTip title={getRemoveBtnTip({ index })}>
                          <div
                            className={clsx(
                              'text-base font-medium text-neutralTitle w-full',
                              isRemoveBtnDisabled({ index }) &&
                                '!text-neutralDisable !cursor-not-allowed',
                            )}
                            onClick={() => {
                              onRemove(item);
                            }}
                          >
                            Remove
                          </div>
                        </ToolTip>
                      ),
                    },
                  ]}
                />
              )}
            </Flex>
          );
        },
      },
    ];
    return currentList === LiquidityListTypeEnum.My
      ? allColumns
      : [...allColumns.slice(0, 2), ...allColumns.slice(3)];
  }, [
    currentList,
    getAddBtnTip,
    getRemoveBtnTip,
    getStakeBtnTip,
    isAddBtnDisabled,
    isRemoveBtnDisabled,
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
