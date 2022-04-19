import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { library, dom } from '@fortawesome/fontawesome-svg-core';

import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown';

import JiraSupportWidget from './JiraSupportWidget';
import GeoLocationWatcher from './GeoLocationWatcher';
import PathNormalizationRoute from './PathNormalizationRoute';

import store from './store';

import { REACT_APP_ROUTE_PREFIX, REACT_APP_GA_TRACKING_ID } from './constants';

import registerServiceWorker from './registerServiceWorker';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.css';
import './index.scss';

import withTracker from './WithTracker';

import DetectOffline from './DetectOffline';
import RequestConfigManager from './RequestConfigManager';

import { setClientReleaseIdentifier } from './utils/analytics';

import LoadingOverlay from './EarthRangerIconLoadingOverlay';
import PrivateRoute from './PrivateRoute';
import EulaProtectedRoute from './EulaProtectedRoute';

const App = lazy(() => import('./App'));
const EulaPage = lazy(() => import('./views/EULA'));
const Login = lazy(() => import('./Login'));

// registering icons from fontawesome as needed
library.add(faPlus, faTimes, faArrowUp, faArrowDown);
dom.watch();

// Initialize ReactGA with const from .env
ReactGA.initialize(REACT_APP_GA_TRACKING_ID, { testMode: process.env.NODE_ENV === 'test' ? true : false });
setClientReleaseIdentifier();

const persistor = persistStore(store);

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor} >
      <BrowserRouter>
        <RequestConfigManager />
        <Suspense fallback={<LoadingOverlay />}>
          <Switch>
            <Route path={`${REACT_APP_ROUTE_PREFIX}login`} component={withTracker(Login)} />
            <PrivateRoute exact path={`${REACT_APP_ROUTE_PREFIX}eula`} component={withTracker(EulaPage)} />
            <EulaProtectedRoute path={REACT_APP_ROUTE_PREFIX} component={withTracker(App)} />
            <Route component={PathNormalizationRoute} />
          </Switch>
        </Suspense>
      </BrowserRouter>
      <DetectOffline />
    </PersistGate>
    <GeoLocationWatcher />
    <JiraSupportWidget />
  </Provider>
  , document.getElementById('root'));

registerServiceWorker();
