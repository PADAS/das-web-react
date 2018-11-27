import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import tokenReducer from '../ducks/auth';
import eventsReducer from '../ducks/events';
import mapsReducer, { homeMapReducer } from '../ducks/maps';

const tokenPersistanceConfig = {
  key: 'token',
  storage,
};

const homeMapPersistanceConfig = {
  key: 'homeMap',
  storage,
};

const rootReducer = combineReducers({
  data: combineReducers({
    events: eventsReducer,
    maps: mapsReducer,
    token: persistReducer(tokenPersistanceConfig, tokenReducer),
  }),
  view: combineReducers({
    homeMap: persistReducer(homeMapPersistanceConfig, homeMapReducer),
  }),
});

export default rootReducer;