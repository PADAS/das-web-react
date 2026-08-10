import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
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

import { APP_ROUTES } from './constants/routes';
import { EXTERNAL_SAME_DOMAIN_ROUTES, REACT_APP_GA4_TRACKING_ID, REACT_APP_ROUTE_PREFIX } from './constants';
import registerServiceWorker from './registerServiceWorker';
import { setClientReleaseIdentifier } from './utils/analytics';
import store from './store';
import withTracker from './WithTracker';

import Auth0TokenManager from './Auth0TokenManager';
import AuthDiscoveryGate from './AuthDiscoveryGate';
import DetectOffline from './DetectOffline';
import GeoLocationWatcher from './GeoLocationWatcher';
import JiraSupportWidget from './JiraSupportWidget';
import LoadingOverlay from './EarthRangerIconLoadingOverlay';
import NavigationContextProvider from './NavigationContextProvider';
import RequestConfigManager from './RequestConfigManager';
import RequireAccessToken from './RequireAccessToken';
import RequireEulaConfirmation from './RequireEulaConfirmation';
import useWebVitals from './hooks/useWebVitals';

const App = lazy(() => import('./App'));
const CommunityPage = lazy(() => import('./CommunityPage'));
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

const PathNormalizationRouteComponent = () => {
  const location = useLocation();
  const externalRedirectRef = useRef(null);

  useEffect(() => {
    !!externalRedirectRef.current && externalRedirectRef.current.click();
  }, [location.pathname]);

  const localMatch = EXTERNAL_SAME_DOMAIN_ROUTES.find(item => item === location.pathname);
  if (!import.meta.env.PROD || !localMatch) {
    return <Navigate replace to={APP_ROUTES.ROOT} />;
  }
  return <a href={localMatch} ref={externalRedirectRef} style={{ opacity: 0 }} target="_self">{localMatch}</a>;
};

const RootApp = () => {
  const { i18n } = useTranslation();

  useWebVitals();

  useEffect(() => {
    if (window?.Osano?.cm) {
      document.documentElement.lang = i18n.language;
      window.Osano.cm.locale = i18n.language;
    }
  }, [i18n.language]);

  return <>
    <RequestConfigManager />
    <Auth0TokenManager />

    <Suspense fallback={<LoadingOverlay />}>
      <Routes>
        <Route path={APP_ROUTES.LOGIN} element={<LoginWithTracker />} />

        <Route
          path={APP_ROUTES.EULA}
          element={<RequireAccessToken>
            <EulaPageWithTracker />
          </RequireAccessToken>}
        />

        <Route
          path={APP_ROUTES.COMMUNITY}
          element={<CommunityPage />}
        />

        <Route
          path={APP_ROUTES.MAIN}
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
      <AuthDiscoveryGate>
        <BrowserRouter basename={REACT_APP_ROUTE_PREFIX}>
          <NavigationContextProvider>
            <RootApp />
          </NavigationContextProvider>
        </BrowserRouter>
      </AuthDiscoveryGate>

      <DetectOffline />
    </PersistGate>

    <GeoLocationWatcher />

    <JiraSupportWidget />
  </Provider>
);

registerServiceWorker();
