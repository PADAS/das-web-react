import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { Provider } from 'react-redux';
import ReactGA4 from 'react-ga4';
import { useTranslation } from 'react-i18next';

import 'bootstrap/dist/css/bootstrap.css';
import 'react-toastify/dist/ReactToastify.css';

import './i18n';
import './index.scss';

import { EXTERNAL_SAME_DOMAIN_ROUTES, REACT_APP_GA4_TRACKING_ID, REACT_APP_ROUTE_PREFIX } from './constants';
import registerServiceWorker from './registerServiceWorker';
import { setClientReleaseIdentifier } from './utils/analytics';
import store from './store';
import withTracker from './WithTracker';

import DetectOffline from './DetectOffline';
import GeoLocationWatcher from './GeoLocationWatcher';
import JiraSupportWidget from './JiraSupportWidget';
import LoadingOverlay from './EarthRangerIconLoadingOverlay';
import NavigationContextProvider from './NavigationContextProvider';
import RequestConfigManager from './RequestConfigManager';
import RequireAccessToken from './RequireAccessToken';
import RequireEulaConfirmation from './RequireEulaConfirmation';

const App = lazy(() => import('./App'));
const EulaPage = lazy(() => import('./views/EULA'));
const Login = lazy(() => import('./Login'));

const AppWithTracker = withTracker(App, 'EarthRanger');
const EulaPageWithTracker = withTracker(EulaPage, 'EULA');
const LoginWithTracker = withTracker(Login, 'Login');

ReactGA4.initialize(REACT_APP_GA4_TRACKING_ID, { testMode: process.env.NODE_ENV === 'test' });

setClientReleaseIdentifier();

const PathNormalizationRouteComponent = ({ location }) => {
  const externalRedirectRef = useRef(null);

  useEffect(() => {
    !!externalRedirectRef.current && externalRedirectRef.current.click();
  });

  const localMatch = EXTERNAL_SAME_DOMAIN_ROUTES.find(item => item === location.pathname);
  if (process.env.NODE_ENV !== 'production' || !localMatch) {
    return <Navigate replace to={REACT_APP_ROUTE_PREFIX} />;
  }
  return <a href={localMatch} ref={externalRedirectRef} style={{ opacity: 0 }} target="_self">{localMatch}</a>;
};

const RootApp = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return <>
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
          element={<RequireAccessToken>
            <RequireEulaConfirmation>
              <AppWithTracker />
            </RequireEulaConfirmation>
          </RequireAccessToken>}
        />

        <Route path="*" element={<PathNormalizationRouteComponent />} />
      </Routes>
    </Suspense>
  </>;
};

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistStore(store)} >
      <BrowserRouter>
        <NavigationContextProvider>
          <RootApp />
        </NavigationContextProvider>
      </BrowserRouter>

      <DetectOffline />
    </PersistGate>

    <GeoLocationWatcher />

    <JiraSupportWidget />
  </Provider>
);

registerServiceWorker();
