import { Button, Flex } from 'antd';
import clsx from 'clsx';
import Link from 'next/link';
import { formatNumber } from 'utils/format';
import { RightOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import useLoading from 'hooks/useLoading';
import CommonTooltip from 'components/CommonTooltip';

export default function DappListMobile({
  items,
  handleGainPoints,
  handleStake,
  loading,
}: {
  items: Array<IStakingItem>;
  handleGainPoints: (item: IStakingItem) => void;
  handleStake: (item: IStakingItem) => void;
  loading: boolean;
}) {
  const { showLoading, closeLoading } = useLoading();

  useEffect(() => {
    if (loading) {
      showLoading();
    } else {
      closeLoading();
    }
  }, [closeLoading, loading, showLoading]);

  return (
    <Flex vertical gap={16}>
      {items?.map((item, index) => {
        return (
          <Flex
            className="px-4 py-6 rounded-lg border-solid border-[1px] border-neutralBorder bg-neutralWhiteBg"
            key={index}
            vertical
          >
            <Flex gap={16} align="center">
              {!item.icon ? null : (
                <img
                  className="w-12 h-12 rounded-sm"
                  width={48}
                  height={48}
                  alt="logo"
                  src={item.icon}
                />
              )}
              <span className="text-2xl font-semibold text-neutralPrimary">{item.dappName}</span>
            </Flex>
            <Flex className="mt-8" justify="space-between">
              <Flex align="center" gap={8} className="text-base font-medium">
                <span className="text-neutralDisable">Points</span>
                <CommonTooltip title="Total number of points Staked by all users" />
              </Flex>
              <span className="text-neutralPrimary font-semibold text-base">
                {item.tvl ? formatNumber(item.tvl) : '--'}
              </span>
            </Flex>
            <Flex className="mt-6" justify="space-between">
              <Flex align="center" gap={8} className="text-base font-medium">
                <span className="text-neutralDisable">Staking Address</span>
              </Flex>
              <span className="text-neutralPrimary font-semibold text-base">
                {item.stakingAddress ? formatNumber(item.stakingAddress) : '--'}
              </span>
            </Flex>
            <Flex gap={8} vertical>
              <Link
                className="mt-[34px]"
                href={`/points/${encodeURI(item.dappName)}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleStake(item);
                }}
              >
                <Button type="primary" block disabled={!item.isOpenStake} size="large">
                  {item.isOpenStake ? 'Stake' : 'Coming Soon'}
                </Button>
              </Link>
              <Button
                type="link"
                disabled={!item.isOpenStake}
                size="large"
                block
                onClick={() => {
                  handleGainPoints(item);
                }}
              >
                <span
                  className={clsx('text-base font-medium', item.isOpenStake && 'text-brandDefault')}
                >
                  Gain points
                </span>
                <RightOutlined
                  className={clsx('w-5 h-5ml-2', item.isOpenStake && '!text-brandDefault')}
                  width={20}
                  height={20}
                />
              </Button>
            </Flex>
          </Flex>
        );
      })}
    </Flex>
  );
}
