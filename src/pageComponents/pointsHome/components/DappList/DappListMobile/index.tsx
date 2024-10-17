/* eslint-disable @next/next/no-img-element */
import { Flex, Skeleton } from 'antd';
import { Button } from 'aelf-design';
import clsx from 'clsx';
import Link from 'next/link';
import { formatNumber } from 'utils/format';
import { RightOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import useLoading from 'hooks/useLoading';
import CommonTooltip from 'components/CommonTooltip';
import { useRouter } from 'next/navigation';
import { PoolType } from 'components/StakeToken';
import styles from './style.module.css';

export default function DappListMobile({
  items,
  loading,
}: {
  items: Array<IStakingItem>;
  handleGainPoints: (item: IStakingItem) => void;
  handleStake: (item: IStakingItem) => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-[16px] lg:grid-cols-auto-fill-400">
      {!loading && items?.length > 0 ? (
        items?.map((item, index) => {
          return (
            <Flex
              className="rounded-xl border-solid border-[1px] border-neutralBorder bg-neutralWhiteBg md:p-[32px] p-[16px] relative transition-all ease-in-out duration-300 hover:shadow-xl hover:transition-all hover:ease hover:duration-300 group"
              key={index}
              vertical
            >
              <Flex gap={16} align="center">
                {!item.icon ? null : (
                  <img
                    className="lg:w-[64px] lg:h-[64px] w-[46px] h-[46px] rounded-md overflow-hidden"
                    alt="logo"
                    src={item.icon}
                  />
                )}
                <span className="text-xl font-[600]">{item.dappName}</span>
              </Flex>
              <div className="lg:mt-[64px] mt-[32px] relative">
                <div className="flex items-center gap-[20px] transition-all ease-in-out duration-300 opacity-1 lg:group-hover:opacity-0">
                  <Flex
                    vertical
                    className="border-solid border-r border-y-0 border-l-0 border-neutralDivider pr-[20px]"
                  >
                    <span className="text-neutralTertiary text-[14px] leading-[26px] font-[500]">
                      Total points
                    </span>
                    <span className="text-base font-[600] text-neutralTitle">
                      {item.tvl ? formatNumber(item.tvl) : '--'}
                    </span>
                  </Flex>
                  <Flex vertical>
                    <span className="text-neutralTertiary text-[14px] leading-[26px] font-[500]">
                      Addresses
                    </span>
                    <span className="text-base font-[600] text-neutralTitle">
                      {item.stakingAddress ? formatNumber(item.stakingAddress) : '--'}
                    </span>
                  </Flex>
                </div>
                <div className="w-full mt-[20px] lg:mt-0 lg:absolute -bottom-[20px] left-0 lg:opacity-0 transition-all ease-in-out duration-300 group-hover:bg-white group-hover:opacity-100 group-hover:bottom-0 group-hover:transition-all group-hover:ease-in-out group-hover:duration-300">
                  {item?.isOpenStake ? (
                    <Link href={`/points/${encodeURI(item.dappName)}`}>
                      <Button
                        type="primary"
                        size="medium"
                        className="w-full lg:self-center !rounded-lg m-auto"
                      >
                        View details
                      </Button>
                    </Link>
                  ) : (
                    <div className={styles['coming-soon']}>Coming Soon</div>
                  )}
                </div>
              </div>
            </Flex>
          );
        })
      ) : (
        <>
          {[1].map((list, index) => {
            return (
              <div
                key={index}
                className="stake-card h-[156px] lg:h-[230px] flex flex-col lg:gap-[64px] gap-[32px] px-4 py-4 md:px-8 md:py-8 rounded-xl border border-solid border-neutralDivider bg-neutralWhiteBg "
              >
                <Skeleton avatar active paragraph={{ rows: 2 }} round />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
