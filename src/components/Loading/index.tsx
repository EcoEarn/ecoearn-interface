import Lottie from 'lottie-react';
import LoadingAnimation from 'assets/img/loading-animation.json';
import { useMemo } from 'react';
import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

import { ReactComponent as LoadingIcon } from 'assets/img/loading.svg';

function Loading() {
  // const options = useMemo(() => {
  //   return {
  //     animationData: LoadingAnimation,
  //     loop: true,
  //     autoplay: true,
  //   };
  // }, []);

  // return <Lottie {...options} className="w-[40px] h-[40px]" />;
  // eslint-disable-next-line no-inline-styles/no-inline-styles
  // return <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />;
  return <LoadingIcon className="animate-spin w-[36px] h-[36px] lg:w-[50px] lg:h-[50px]" />;
}

export default React.memo(Loading);
