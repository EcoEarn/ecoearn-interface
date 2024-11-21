import { createSlice } from '@reduxjs/toolkit';
import { AppState } from 'redux/store';
import { HYDRATE } from 'next-redux-wrapper';
import { TLoginStatusType } from 'redux/types/reducerTypes';

const initialState: TLoginStatusType = {
  loginStatus: {
    isConnectWallet: false,
    hasToken: false,
    isLogin: false,
    isLoadingToken: false,
    isLoadingConnectWallet: false,
  },
  showIndexLoading: false,
  percentFinish: false,
  connectWalletError: '',
};

// Actual Slice
export const loginStatusSlice = createSlice({
  name: 'loginStatus',
  initialState,
  reducers: {
    setLoginStatus(state, action) {
      state.loginStatus = {
        ...state.loginStatus,
        ...action.payload,
      };
    },
    resetLoginStatus(state) {
      state.loginStatus = initialState.loginStatus;
    },
    setShowIndexLoading(state, action) {
      state.showIndexLoading = action.payload;
    },
    setPercentFinish(state, action) {
      state.percentFinish = action.payload;
    },
    setConnectWalletError(state, action) {
      state.connectWalletError = action.payload;
    },
  },

  // Special reducer for hydrating the state. Special case for next-redux-wrapper
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.loginStatus,
      };
    },
  },
});

export const {
  setLoginStatus,
  resetLoginStatus,
  setPercentFinish,
  setShowIndexLoading,
  setConnectWalletError,
} = loginStatusSlice.actions;
export const getLoginStatus = (state: AppState) => state.loginStatus.loginStatus;

export const getConnectWalletErrorInfo = (state: AppState) => state.loginStatus.connectWalletError;
export const getShowIndexLoadings = (state: AppState) => state.loginStatus.showIndexLoading;

export default loginStatusSlice.reducer;
