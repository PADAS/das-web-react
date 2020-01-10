import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import tokenReducer, { masterRequestTokenReducer } from '../ducks/auth';
import eventStoreReducer, { mapEventsReducer, eventFeedReducer, incidentFeedReducer } from '../ducks/events';
import eventTypesReducer from '../ducks/event-types';
import mapsReducer, { homeMapReducer } from '../ducks/maps';
import tracksReducer, { trackDateRangeReducer } from '../ducks/tracks';
import mapSubjectReducer, { subjectGroupsReducer } from '../ducks/subjects';
import systemStatusReducer, { systemConfigReducer } from '../ducks/system-status';
import {
  heatmapStyleConfigReducer, hiddenSubjectIDsReducer, displayMapNamesReducer,
  hiddenFeatureIDsReducer, heatmapSubjectIDsReducer, hiddenAnalyzerIDsReducer, subjectTrackReducer, mapLockStateReducer,
  pickingLocationOnMapReducer, printTitleReducer, displayUserLocationReducer, displayReportsOnMapReducer, bounceEventReducer,
  displayTrackTimepointsReducer, reportHeatmapStateReducer, displayInactiveRadiosReducer, openMapFeatureTypesReducer, 
} from '../ducks/map-ui';
import popupReducer from '../ducks/popup';
import mapImagesReducer from '../ducks/map-images';
import userPreferencesReducer from '../ducks/user-preferences';
import eventFilterReducer from '../ducks/event-filter';
import mapLayerFilterReducer from '../ducks/map-layer-filter';
import userReducer, { userProfilesReducer, selectedUserProfileReducer } from '../ducks/user';
import modalsReducer from '../ducks/modals';
import eventSchemaReducer from '../ducks/event-schemas';
import featuresReducer from '../ducks/features';
import userLocationReducer from '../ducks/location';
import socketActivityReducer from '../ducks/realtime';
import userNotificationReducer from '../ducks/user-notifications';
import baseLayersReducer, { currentBaseLayerReducer } from '../ducks/layers';
import analyzersReducer from '../ducks/analyzers';
import timeSliderReducer from '../ducks/timeslider';

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
    baseLayers: baseLayersReducer,
    eventStore: eventStoreReducer,
    feedEvents: eventFeedReducer,
    feedIncidents: incidentFeedReducer,
    mapEvents: mapEventsReducer,
    eventFilter: eventFilterReducer,
    eventSchemas: eventSchemaReducer,
    eventTypes: eventTypesReducer,
    featureSets: featuresReducer,
    mapLayerFilter: mapLayerFilterReducer,
    analyzerFeatures: analyzersReducer,
    showReportsOnMap: displayReportsOnMapReducer,
    maps: mapsReducer,
    mapSubjects: mapSubjectReducer,
    masterRequestCancelToken: masterRequestTokenReducer,
    subjectGroups: subjectGroupsReducer,
    systemStatus: systemStatusReducer,
    token: persistReducer(tokenPersistanceConfig, tokenReducer),
    tracks: tracksReducer,
    user: userReducer,
    userProfiles: userProfilesReducer,
    selectedUserProfile: persistReducer(userProfilePersistanceConfig, selectedUserProfileReducer),
    socketUpdates: socketActivityReducer,
  }),
  view: combineReducers({
    currentBaseLayer: currentBaseLayerReducer,
    homeMap: persistReducer(homeMapPersistanceConfig, homeMapReducer),
    heatmapStyles: persistReducer(heatmapConfigPersistanceConfig, heatmapStyleConfigReducer),
    heatmapSubjectIDs: heatmapSubjectIDsReducer,
    hiddenSubjectIDs: hiddenSubjectIDsReducer,
    hiddenFeatureIDs: hiddenFeatureIDsReducer,
    hiddenAnalyzerIDs: hiddenAnalyzerIDsReducer,
    subjectTrackState: subjectTrackReducer,
    mapImages: mapImagesReducer,
    mapIsLocked: mapLockStateReducer,
    showMapNames: displayMapNamesReducer,
    showUserLocation: displayUserLocationReducer,
    showTrackTimepoints: displayTrackTimepointsReducer,
    showReportsOnMap: displayReportsOnMapReducer,
    modals: modalsReducer,
    pickingLocationOnMap: pickingLocationOnMapReducer,
    popup: popupReducer,
    userPreferences: persistReducer(userPrefPersistanceConfig, userPreferencesReducer),
    userLocation: userLocationReducer,
    showReportHeatmap: reportHeatmapStateReducer,
    trackLength: trackDateRangeReducer,
    userNotifications: userNotificationReducer,
    systemConfig: systemConfigReducer,
    timeSliderState: timeSliderReducer,
    printTitle: printTitleReducer,
    bounceEventID: bounceEventReducer,
    showInactiveRadios: displayInactiveRadiosReducer,
    openMapFeatureTypeNames: openMapFeatureTypesReducer,
  }),
});

export default rootReducer;
