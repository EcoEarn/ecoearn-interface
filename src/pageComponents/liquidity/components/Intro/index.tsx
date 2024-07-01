import clsx from 'clsx';
import { RightOutlined } from '@ant-design/icons';
import { useCallback } from 'react';
import useGetCmsInfo from 'redux/hooks/useGetCmsInfo';

export default function Intro() {
  const { awakenSGRUrl } = useGetCmsInfo() || {};

  const openAwaken = useCallback(() => {
    if (awakenSGRUrl) {
      window.open(awakenSGRUrl, '_blank');
    }
  }, [awakenSGRUrl]);

  return (
    <>
      <h2 className="text-4xl lg:text-5xl font-semibold text-neutralTitle">My Liquidity</h2>
      <div className="text-base text-neutralPrimary font-medium flex flex-col gap-1 mt-2 lg:mt-4">
        <p>EcoEarn supports staking rewards early to the Farms through adding liquidity.</p>
        <p>
          For more liquidity pools, you can view
          <span className="ml-4 text-brandDefault cursor-pointer" onClick={openAwaken}>
            AwakenSwap
            <RightOutlined
              className={clsx('w-[14px] h-[14px] text-sm leading-[14px] text-brandDefault ml-2')}
              width={14}
              height={14}
            />
          </span>
        </p>
      </div>
    </>
  );
}
