import { Button, Flex } from 'antd';
import clsx from 'clsx';
import Link from 'next/link';
import { formatNumber } from 'utils/format';
import { RightOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import useLoading from 'hooks/useLoading';
import CommonTooltip from 'components/CommonTooltip';
import { useRouter } from 'next/navigation';
import { PoolType } from 'components/StakeToken';

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
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      showLoading();
    } else {
      closeLoading();
    }
  }, [closeLoading, loading, showLoading]);

  return (
    <div className="grid grid-cols-1 gap-[16px] lg:grid-cols-3">
      {items?.map((item, index) => {
        return (
          <Flex
            className="rounded-xl border-solid border-[1px] border-neutralBorder bg-neutralWhiteBg lg:p-[32px] p-[16px] relative transition-all ease-in-out duration-300 hover:shadow-xl hover:-translate-y-1 hover:transition-all hover:ease hover:duration-300 group"
            key={index}
            vertical
          >
            <Flex gap={16} align="center">
              {!item.icon ? null : (
                <img
                  className="lg:w-[64px] lg:h-[64px] w-[46px] h-[46px] rounded-sm"
                  alt="logo"
                  src={item.icon}
                />
              )}
              <span className="text-[20px] font-[600]">{item.dappName}</span>
            </Flex>
            <div className="lg:mt-[64px] mt-[32px] flex items-start gap-[20px]">
              <Flex vertical>
                <Flex align="center" gap={3}>
                  <span className="text-neutralDisable">Points</span>
                  {/* <CommonTooltip title="Total number of points Staked by all users" /> */}
                </Flex>
                <span className="text-[18px] font-[600]">
                  {item.tvl ? formatNumber(item.tvl) : '--'}
                </span>
              </Flex>
              <div className="">
                <Flex align="center" gap={8} className="">
                  <span className="text-neutralDisable">Staking Addresses</span>
                </Flex>
                <span className="text-[18px] font-[600]">
                  {item.stakingAddress ? formatNumber(item.stakingAddress) : '--'}
                </span>
              </div>
            </div>
            <Flex
              gap={8}
              className="mt-[34px] absolute -bottom-[20px] w-full lg:p-[32px] p-[16px] left-0 opacity-0 transition-all ease-in-out duration-300 group-hover:bg-white group-hover:opacity-100 group-hover:bottom-[10px] group-hover:transition-all group-hover:ease-in-out	 group-hover:duration-300"
            >
              {/* <Link
                className="w-1/2"
                href={`/points/${encodeURI(item.dappName)}`}
                onClick={(e) => {
                  e.preventDefault();
                  // handleStake(item);
                  console.log('item', item);
                }}
              >
                
                  {item.isOpenStake ? 'Stake' : 'Coming Soon'}
                </Button>
              </Link> */}
              <Button
                className="w-1/2"
                type="primary"
                disabled={!item.isOpenStake}
                onClick={() => {
                  router.push(`/pool-detail?poolId=${item.dappId}&poolType=${PoolType['LP']}`);
                }}
                size="large"
              >
                {item.isOpenStake ? 'Stake' : 'Coming Soon'}
              </Button>
              <Button
                disabled={!item.isOpenStake}
                className="w-1/2"
                size="large"
                onClick={() => {
                  handleGainPoints(item);
                }}
              >
                Gain points
                {/* <RightOutlined
                  className={clsx('w-5 h-5ml-2', item.isOpenStake && '!text-brandDefault')}
                  width={20}
                  height={20}
                /> */}
              </Button>
            </Flex>
          </Flex>
        );
      })}
    </div>
  );
}
