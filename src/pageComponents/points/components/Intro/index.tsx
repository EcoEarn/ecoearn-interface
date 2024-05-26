import { Button } from 'aelf-design';
import { useMemo } from 'react';
import useResponsive from 'utils/useResponsive';
import clsx from 'clsx';
import { RightOutlined } from '@ant-design/icons';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';

export default function Intro({ dappName }: { dappName: string }) {
  const { isMD } = useResponsive();
  const { sgrStakingPointsDesc, sgrStakingPointsTopDesc, schrodingerUrl } = useGetCmsInfo() || {};

  const dappInfo: {
    name: string;
    topDesc?: string;
    desc?: string;
    link?: string;
  } = useMemo(() => {
    if (dappName === 'Schrödinger') {
      return {
        name: dappName,
        topDesc: sgrStakingPointsTopDesc,
        desc: sgrStakingPointsDesc,
        link: schrodingerUrl,
      };
    }
    return {
      name: dappName,
    };
  }, [dappName, schrodingerUrl, sgrStakingPointsDesc, sgrStakingPointsTopDesc]);

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
              className={clsx('w-[14px] h-[14px] text-sm leading-[14px] text-brandDefault ml-2')}
              width={14}
              height={14}
            />
          </Button>
        )}
      </div>
    ) : null;
  }, [dappInfo?.desc, dappInfo?.link]);

  return (
    <>
      <div className="flex md:flex-row flex-col gap-x-4">
        <span className="text-4xl md:text-5xl font-semibold text-neutralTitle">
          {dappInfo?.name}
        </span>
        <div className="flex gap-2 items-center">
          {dappInfo?.topDesc && (
            <span className="text-base md:text-xl font-medium text-neutralPrimary md:leading-[48px]">
              {dappInfo?.topDesc}
            </span>
          )}
        </div>
      </div>
      {learnMore}
    </>
  );
}
