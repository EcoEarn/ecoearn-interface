import { Pagination, Table, ToolTip } from 'aelf-design';
import { Flex, TableColumnsType } from 'antd';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import CountDownLock from '../CountDownLock';
import { formatTokenPrice, formatUSDPrice } from 'utils/format';
import StakeToken from 'components/StakeToken';
import { PoolType } from 'types/stack';
import { divDecimals } from 'utils/calculate';
import { AELFDProvider } from 'aelf-design';
import { theme } from './config';
import { AELFDProviderTheme } from 'provider/config';
import styles from './style.module.css';
import CommonTooltip from 'components/CommonTooltip';
import { DownOutlined } from '@ant-design/icons';

export default function PoolsTable({
  page,
  pageSize,
  dataList,
  loading,
  totalCount,
  onPaginationChange,
  onChange,
  onCountDownFinish,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  dataList: Array<IRewardListItem>;
  loading: boolean;
  onPaginationChange: (params: { page?: number; pageSize?: number }) => void;
  onChange: (pagination: any, filters: Record<string, any>, sorter: any) => void;
  onCountDownFinish?: () => void;
}) {
  const columns: TableColumnsType<IRewardListItem> = useMemo(() => {
    return [
      {
        key: 'pools',
        dataIndex: 'pools',
        title: 'Pools',
        filterMultiple: false,
        filters: [
          { text: 'All', value: 'All' },
          { text: 'XPSGR', value: 'Points' },
          { text: 'SGR', value: 'Token' },
          { text: 'LP', value: 'Lp' },
        ],
        filterIcon: <DownOutlined />,
        render: (text, item) => {
          const { tokenIcon, tokenName, projectOwner } = item;
          if (item.poolType === 'Points') {
            return (
              <div className="text-xl font-semibold text-neutralPrimary">{item.tokenName}</div>
            );
          } else {
            return (
              <StakeToken
                type={item.poolType as PoolType}
                icons={tokenIcon}
                tokenName={tokenName}
                projectName={projectOwner}
              />
            );
          }
        },
      },
      {
        key: 'Rewards',
        dataIndex: 'rewards',
        width: 280,
        title: (
          <div className="flex items-center">
            <span>Rewards</span>
            <CommonTooltip title="Claimed Rewards" className="ml-1" />
          </div>
        ),
        render: (text, item) => {
          return (
            <Flex vertical>
              <span className="text-base text-neutralPrimary font-semibold">{`${formatTokenPrice(
                divDecimals(text, item.rewardsTokenDecimal || 8),
                { decimalPlaces: 2 },
              )} ${item.rewardsToken}`}</span>
              <span className="text-sm text-neutralSecondary mt-2 font-medium">
                {formatUSDPrice(item.rewardsInUsd, { decimalPlaces: 2 })}
              </span>
            </Flex>
          );
        },
      },
      {
        key: 'Date',
        dataIndex: 'date',
        title: (
          <div className="flex items-center">
            <span>Date</span>
            <CommonTooltip title="Time of claiming rewards" className="ml-1" />
          </div>
        ),
        render: (text, item) => {
          return (
            <span className="text-neutralPrimary text-base font-medium">
              {dayjs(Number(text)).format('YYYY.MM.DD HH:mm')}
            </span>
          );
        },
      },
      {
        key: 'Look-up Period',
        dataIndex: 'lockUpPeriod',
        align: 'right',
        title: (
          <div className="flex items-center justify-end">
            <span>Lock-up period</span>
            <CommonTooltip
              title="It indicates the lock-up period before rewards can be claimed."
              className="ml-1"
            />
          </div>
        ),
        render: (text, item) => {
          if (dayjs(text).isBefore(dayjs())) {
            return <span className="text-base font-semibold text-neutralTitle">Unlocked</span>;
          }
          return <CountDownLock targetTimeStamp={text} onFinish={onCountDownFinish} />;
        },
      },
    ];
  }, [onCountDownFinish]);

  return (
    <AELFDProvider
      theme={{
        ...AELFDProviderTheme,
        components: { ...AELFDProviderTheme.components, ...theme.components },
      }}
    >
      <Table
        columns={columns}
        rowKey={(record) => `${record.claimId}-${record.date}`}
        scroll={{ x: 'max-content' }}
        dataSource={dataList}
        onChange={onChange}
        loading={loading}
        className={styles.table}
      />
      <div className="py-4">
        <Pagination
          hideOnSinglePage
          pageSize={pageSize}
          current={page}
          showSizeChanger
          total={totalCount || 0}
          pageChange={(page) => onPaginationChange({ page })}
          pageSizeChange={(page, pageSize) => onPaginationChange({ page, pageSize })}
        />
      </div>
    </AELFDProvider>
  );
}
