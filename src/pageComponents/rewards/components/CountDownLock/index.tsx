import useCountDownLock from 'hooks/useCountDownLock';
export default function CountDownLock({ targetTimeStamp }: { targetTimeStamp: number | string }) {
  const { isUnLocked, countDisplay } = useCountDownLock(targetTimeStamp);

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
