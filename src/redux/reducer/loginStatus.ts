import { createSlice } from '@reduxjs/toolkit';
import { AppState } from 'redux/store';
import { HYDRATE } from 'next-redux-wrapper';
import { TLoginStatusType } from 'redux/types/reducerTypes';

const initialState: TLoginStatusType = {
  loginStatus: {
    isConnectWallet: false,
    hasToken: false,
    isLogin: false,
  },
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

export const { setLoginStatus, resetLoginStatus } = loginStatusSlice.actions;
export const getLoginStatus = (state: AppState) => state.loginStatus.loginStatus;

export default loginStatusSlice.reducer;
