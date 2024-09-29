import { Button } from 'aelf-design';
import { useMemo } from 'react';
import clsx from 'clsx';
import { RightOutlined } from '@ant-design/icons';
import useDappList from 'hooks/useDappList';
import SkeletonImage from 'components/SkeletonImage';
import { Flex } from 'antd';
import { ReactComponent as GainSVG } from 'assets/img/gain.svg';

export default function Intro({ dappName }: { dappName: string }) {
  const { dappList } = useDappList();

  const dappInfo: {
    name: string;
    topDesc?: string;
    desc?: string;
    link?: string;
    img?: string;
  } = useMemo(() => {
    const dapp = dappList?.filter((item) => item?.dappName === dappName)?.[0];
    return {
      name: dappName,
      topDesc: dapp?.pointsType ? `${dapp?.pointsType} Points Staking` : '',
      desc: 'Staking multiple types of points for more rewards',
      link: dapp?.gainUrl,
      img: dapp?.icon || '',
    };
  }, [dappList, dappName]);

  const learnMore = useMemo(() => {
    return dappInfo?.desc || dappInfo?.link ? (
      <div className="text-neutralPrimary text-sm font-medium md:text-base mt-2 md:mt-4 flex items-start md:items-center flex-col md:flex-row gap-2">
        {dappInfo?.desc && <span>{dappInfo?.desc}</span>}
        {dappInfo?.link && (
          <Button
            type="link"
            className="!px-0 !h-[24px] flex items-center"
            onClick={() => {
              window.open(dappInfo?.link, '_blank');
            }}
          >
            <span
              className={clsx(
                'text-brandDefault text-sm md:text-base font-medium hover:text-brandHover',
              )}
            >
              Gain points
            </span>
            <RightOutlined
              className={clsx('w-[14px] h-[14px] text-sm leading-[14px] !text-brandDefault ml-2')}
              width={14}
              height={14}
            />
          </Button>
        )}
      </div>
    ) : null;
  }, [dappInfo?.desc, dappInfo?.link]);

  if (!dappInfo) {
    return null;
  }
  return (
    <>
      <div className="flex flex-row gap-4 items-center flex-wrap justify-between">
        <div className="flex items-center gap-4">
          {dappInfo?.img && (
            <SkeletonImage
              img={dappInfo?.img}
              alt="logo"
              width={64}
              height={64}
              className="rounded-md overflow-hidden"
            />
          )}
          <div className="flex flex-col">
            <span className="text-4xl leading-[44px] font-semibold text-neutralTitle">
              {dappInfo?.name}
            </span>
            {dappInfo?.topDesc && (
              <span className="text-xl font-medium text-neutralPrimary">{dappInfo?.topDesc}</span>
            )}
          </div>
        </div>
        {dappInfo?.link && (
          <Button
            size="large"
            type="primary"
            ghost
            className="!w-[173px] !rounded-lg"
            onClick={() => {
              window.open(dappInfo?.link, '_blank');
            }}
          >
            <Flex gap={8} align="center">
              <span className="text-base font-medium text-brandDefault">Earn Points</span>
              <GainSVG />
            </Flex>
          </Button>
        )}
      </div>
    </>
  );
}
