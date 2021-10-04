import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { ToastContainer } from 'react-toastify';
import { library, dom } from '@fortawesome/fontawesome-svg-core';

import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown';

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

/* LAZY LOAD THESE WITH React.Suspense and React.lazy once the server is config'd to keep old deployment chunks */
// import LoadingOverlay from './EarthRangerIconLoadingOverlay';
import App from './App';
import Login from './Login';
import EulaPage from './views/EULA';
import PrivateRoute from './PrivateRoute';
import EulaProtectedRoute from './EulaProtectedRoute';

// registering icons from fontawesome as needed
library.add(faPlus, faTimes, faArrowUp, faArrowDown);
dom.watch();

// Initialize ReactGA with const from .env
ReactGA.initialize(REACT_APP_GA_TRACKING_ID, { testMode: process.env.NODE_ENV === 'test' ? true : false });
setClientReleaseIdentifier();

const persistor = persistStore(store);

const PathNormalizationRouteComponent = (props) => {
  const externalRedirectRef = useRef(null);

  useEffect(() => {
    !!externalRedirectRef.current && externalRedirectRef.current.click();
  });

  const GoToHomepage = () => <Redirect
    to={REACT_APP_ROUTE_PREFIX}
  />;

  if (process.env.NODE_ENV !== 'production') {
    return <GoToHomepage />;
  }

  const localMatch = EXTERNAL_SAME_DOMAIN_ROUTES.find(item => item === props.location.pathname);
  if (!localMatch) {
    return <GoToHomepage />;
  }


  return <a href={localMatch} style={{ opacity: 0 }} target='_self' ref={externalRedirectRef}>{localMatch}</a>;
};

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor} >
      <BrowserRouter>
        <RequestConfigManager />
        <Switch>
          <EulaProtectedRoute exact path={REACT_APP_ROUTE_PREFIX} component={withTracker(App)} />
          <Route path={`${REACT_APP_ROUTE_PREFIX}login`} component={withTracker(Login)} />
          <PrivateRoute exact path={`${REACT_APP_ROUTE_PREFIX}eula`} component={withTracker(EulaPage)} />
          <Route component={PathNormalizationRouteComponent} />

        </Switch>
      </BrowserRouter>
      <ToastContainer />
      <DetectOffline />
    </PersistGate>
  </Provider>
  , document.getElementById('root'));

registerServiceWorker();
