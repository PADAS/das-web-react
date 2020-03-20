import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { persistStore } from 'redux-persist';
import ReduxPromise from 'redux-promise';
import { PersistGate } from 'redux-persist/integration/react';
import ReduxThunk from 'redux-thunk';
import { ToastContainer } from 'react-toastify';
import { library, dom } from '@fortawesome/fontawesome-svg-core';

import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown';

import { REACT_APP_ROUTE_PREFIX, REACT_APP_GA_TRACKING_ID } from './constants';
import reducers from './reducers';

import registerServiceWorker from './registerServiceWorker';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.css';
import './index.scss';

import withTracker from './WithTracker';

import DetectOffline from './DetectOffline';
import LoadingOverlay from './EarthRangerIconLoadingOverlay';
import RequestConfigManager from './RequestConfigManager';

const App = lazy(() => import('./App'));
const Login = lazy(() => import('./Login'));
const EulaPage = lazy(() => import('./views/EULA'));
const PrivateRoute = lazy(() => import('./PrivateRoute'));
const EulaProtectedRoute = lazy(() => import('./EulaProtectedRoute'));

// registering icons from fontawesome as needed
library.add(faPlus, faTimes, faArrowUp, faArrowDown);
dom.watch();

// Initialize ReactGA with const from .env
ReactGA.initialize(REACT_APP_GA_TRACKING_ID);

const createStoreWithMiddleware = applyMiddleware(ReduxThunk, ReduxPromise)(createStore);
export const store = createStoreWithMiddleware(reducers);
const persistor = persistStore(store);

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor} >
      <BrowserRouter>
        <Suspense fallback={<LoadingOverlay message='Loading...' />}>
          <Switch>
            <Route path='cancel-admin-eula' component={() => { window.location.href='/admin/logut'; }}/>
            <Route path={`${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'login' : '/login'}`} component={withTracker(Login)} />
            <PrivateRoute exact path={`${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'eula' : '/eula'}`} component={withTracker(EulaPage)} />
            <EulaProtectedRoute exact path={REACT_APP_ROUTE_PREFIX} component={withTracker(App)} />
          </Switch>
        </Suspense>
        <RequestConfigManager />
      </BrowserRouter>
      <ToastContainer />
      <DetectOffline />
    </PersistGate>
  </Provider>
  , document.getElementById('root'));

registerServiceWorker();
