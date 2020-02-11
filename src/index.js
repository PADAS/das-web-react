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

import PrivateRoute from './PrivateRoute';
import EulaProtectedRoute from './EulaProtectedRoute';
import withTracker from './WithTracker';

import LoadingOverlay from './EarthRangerIconLoadingOverlay';

const App = lazy(() => import('./App'));
const Login = lazy(() => import('./Login'));
const EulaPage = lazy(() => import('./views/EULA'));

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
            <EulaProtectedRoute exact path={REACT_APP_ROUTE_PREFIX} component={withTracker(App)} />
            <Route path={`${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'login' : '/login'}`} component={withTracker(Login)} />
            <PrivateRoute path={`${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'eula' : '/eula'}`} component={withTracker(EulaPage)} />
          </Switch>
        </Suspense>
      </BrowserRouter>
      <ToastContainer />
    </PersistGate>
  </Provider>
  , document.getElementById('root'));

registerServiceWorker();
