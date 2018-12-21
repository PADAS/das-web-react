import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import tokenReducer from '../ducks/auth';
import eventsReducer, { mapEventsReducer } from '../ducks/events';
import mapsReducer, { homeMapReducer } from '../ducks/maps';
import tracksReducer from '../ducks/tracks';
import mapSubjectReducer from '../ducks/subjects';

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
    tracks: tracksReducer,
    token: persistReducer(tokenPersistanceConfig, tokenReducer),
    mapSubjects: mapSubjectReducer,
    mapEvents: mapEventsReducer,
  }),
  view: combineReducers({
    homeMap: persistReducer(homeMapPersistanceConfig, homeMapReducer),
  }),
});

export default rootReducer;