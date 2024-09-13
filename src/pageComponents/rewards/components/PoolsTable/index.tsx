import { Pagination } from 'aelf-design';
import { Flex } from 'antd';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import { formatTokenPrice, formatTokenSymbol, formatUSDPrice } from 'utils/format';
import StakeToken, { PoolType, PoolTypeEnum } from 'components/StakeToken';
import { divDecimals } from 'utils/calculate';
import { AELFDProvider } from 'aelf-design';
import { theme } from './config';
import { AELFDProviderTheme } from 'provider/config';
import CommonTooltip from 'components/CommonTooltip';
import { DownOutlined } from '@ant-design/icons';
import CommonTable from 'components/CommonTable';
import { APP_PREFIX, DEFAULT_DATE_FORMAT } from 'constants/index';
import { ColumnsType } from 'antd/es/table';

export default function PoolsTable({
  page,
  pageSize,
  dataList,
  loading,
  totalCount,
  rewardsTypeList,
  onPaginationChange,
  onChange,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  dataList: Array<IRewardListItem>;
  loading: boolean;
  rewardsTypeList: Array<IRewardsTypeItem>;
  onPaginationChange: (params: { page?: number; pageSize?: number }) => void;
  onChange: (pagination: any, filters: Record<string, any>, sorter: any) => void;
  onCountDownFinish?: () => void;
}) {
  const poolsFilters = useMemo(() => {
    return rewardsTypeList.map((item) => {
      return {
        text: item?.filterName,
        value: item?.id,
      };
    });
  }, [rewardsTypeList]);

  const columns: ColumnsType<IRewardListItem> = useMemo(() => {
    return [
      {
        key: 'pools',
        dataIndex: 'pools',
        title: 'Pools',
        filterMultiple: false,
        filters: poolsFilters,
        filterIcon: <DownOutlined />,
        render: (text, item) => {
          const { tokenIcon, tokenName, projectOwner } = item;
          return (
            <StakeToken
              type={item.poolType as unknown as PoolType}
              icons={tokenIcon}
              tokenName={tokenName}
              projectName={projectOwner}
              rate={item?.rate}
            />
          );
        },
      },
      {
        key: 'Rewards',
        dataIndex: 'rewards',
        width: 280,
        title: (
          <div className="flex items-center">
            <span>Claimed rewards</span>
            <CommonTooltip title="Claimed Rewards" className="ml-1" />
          </div>
        ),
        render: (text, item) => {
          return (
            <Flex vertical>
              <span className="text-[16px] text-neutralPrimary font-[600]">
                {`${formatTokenPrice(divDecimals(text, item.rewardsTokenDecimal || 8), {
                  decimalPlaces: 2,
                })}`}
                <span className="text-[16px] font-[500] ml-[4px]">{`${formatTokenSymbol(
                  item.rewardsToken,
                )}`}</span>
              </span>
              <span className="text-[14px] text-neutralSecondary mt-2">
                {formatUSDPrice(divDecimals(item.rewardsInUsd, item.rewardsTokenDecimal || 8), {
                  decimalPlaces: 2,
                })}
              </span>
            </Flex>
          );
        },
      },
      {
        key: 'Date',
        dataIndex: 'date',
        align: 'right',
        title: (
          <div className="flex items-center justify-end">
            <span>Claimed at</span>
            <CommonTooltip title="Time of claiming rewards" className="ml-1" />
          </div>
        ),
        render: (text, item) => {
          return (
            <span className="text-neutralPrimary text-base font-[500]">
              {dayjs(Number(text)).format(DEFAULT_DATE_FORMAT)}
            </span>
          );
        },
      },
    ];
  }, [poolsFilters]);

  return (
    <AELFDProvider
      prefixCls={APP_PREFIX}
      theme={{
        ...AELFDProviderTheme,
        components: { ...AELFDProviderTheme.components, ...theme.components },
      }}
    >
      <CommonTable
        columns={columns as any}
        // rowKey={(record) => `${record.claimId}-${record.date}`}
        scroll={{ x: 'max-content' }}
        dataSource={dataList}
        onChange={onChange}
        loading={loading}
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
