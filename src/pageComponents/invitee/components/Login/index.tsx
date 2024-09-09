import React from 'react';
import { Button } from 'aelf-design';
import SkeletonImage from 'components/SkeletonImage';
import useResponsive from 'utils/useResponsive';

interface ILoginProps {
  onClick?: () => void;
}

function Login({ onClick }: ILoginProps) {
  const { isLG } = useResponsive();
  return (
    <div className="flex justify-center items-center pt-10 h-full">
      <div className="max-w-[500px] lg:max-w-[939px] flex flex-col items-center gap-10 lg:gap-[90px] lg:flex-row h-fit">
        <div className="flex flex-col gap-8 lg:gap-[72px]">
          <div className="flex flex-col gap-4 lg:gap-6 text-center lg:text-start">
            <div className="font-semibold lg:text-[40px] lg:leading-[56px] text-neutralTitle text-3xl">
              Earn yield and rewards with EcoEarn staking
            </div>
            <div className="text-base lg:text-lg text-neutralSecondary font-normal">
              Join EcoEarn and stake through this referral link to earn Points for both yourself and
              the referrer.
            </div>
          </div>
          <Button className="lg:w-[256px] w-full !rounded-lg" type="primary" onClick={onClick}>
            Login
          </Button>
        </div>
        <SkeletonImage
          className="lg:w-[360px] lg:h-[360px] w-[320px] h-[320px]"
          img={require('assets/img/inviteHomeLogo.png').default.src}
          width={isLG ? 320 : 360}
          height={isLG ? 320 : 360}
          alt="invite logo"
        />
      </div>
    </div>
  );
}

export default React.memo(Login);
