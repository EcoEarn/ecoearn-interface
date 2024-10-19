import { Flex, Segmented } from 'antd';
import clsx from 'clsx';
import Empty from 'components/Empty';
import useLiquidityListService, { LiquidityListTypeEnum } from './hooks/useLiquidityListService';
import styles from './style.module.css';
import CommonTable from 'components/CommonTable';
import { useMemo } from 'react';
import StakeToken, { PoolType, PoolTypeEnum } from 'components/StakeToken';
import { AELFDProvider, Button, ToolTip } from 'aelf-design';
import { formatNumber, formatTokenPrice, formatTokenSymbol, formatUSDPrice } from 'utils/format';
import CommonTooltip from 'components/CommonTooltip';
import LiquidityMobile from './LiquidityMobile';
import OperationDrop from '../OperationDrop';
import { theme } from './config';
import { AELFDProviderTheme } from 'provider/config';
import { APP_PREFIX } from 'constants/index';
import { ColumnsType } from 'antd/es/table';
import Loading from 'components/Loading';

export default function LiquidityList({ initData }: { initData?: ILiquidityItem[] }) {
  const {
    isLG,
    currentList,
    data,
    mobileDataList,
    handleSegmentChange,
    segmentedOptions,
    loading,
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
  } = useLiquidityListService({ initData });

  const columns: ColumnsType<ILiquidityItem> = useMemo(() => {
    const allColumns: ColumnsType<ILiquidityItem> = [
      {
        key: 'lpSymbol',
        dataIndex: 'lpSymbol',
        width: 302,
        render: (text, item) => {
          return (
            <StakeToken
              icons={item.icons}
              size="middle"
              tokenName={text}
              rate={item.rate}
              type={PoolType.LP}
              symbolDigs={12}
              className="lg:!items-center !w-[270px]"
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
        width: currentList === LiquidityListTypeEnum.My ? 134 : 152,
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
        width: currentList === LiquidityListTypeEnum.My ? 138 : 156,
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
        width: currentList === LiquidityListTypeEnum.My ? 138 : 156,
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
        width: currentList === LiquidityListTypeEnum.My ? 150 : 168,
        title: (
          <Flex align="center" gap={8}>
            <span>Amount</span>
            <CommonTooltip title='"Amount" includes the added liquidity as well as the reward you earned through the Swap.' />
          </Flex>
        ),
        render: (text, item) => {
          const formatSymbol = formatTokenSymbol(item.tokenASymbol);
          return (
            <div
              className={clsx(
                'text-base font-semibold text-neutralTitle flex items-center gap-1',
                currentList === LiquidityListTypeEnum.My ? 'w-[118px]' : 'w-[136px]',
              )}
            >
              {`${formatNumber(text).toString()}`}
              <ToolTip title={formatSymbol?.length > 6 ? formatSymbol : ''}>
                <span className="flex-1 truncate">{formatSymbol}</span>
              </ToolTip>
            </div>
          );
        },
      },
      {
        key: 'amountTwo',
        dataIndex: 'tokenBAmount',
        width: currentList === LiquidityListTypeEnum.My ? 150 : 168,
        title: (
          <Flex align="center" gap={8}>
            <span>Amount</span>
            <CommonTooltip title='"Amount" includes the added liquidity as well as the reward you earned through the Swap.' />
          </Flex>
        ),
        render: (text, item) => {
          const formatSymbol = formatTokenSymbol(item.tokenBSymbol);
          return (
            <div
              className={clsx(
                'text-base font-semibold text-neutralTitle flex items-center gap-1',
                currentList === LiquidityListTypeEnum.My ? 'w-[118px]' : 'w-[136px]',
              )}
            >
              {`${formatNumber(text).toString()}`}
              <ToolTip title={formatSymbol?.length > 6 ? formatSymbol : ''}>
                <span className="flex-1 truncate">{formatSymbol}</span>
              </ToolTip>
            </div>
          );
        },
      },
      {
        key: 'Operation',
        dataIndex: 'Operation',
        title: 'Operation',
        align: 'right',
        width: currentList === LiquidityListTypeEnum.My ? 180 : 120,
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
                              if (isStakeBtnDisabled({ index })) return;
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
                              if (isRemoveBtnDisabled({ index })) return;
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
    <AELFDProvider
      prefixCls={APP_PREFIX}
      theme={{
        ...AELFDProviderTheme,
        components: { ...AELFDProviderTheme.components, ...theme.components },
      }}
    >
      <Segmented
        className={clsx(styles.segmented)}
        size="large"
        block={isLG}
        value={currentList}
        defaultValue={LiquidityListTypeEnum.Market}
        onChange={handleSegmentChange}
        options={segmentedOptions}
      />
      {loading ? (
        <div className="w-full h-full py-[80px] flex items-center justify-center">
          <Loading />
        </div>
      ) : data?.length && data.length > 0 ? (
        !isLG ? (
          <CommonTable
            columns={columns as any}
            dataSource={data}
            scroll={{ x: 'max-content' }}
            className={clsx('mt-6', styles.table)}
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
          // onClick={handleAddLiquidity}
          // emptyBtnText="Add Liquidity"
          className="bg-white rounded-2xl border-solid border-[1px] border-[#E0E0E0] !mt-6 !lg:mt-6 !py-[48px] lg:!py-[48px] h-[288px]"
          emptyText="Record of liquidity added and staked without rewards."
        />
      )}
    </AELFDProvider>
  );
}
