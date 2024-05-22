import useCountDownLock from 'hooks/useCountDownLock';
export default function CountDownLock({
  targetTimeStamp,
  onFinish,
}: {
  targetTimeStamp: number | string;
  onFinish?: () => void;
}) {
  const { isUnLocked, countDisplay } = useCountDownLock({ targetTimeStamp, onFinish });

  return (
    <span className="text-base font-semibold text-neutralTitle">
      {isUnLocked ? 'Unlocked' : countDisplay}
    </span>
  );
}
