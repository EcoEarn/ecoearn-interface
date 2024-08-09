import { useParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Intro from './components/Intro';
import PointsStakingList from './components/PointsStakingList';
import { ReactComponent as BackSVG } from 'assets/img/back.svg';
import { Button } from 'aelf-design';

export default function StakePage() {
  const { dappName } = useParams() as {
    dappName: string;
  };
  const router = useRouter();

  const decodeAppName = useMemo(() => {
    return decodeURIComponent(dappName);
  }, [dappName]);

  const onBack = useCallback(() => {
    router.replace('/points');
  }, [router]);

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
      <Intro dappName={decodeAppName} />
      <PointsStakingList dappName={decodeAppName} />
    </div>
  );
}
