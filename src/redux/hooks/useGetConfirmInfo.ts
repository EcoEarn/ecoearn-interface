import { useSelector } from 'react-redux';
import { selectInfo } from 'redux/reducer/info';

const useGetConfirmInfo = () => {
  const info = useSelector(selectInfo);

  return info.confirmInfo;
};

export default useGetConfirmInfo;
