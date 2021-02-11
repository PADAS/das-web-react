import '../test-helpers/window';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ReduxPromise from 'redux-promise';
import ReduxThunk from 'redux-thunk';

import App from './App';

const middlewares = [ReduxPromise, ReduxThunk];

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

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});