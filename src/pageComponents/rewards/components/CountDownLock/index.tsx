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
    <>
      {isUnLocked ? (
        <span className="text-base font-medium text-functionalSuccess">Unlocked</span>
      ) : (
        <span className="text-brandDefault text-base font-medium">{countDisplay}</span>
      )}
    </>
  );
}
