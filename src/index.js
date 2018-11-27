import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { persistStore } from 'redux-persist'
import ReduxPromise from 'redux-promise';
import { PersistGate } from 'redux-persist/integration/react';
import ReduxThunk from 'redux-thunk';

import registerServiceWorker from './registerServiceWorker';
import './index.css';
import reducers from './reducers';
import App from './App';
import Login from './Login';
import PrivateRoute from './PrivateRoute';

const createStoreWithMiddleware = applyMiddleware(ReduxThunk, ReduxPromise)(createStore);
const store = createStoreWithMiddleware(reducers);
const persistor = persistStore(store);

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor} >
      <BrowserRouter>
        <Switch>
          <PrivateRoute exact path="/" component={App} />
          <Route path="/login" component={Login} />
        </Switch>
      </BrowserRouter>
    </PersistGate>
  </Provider>
  , document.getElementById('root'));

registerServiceWorker();
