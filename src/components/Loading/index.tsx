import Lottie from 'lottie-react';
import LoadingAnimation from 'assets/img/loading-animation.json';
import { useMemo } from 'react';
import React from 'react';

function Loading() {
  const options = useMemo(() => {
    return {
      animationData: LoadingAnimation,
      loop: true,
      autoplay: true,
    };
  }, []);

  return <Lottie {...options} className="w-[40px] h-[40px]" />;
}

export default React.memo(Loading);
