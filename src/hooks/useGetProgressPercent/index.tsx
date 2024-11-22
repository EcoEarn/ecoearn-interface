import { sleep } from '@portkey/utils';
import { useCallback, useEffect, useState } from 'react';

const defaultMaxPercent = 80;

function useGetProgressPercent() {
  const [percent, setPercent] = useState<number>(0);

  const updatePercent = async () => {
    if (percent <= defaultMaxPercent) {
      setPercent((percent) => {
        const currentPercent = percent + 27;
        return currentPercent > defaultMaxPercent ? defaultMaxPercent : currentPercent;
      });
    }
    await sleep(1000);
    updatePercent();
  };

  const onFinish = useCallback(() => {
    setPercent(100);
  }, []);

  const resetPercent = useCallback(() => {
    setPercent(0);
  }, []);

  useEffect(() => {
    updatePercent();
  }, []);

  return {
    percent,
    onFinish,
    resetPercent,
  };
}

export default useGetProgressPercent;
