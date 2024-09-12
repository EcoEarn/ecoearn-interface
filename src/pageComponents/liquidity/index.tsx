import { Button } from 'aelf-design';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { ReactComponent as BackSVG } from 'assets/img/back.svg';
import Intro from './components/Intro';
import LiquidityList from './components/LiquidityList';
import { useTimeout } from 'ahooks';
import useGetLoginStatus from 'redux/hooks/useGetLoginStatus';

export default function LiquidityPage() {
  const router = useRouter();
  const { isLogin } = useGetLoginStatus();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  useTimeout(() => {
    if (!isLogin) {
      onBack();
    }
  }, 3000);

  return (
    <div>
      <Button
        type="link"
        className="mt-[32px] !p-0 !min-w-fit flex items-center gap-2 lg:mt-[48px] mb-[20px] lg:mb-[32px] cursor-pointer"
        onClick={onBack}
      >
        <BackSVG />
        <span className="text-sm font-medium text-neutralTitle">Back</span>
      </Button>
      <Intro />
      <LiquidityList />
    </div>
  );
}
