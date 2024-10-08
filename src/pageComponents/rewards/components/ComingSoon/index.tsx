import { ReactComponent as ComingSoonSVG } from 'assets/img/comingSoon.svg';

const ComingSoon = () => {
  return (
    <div className="w-full border border-solid border-neutralDivider rounded-xl bg-neutralWhiteBg py-[32px] lg:py-[48px]  text-center">
      <ComingSoonSVG className="w-[79px] h-[82px] lg:w-[157px] lg:h-[164px]" />
      <div className="text-[14px] mt-[10px] lg:mt-[24px] lg:text-[16px] text-neutralTertiary">
        Coming soon
      </div>
    </div>
  );
};

export default ComingSoon;
