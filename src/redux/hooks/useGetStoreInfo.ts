import { useSelector } from 'react-redux';
import { selectInfo } from 'redux/reducer/info';

const useGetStoreInfo = () => {
  const info = useSelector(selectInfo);
  return {
    cmsInfo: info.cmsInfo,
    dappList: info.dappList,
    showLoginErrorModal: info.showLoginErrorModal,
  };
};

export default useGetStoreInfo;
