import configureMockStore from 'redux-mock-store';
import promiseMiddleware from 'redux-promise';
import { thunk } from 'redux-thunk';

const middlewares = [thunk, promiseMiddleware];

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

export { mockStore };