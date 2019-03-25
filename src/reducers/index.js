import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import tokenReducer from '../ducks/auth';
import eventsReducer, { mapEventsReducer } from '../ducks/events';
import mapsReducer, { homeMapReducer } from '../ducks/maps';
import tracksReducer from '../ducks/tracks';
import mapSubjectReducer from '../ducks/subjects';
import systemStatusReducer from '../ducks/system-status';
import { eventFilterReducer, eventFilterSchemaReducer } from '../ducks/filters';

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
    eventTypes: null,
    eventSchemas: null,
    maps: mapsReducer,
    mapEvents: mapEventsReducer,
    mapSubjects: mapSubjectReducer,
    systemStatus: systemStatusReducer,
    token: persistReducer(tokenPersistanceConfig, tokenReducer),
    tracks: tracksReducer,
  }),
  view: combineReducers({
    homeMap: persistReducer(homeMapPersistanceConfig, homeMapReducer),
    eventFilter: eventFilterReducer,
    eventFilterSchema: eventFilterSchemaReducer,
  }),
});

export default rootReducer;