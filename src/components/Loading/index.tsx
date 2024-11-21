import React from 'react';

import { ReactComponent as LoadingIcon } from 'assets/img/loading.svg';
import clsx from 'clsx';

interface ILoadingProps {
  className?: string;
}

function Loading(props?: ILoadingProps) {
  const { className } = props || {};
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
  return (
    <LoadingIcon
      className={clsx('animate-spin w-[36px] h-[36px] lg:w-[50px] lg:h-[50px]', className)}
    />
  );
}

export default React.memo(Loading);
