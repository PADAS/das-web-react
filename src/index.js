import React, { lazy, Suspense, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import { Provider } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { library, dom } from '@fortawesome/fontawesome-svg-core';

import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown';

import JiraSupportWidget from './JiraSupportWidget';
import GeoLocationWatcher from './GeoLocationWatcher';

import store from './store';

import { EXTERNAL_SAME_DOMAIN_ROUTES, REACT_APP_ROUTE_PREFIX, REACT_APP_GA_TRACKING_ID } from './constants';

import registerServiceWorker from './registerServiceWorker';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.css';
import './index.scss';

import withTracker from './WithTracker';

import DetectOffline from './DetectOffline';
import RequestConfigManager from './RequestConfigManager';

import { setClientReleaseIdentifier } from './utils/analytics';

import LoadingOverlay from './EarthRangerIconLoadingOverlay';
import NavigationContextProvider from './NavigationContextProvider';
import RequireAccessToken from './RequireAccessToken';
import RequireEulaConfirmation from './RequireEulaConfirmation';

const App = lazy(() => import('./App'));
const EulaPage = lazy(() => import('./views/EULA'));
const Login = lazy(() => import('./Login'));

const AppWithTracker = withTracker(App);
const EulaPageWithTracker = withTracker(EulaPage);
const LoginWithTracker = withTracker(Login);

// registering icons from fontawesome as needed
library.add(faPlus, faTimes, faArrowUp, faArrowDown);
dom.watch();

// Initialize ReactGA with const from .env
ReactGA.initialize(REACT_APP_GA_TRACKING_ID, { testMode: process.env.NODE_ENV === 'test' ? true : false });
setClientReleaseIdentifier();

const persistor = persistStore(store);

const PathNormalizationRouteComponent = ({ location }) => {
  const externalRedirectRef = useRef(null);

  useEffect(() => {
    !!externalRedirectRef.current && externalRedirectRef.current.click();
  });

  const localMatch = EXTERNAL_SAME_DOMAIN_ROUTES.find(item => item === location.pathname);
  if (process.env.NODE_ENV !== 'production' || !localMatch) {
    return <Navigate replace to={REACT_APP_ROUTE_PREFIX} />;
  }

  return <a href={localMatch} style={{ opacity: 0 }} target='_self' ref={externalRedirectRef}>{localMatch}</a>;
};

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor} >
      <BrowserRouter>
        <NavigationContextProvider>
          <RequestConfigManager />

          <Suspense fallback={<LoadingOverlay />}>
            <Routes>
              <Route path={`${REACT_APP_ROUTE_PREFIX}login`} element={<LoginWithTracker />} />

              <Route
                path={`${REACT_APP_ROUTE_PREFIX}eula`}
                element={<RequireAccessToken>
                  <EulaPageWithTracker />
                </RequireAccessToken>}
              />

              <Route
                path={`${REACT_APP_ROUTE_PREFIX}*`}
                element={<RequireEulaConfirmation>
                  <RequireAccessToken>
                    <AppWithTracker />
                  </RequireAccessToken>
                </RequireEulaConfirmation>}
              />

              <Route path="*" element={<PathNormalizationRouteComponent />} />
            </Routes>
          </Suspense>
        </NavigationContextProvider>
      </BrowserRouter>

      <DetectOffline />
    </PersistGate>

    <GeoLocationWatcher />

    <JiraSupportWidget />
  </Provider>
  , document.getElementById('root'));

registerServiceWorker();
