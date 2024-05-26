import { useSelector } from 'react-redux';
import { getLoginStatus } from 'redux/reducer/loginStatus';

const useGetLoginStatus = () => {
  const loginStatus = useSelector(getLoginStatus);
  return loginStatus;
};

export default useGetLoginStatus;
