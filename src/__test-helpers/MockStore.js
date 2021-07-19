import React from 'react';

import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ReduxPromise from 'redux-promise';
import ReduxThunk from 'redux-thunk';

const middlewares = [ReduxPromise, ReduxThunk];

jest.mock('redux-persist', () => {
  const real = jest.requireActual('redux-persist');
  return {
    ...real,
    persistReducer: jest
      .fn()
      .mockImplementation((config, reducers) => reducers),
  };
});

const mockStore = configureMockStore(middlewares);

const store = mockStore({
  data: {
    maps: [],
    events: {
      results: [],
    },
  },
  view: {
    homeMap: null,
  },
});

console.log({ store });

const MockStoreProvider = ({ children }) => <Provider store={store}>
  {children}
</Provider>;

export default MockStoreProvider;

export { store };