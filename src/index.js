import React from 'react';

import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { persistStore } from 'redux-persist';
import ReduxPromise from 'redux-promise';
import { PersistGate } from 'redux-persist/integration/react';
import ReduxThunk from 'redux-thunk';
import { REACT_APP_ROUTE_PREFIX } from './constants';

import registerServiceWorker from './registerServiceWorker';
import 'typeface-roboto';
import 'typeface-roboto-slab';
import 'bootstrap/dist/css/bootstrap.css';
import './index.scss';
import reducers from './reducers';
import App from './App';
import Login from './Login';
import PrivateRoute from './PrivateRoute';

if (process.env.NODE_ENV !== 'production') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React);
}

const createStoreWithMiddleware = applyMiddleware(ReduxThunk, ReduxPromise)(createStore);
export const store = createStoreWithMiddleware(reducers);
const persistor = persistStore(store);

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor} >
      <BrowserRouter>
        <Switch>
          <PrivateRoute exact path={REACT_APP_ROUTE_PREFIX} component={App} />
          <Route path={`${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'login' : '/login'}`} component={Login} />
        </Switch>
      </BrowserRouter>
    </PersistGate>
  </Provider>
  , document.getElementById('root'));

registerServiceWorker();
