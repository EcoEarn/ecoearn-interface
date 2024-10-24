import { createSlice } from '@reduxjs/toolkit';
import { AppState } from 'redux/store';
import { HYDRATE } from 'next-redux-wrapper';
import { InfoStateType } from 'redux/types/reducerTypes';
import { ITradeConfirmProps } from 'components/TradeConfrim';

const initialState: InfoStateType = {
  isMobile: false,
  isSmallScreen: false,
  baseInfo: {
    rpcUrl: '',
  },
  theme: 'light',
  showLoginErrorModal: false,
};

// Actual Slice
export const infoSlice = createSlice({
  name: 'info',
  initialState,
  reducers: {
    setIsMobile(state, action) {
      state.isMobile = action.payload;
    },
    setCmsInfo(state, action) {
      state.cmsInfo = action.payload;
    },
    setDappList(state, action) {
      state.dappList = action.payload;
    },
    setConfirmInfo(
      state,
      action: {
        payload: ITradeConfirmProps;
      },
    ) {
      state.confirmInfo = action.payload;
    },
    setShowLoginErrorModal(state, action) {
      state.showLoginErrorModal = action.payload;
    },
  },

  // Special reducer for hydrating the state. Special case for next-redux-wrapper
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.info,
      };
    },
  },
});

export const { setIsMobile, setCmsInfo, setDappList, setConfirmInfo, setShowLoginErrorModal } =
  infoSlice.actions;
export const selectInfo = (state: AppState) => state.info;
export default infoSlice.reducer;
