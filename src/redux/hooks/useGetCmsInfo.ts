import { useSelector } from 'react-redux';
import { selectInfo } from 'redux/reducer/info';

const useGetCmsInfo = () => {
  const info = useSelector(selectInfo);

  return info.cmsInfo;
};

export default useGetCmsInfo;
