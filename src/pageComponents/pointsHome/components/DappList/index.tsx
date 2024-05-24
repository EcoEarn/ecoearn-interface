import { Button, Table } from 'aelf-design';
import { TableColumnsType } from 'antd/lib';
import Link from 'next/link';
import { formatNumber } from 'utils/format';
import { RightOutlined } from '@ant-design/icons';
import useResponsive from 'utils/useResponsive';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';
import { useRouter } from 'next/navigation';
import { useCheckLoginAndToken } from 'hooks/useWallet';
import { useModal } from '@ebay/nice-modal-react';
import GetPointsModal, { IPointsModalProps } from '../GetPointsModal';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';
import DappListMobile from './DappListMobile';
import CommonTooltip from 'components/CommonTooltip';

export default function DappList({
  items,
  loading,
}: {
  items: Array<IStakingItem>;
  loading: boolean;
}) {
  const { isMD, isLG } = useResponsive();
  const { isLogin } = useGetLoginStatus();
  const router = useRouter();
  const { checkLogin } = useCheckLoginAndToken();
  const getPointsModal = useModal(GetPointsModal);
  const { schrodingerGainPointsRule, schrodingerUrl } = useGetCmsInfo() || {};

  const handleClick = useCallback(
    (item: IStakingItem) => {
      if (item.dappName === 'Schrödinger') {
        window.open(schrodingerUrl || '');
      }
    },
    [schrodingerUrl],
  );

  const handleStake = useCallback(
    (item: IStakingItem) => {
      const stakeUrl = `/points/${encodeURI(item.dappName)}`;
      router.push(stakeUrl);
    },
    [router],
  );

  const handleGainPoints = useCallback(
    (item: IStakingItem) => {
      const params: IPointsModalProps = {
        name: item.dappName,
        desc: item.projectOwner,
        icon: item.icon,
        handleConfirm: () => {
          handleClick(item);
        },
      };
      if (item.dappName === 'Schrödinger') {
        params.rulesContent = schrodingerGainPointsRule;
      }
      getPointsModal.show(params);
    },
    [getPointsModal, handleClick, schrodingerGainPointsRule],
  );

  const columns: TableColumnsType<IStakingItem> = useMemo(() => {
    return [
      {
        title: 'dApp',
        key: 'dappName',
        dataIndex: 'dappName',
        width: !isLG ? 290 : 'auto',
        render: (text: string, item) => {
          return (
            <div className="flex items-center gap-x-4">
              {!item.icon ? null : (
                <img
                  className="w-8 h-8 md:w-16 md:h-16 rounded-md cursor-pointer"
                  width={64}
                  height={64}
                  alt="logo"
                  src={item.icon}
                />
              )}
              <span className="text-sm font-medium md:text-base text-neutralTitle cursor-pointer">
                {text}
              </span>
            </div>
          );
        },
      },
      {
        width: !isLG ? 290 : 'auto',
        title: (
          <div className="flex items-center">
            <span>Points</span>
            <CommonTooltip title="Total points Staked by all users" className="ml-1" />
          </div>
        ),
        key: 'tvl',
        dataIndex: 'tvl',
        render: (text: string) => {
          return (
            <span className="font-medium text-base text-neutralTitle">
              {text ? formatNumber(text, { formatMin: 1000000 }) : '--'}
            </span>
          );
        },
      },
      {
        width: !isLG ? 290 : 'auto',
        title: 'Staking Addresses',
        key: 'stakingAddress',
        dataIndex: 'stakingAddress',
        render: (text: string) => {
          return (
            <span className="font-medium text-base text-neutralTitle">
              {text ? formatNumber(text, { formatMin: 1000000 }) : '--'}
            </span>
          );
        },
      },
      {
        title: 'Interaction',
        key: 'Interaction',
        dataIndex: 'Interaction',
        render: (_, item) => {
          return (
            <div className="flex items-center md:gap-x-12">
              <Link
                href={`/points/${encodeURI(item.dappName)}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleStake(item);
                }}
              >
                <Button
                  type="primary"
                  disabled={!item.isOpenStake}
                  className="!min-w-[132px] !rounded-md"
                  size={isMD ? 'small' : 'medium'}
                >
                  {item.isOpenStake ? 'Stake' : 'Coming Soon'}
                </Button>
              </Link>
              <Button
                type="link"
                disabled={!item.isOpenStake}
                className="!px-0"
                size={isMD ? 'small' : 'medium'}
                onClick={() => {
                  handleGainPoints(item);
                }}
              >
                <span
                  className={clsx(
                    'text-brandDefault hover:text-brandHover text-base font-medium',
                    !item.isOpenStake && 'text-brandDisable',
                  )}
                >
                  Gain points
                </span>
                <RightOutlined
                  className={clsx(
                    'text-brandDefault lg:ml-4',
                    !item.isOpenStake && 'text-brandDisable',
                  )}
                  width={20}
                  height={20}
                />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [handleGainPoints, handleStake, isLG, isMD]);

  return isLG ? (
    <DappListMobile
      items={items}
      handleGainPoints={handleGainPoints}
      handleStake={handleStake}
      loading={loading}
    />
  ) : (
    <Table
      columns={columns}
      rowKey={'dappName'}
      dataSource={items}
      loading={loading}
      scroll={{ x: 'max-content' }}
      className="mt-[80px]"
    />
  );
}
