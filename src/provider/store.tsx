'use client';

import { store } from 'redux/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Loading from 'components/Loading';

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      {/* <PersistGate persistor={store.__persistor}>{children}</PersistGate> */}
      <>{children}</>
    </Provider>
  );
};

export default StoreProvider;
