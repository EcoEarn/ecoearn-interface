import Lottie from 'lottie-react';
import LoadingAnimation from 'assets/img/loading-animation.json';
import { useMemo } from 'react';
import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

// import { ReactComponent as LoadingIcon } from 'assets/img/loading.svg';

function Loading() {
  // const options = useMemo(() => {
  //   return {
  //     animationData: LoadingAnimation,
  //     loop: true,
  //     autoplay: true,
  //   };
  // }, []);

  // return <Lottie {...options} className="w-[40px] h-[40px]" />;
  return <Spin indicator={<LoadingOutlined />} size="large" />;
}

export default React.memo(Loading);
