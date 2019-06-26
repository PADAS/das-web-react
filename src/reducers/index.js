import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import tokenReducer from '../ducks/auth';
import eventsReducer, { mapEventsReducer, eventStoreReducer } from '../ducks/events';
import eventTypesReducer from '../ducks/event-types';
import mapsReducer, { homeMapReducer } from '../ducks/maps';
import tracksReducer from '../ducks/tracks';
import mapSubjectReducer, { subjectGroupsReducer } from '../ducks/subjects';
import systemStatusReducer, { zendeskReducer } from '../ducks/system-status';
import { heatmapStyleConfigReducer, hiddenSubjectIDsReducer, displayMapNamesReducer, hiddenFeatureIDsReducer, heatmapSubjectIDsReducer, subjectTrackReducer, mapLockStateReducer, pickingLocationOnMapReducer } from '../ducks/map-ui';
import popupReducer from '../ducks/popup';
import userPreferencesReducer from '../ducks/user-preferences';
import eventFilterReducer from '../ducks/event-filter';
import userReducer, { userProfilesReducer, selectedUserProfileReducer } from '../ducks/user';
import modalsReducer from '../ducks/modals';
import eventSchemaReducer from '../ducks/event-schemas';
import featuresReducer from '../ducks/features';

const tokenPersistanceConfig = {
  key: 'token',
  storage,
};

const homeMapPersistanceConfig = {
  key: 'homeMap',
  storage,
};

const userPrefPersistanceConfig = {
  key: 'userPreferences',
  storage,
};

const heatmapConfigPersistanceConfig = {
  key: 'heatmapConfig',
  storage,
};


const userProfilePersistanceConfig = {
  key: 'userProfile',
  storage,
};

const rootReducer = combineReducers({
  data: combineReducers({
    events: eventsReducer,
    eventStore: eventStoreReducer,
    eventFilter: eventFilterReducer,
    eventSchemas: eventSchemaReducer,
    eventTypes: eventTypesReducer,
    featureSets: featuresReducer,
    maps: mapsReducer,
    mapEvents: mapEventsReducer,
    mapSubjects: mapSubjectReducer,
    subjectGroups: subjectGroupsReducer,
    systemStatus: systemStatusReducer,
    token: persistReducer(tokenPersistanceConfig, tokenReducer),
    tracks: tracksReducer,
    user: userReducer,
    userProfiles: userProfilesReducer,
    selectedUserProfile: persistReducer(userProfilePersistanceConfig, selectedUserProfileReducer),
  }),
  view: combineReducers({
    homeMap: persistReducer(homeMapPersistanceConfig, homeMapReducer),
    heatmapStyles: persistReducer(heatmapConfigPersistanceConfig, heatmapStyleConfigReducer),
    heatmapSubjectIDs: heatmapSubjectIDsReducer,
    hiddenSubjectIDs: hiddenSubjectIDsReducer,
    hiddenFeatureIDs: hiddenFeatureIDsReducer,
    subjectTrackState: subjectTrackReducer,
    mapIsLocked: mapLockStateReducer,
    showMapNames: displayMapNamesReducer,
    modals: modalsReducer,
    pickingLocationOnMap: pickingLocationOnMapReducer,
    popup: popupReducer,
    userPreferences: persistReducer(userPrefPersistanceConfig, userPreferencesReducer),
    zendeskEnabled: zendeskReducer,
  }),
});

export default rootReducer;
