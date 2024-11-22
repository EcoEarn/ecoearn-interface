import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { AppState } from 'redux/store';

export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

export const useGetIndexLoadingStatus = () =>
  useAppSelector((state) => state.loginStatus.showIndexLoading);
export const useGetPercentFinish = () => useAppSelector((state) => state.loginStatus.percentFinish);

export const useGetConnectWalletErrorInfo = () =>
  useAppSelector((state) => state.loginStatus.connectWalletError);
