/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { ColumnsType } from 'antd/es/table';
import BigNumber from 'bignumber.js';
import CommonCopy from 'components/CommonCopy';
import useAddressFormat from 'pageComponents/leaderboard/hooks/useAddressFormat';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatTokenPrice } from 'utils/format';
import { useWalletService } from 'hooks/useWallet';
import clsx from 'clsx';
import CommonTable from 'components/CommonTable';
import { APP_PREFIX } from 'constants/index';
import { AELFDProviderTheme } from 'provider/config';
import { AELFDProvider } from 'aelf-design';
import { theme } from './config';
import styles from './style.module.css';
import useResponsive from 'utils/useResponsive';
import MyRanking from '../MyRanking';
import { getLeaderboardInfo } from 'api/request';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import useLoading from 'hooks/useLoading';

const pageSize = 20;

const maxPage = 10000 / pageSize;

export interface IRankingListItem {
  rank: number;
  img: string;
  address: string;
  points: number;
  name: string;
}

export default function RankingTable({ className }: { className?: string }) {
  const { isLogin } = useGetLoginStatus();
  const { formatAddress } = useAddressFormat();
  const { wallet } = useWalletService();
  const { isMD, isMin, isLG } = useResponsive();
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Array<IRankingItem>>();
  const [ownerInfo, setOwnerInfo] = useState<IRankingOwnerInfo>();
  const { showLoading, closeLoading } = useLoading();
  const [isPageLoading, setIsPageLoading] = useState(false);

  const columns: ColumnsType<IRankingItem> = useMemo(() => {
    return [
      {
        dataIndex: 'rank',
        title: 'Rank',
        width: isMin ? '22%' : 'calc(100% / 3)',
        render: (rank, record, index) => (
          <div
            className={clsx(
              'text-sm md:text-xl font-[600] text-neutralTitle w-6 md:w-10 h-6 md:h-10 flex items-center justify-center',
              record?.isOwner && '!text-brandDefault',
            )}
          >
            {index < 3 ? (
              <img
                src={require(`assets/img/level-${index + 1}.png`).default.src}
                className="w-6 md:w-10 h-6 md:h-10 object-cover"
              />
            ) : (
              index + 1
            )}
          </div>
        ),
      },
      {
        dataIndex: 'address',
        title: 'Address',
        align: isMin ? 'center' : 'start',
        width: isMin ? '44%' : 'calc(100% / 3)',
        render: (address, record, index) => {
          const { fullAddress, formattedAddress } = formatAddress({ address });
          return (
            <div className="flex items-center h-full">
              <CommonCopy
                copiedTip="Copied Successfully!"
                toCopy={fullAddress}
                size={isMD ? 'small' : 'large'}
                className={clsx(
                  'text-xs md:text-lg font-[500] text-neutralTitle',
                  record?.isOwner && '!text-brandDefault',
                )}
              >
                {formattedAddress}
              </CommonCopy>
            </div>
          );
        },
      },
      {
        dataIndex: 'points',
        title: 'Points',
        align: 'right',
        width: isMin ? '34%' : 'calc(100% / 3)',
        render: (points, record, index) => (
          <div
            className={clsx(
              'text-xs md:text-lg font-[500] text-neutralTitle flex h-full items-center justify-end',
              record?.isOwner && '!text-brandDefault',
            )}
          >
            {points
              ? BigNumber(record?.points || 0).lt(1)
                ? '< 1'
                : formatTokenPrice(points, { decimalPlaces: 0 })
              : 0}
          </div>
        ),
      },
    ];
  }, [formatAddress, isMD, isMin]);

  const getList = useCallback(
    async (page = 1) => {
      if (page > maxPage) return;
      setLoading(true);
      if (page === 1) {
        setIsPageLoading(true);
      }
      try {
        const data = await getLeaderboardInfo({
          address: wallet?.address || '',
          skipCount: page === 1 ? 0 : (page - 1) * 20,
          maxResultCount: pageSize,
        });

        const list = data?.rankingInfo?.list || [];
        const ownerInfo = data?.ownerPointsInfo || {};
        setTotal(data?.rankingInfo?.totalRecord || 0);
        setOwnerInfo(ownerInfo);
        setDataSource((oldData) => {
          return page === 1 ? list : [...(oldData || []), ...list];
        });
        setHasMore(page * pageSize < (data?.rankingInfo?.totalRecord || 0));
        setPage(page);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setIsPageLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLogin],
  );

  useEffect(() => {
    getList(1);
  }, [getList]);

  useEffect(() => {
    if (isPageLoading) {
      showLoading();
    } else {
      closeLoading();
    }
  }, [closeLoading, isPageLoading, showLoading]);

  const onScrollCapture = useCallback(() => {
    if (loading || !hasMore) return;
    const tableEleNodes = document.querySelectorAll('#ranking-table .earn-table-body')[0];
    if (
      tableEleNodes?.scrollTop + tableEleNodes?.clientHeight >=
      tableEleNodes?.scrollHeight - 50
    ) {
      getList(page + 1);
    }
  }, [getList, hasMore, loading, page]);

  if (isPageLoading) {
    return null;
  }

  return (
    <>
      {isLogin && wallet?.address && (
        <>{ownerInfo?.address && <MyRanking className="mt-8 md:mt-12" data={ownerInfo} />}</>
      )}
      <AELFDProvider
        prefixCls={APP_PREFIX}
        theme={{
          ...AELFDProviderTheme,
          components: { ...AELFDProviderTheme.components, ...theme.components },
        }}
      >
        <div className="ranking-table-container" onScrollCapture={onScrollCapture}>
          {dataSource && (
            <CommonTable
              rowKey={(row) => row?.address}
              // loading={loading}
              pagination={false}
              columns={columns as any}
              dataSource={dataSource}
              className={clsx(styles.rankingTable, 'mt-4 md:mt-6')}
              id="ranking-table"
              scroll={{ x: isMD ? 343 : isLG ? 'max-content' : '100%', y: isMD ? 650 : 890 }}
              rowClassName={(record, index) => {
                if (record?.isOwner) {
                  return 'bg-brandFooterBg';
                }
                return '';
              }}
            />
          )}
        </div>
      </AELFDProvider>
    </>
  );
}
