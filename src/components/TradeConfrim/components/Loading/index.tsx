import React from 'react';
import { ReactComponent as LoadingIcon } from 'assets/img/loading.svg';
function Loading() {
  return <LoadingIcon className="animate-spin w-[56px] h-[56px] lg:w-[56px] lg:h-[56px]" />;
}

export default React.memo(Loading);
