import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { createRoot } from 'react-dom/client';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { Provider, useDispatch, useSelector } from 'react-redux';
import ReactGA4 from 'react-ga4';
import { useTranslation } from 'react-i18next';

import 'bootstrap/dist/css/bootstrap.css';
import 'react-toastify/dist/ReactToastify.css';

import './i18n';
import './index.scss';

import { EXTERNAL_SAME_DOMAIN_ROUTES, REACT_APP_GA4_TRACKING_ID, REACT_APP_ROUTE_PREFIX } from './constants';
import registerServiceWorker from './registerServiceWorker';
import appConfig from './config';
import { setClientReleaseIdentifier } from './utils/analytics';
import { isSystemConfigLoaded } from './utils/auth';
import store from './store';
import withTracker from './WithTracker';
import { Auth0Provider } from '@auth0/auth0-react';
import { fetchSystemStatus } from './ducks/system-status';

import DetectOffline from './DetectOffline';
import GeoLocationWatcher from './GeoLocationWatcher';
import JiraSupportWidget from './JiraSupportWidget';
import LoadingOverlay from './EarthRangerIconLoadingOverlay';
import NavigationContextProvider from './NavigationContextProvider';
import RequestConfigManager from './RequestConfigManager';
import Auth0TokenManager from './Auth0TokenManager';
import RequireAccessToken from './RequireAccessToken';
import RequireEulaConfirmation from './RequireEulaConfirmation';
import useWebVitals from './hooks/useWebVitals';

const App = lazy(() => import('./App'));
const EulaPage = lazy(() => import('./views/EULA'));
const Login = lazy(() => import('./Login'));

const AppWithTracker = withTracker(App, 'EarthRanger');
const EulaPageWithTracker = withTracker(EulaPage, 'EULA');
const LoginWithTracker = withTracker(Login, 'Login');

ReactGA4.initialize(REACT_APP_GA4_TRACKING_ID, {
  gaOptions: { debug_mode: import.meta.env.DEV },
  gtagOptions: { debug_mode: import.meta.env.DEV },
  testMode: import.meta.env.MODE === 'test'
});

setClientReleaseIdentifier();

const PathNormalizationRouteComponent = ({ location }) => {
  const externalRedirectRef = useRef(null);

  useEffect(() => {
    !!externalRedirectRef.current && externalRedirectRef.current.click();
  });

  const localMatch = EXTERNAL_SAME_DOMAIN_ROUTES.find(item => item === location.pathname);
  if (!import.meta.env.PROD || !localMatch) {
    return <Navigate replace to={REACT_APP_ROUTE_PREFIX} />;
  }
  return <a href={localMatch} ref={externalRedirectRef} style={{ opacity: 0 }} target="_self">{localMatch}</a>;
};

const RootApp = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const systemConfig = useSelector((state) => state.view.systemConfig);
  const [configError, setConfigError] = useState(false);

  useWebVitals();

  useEffect(() => {
    dispatch(fetchSystemStatus())
      .catch(() => setConfigError(true));
  }, [dispatch]);

  useEffect(() => {
    if (window?.Osano?.cm) {
      document.documentElement.lang = i18n.language;
      window.Osano.cm.locale = i18n.language;
    }
  }, [i18n.language]);

  // Block until system config is loaded from the server
  if (!isSystemConfigLoaded(systemConfig)) {
    if (configError) {
      return <div>Failed to load system configuration. Please refresh.</div>;
    }
    return <LoadingOverlay />;
  }

  return <>
    <RequestConfigManager />
    <Auth0TokenManager />

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
      <Auth0Provider
        domain={appConfig.auth0.domain}
        clientId={appConfig.auth0.clientId}
        authorizationParams={{
          audience: appConfig.auth0.audience,
          redirect_uri: `${window.location.origin}${REACT_APP_ROUTE_PREFIX}`,
        }}
        cacheLocation="localstorage"
      >
        <BrowserRouter>
          <NavigationContextProvider>
            <RootApp />
          </NavigationContextProvider>
        </BrowserRouter>
      </Auth0Provider>

      <DetectOffline />
    </PersistGate>

    <GeoLocationWatcher />

    <JiraSupportWidget />
  </Provider>
);

registerServiceWorker();
