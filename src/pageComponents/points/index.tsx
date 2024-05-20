import { useParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from 'antd';
import Intro from './components/Intro';
import PointsStakingList from './components/PointsStakingList';

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

  if (decodeAppName !== 'Schrödinger') {
    return null;
  }

  return (
    <div>
      <Breadcrumb
        className="mt-[32px] lg:mt-[48px] mb-[20px] lg:mb-[32px]"
        items={[
          {
            title: (
              <span className="cursor-pointer" onClick={onBack}>
                Stake
              </span>
            ),
          },
          {
            title: <div>{decodeAppName}</div>,
          },
        ]}
      />
      <Intro dappName={decodeAppName} />
      <PointsStakingList />
    </div>
  );
}
