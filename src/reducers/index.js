import { combineReducers } from 'redux';
import { persistReducer, createMigrate } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import localForage from 'localforage';
import tokenReducer, { masterRequestTokenReducer } from '../ducks/auth';
import eventStoreReducer, { mapEventsReducer, eventFeedReducer, incidentFeedReducer } from '../ducks/events';
import eventTypesReducer from '../ducks/event-types';
import observationsReducer from '../ducks/observations';
import patrolsReducer, { patrolStoreReducer, patrolTracksReducer } from '../ducks/patrols';
import patrolTypesReducer from '../ducks/patrol-types';
import patrolFilterReducer from '../ducks/patrol-filter';
import mapsReducer, { homeMapReducer } from '../ducks/maps';
import tracksReducer, { trackDateRangeReducer } from '../ducks/tracks';
import mapSubjectReducer, { subjectGroupsReducer, subjectStoreReducer } from '../ducks/subjects';
import systemStatusReducer, { systemConfigReducer } from '../ducks/system-status';
import featureFlagOverrideReducer, { migrations as flagOverrideMigrations } from '../ducks/feature-flag-overrides';
import {
  heatmapStyleConfigReducer, hiddenSubjectIDsReducer, displayMapNamesReducer,
  hiddenFeatureIDsReducer, heatmapSubjectIDsReducer, hiddenAnalyzerIDsReducer, subjectTrackReducer, mapLockStateReducer,
  mapDataZoomSimplificationReducer, mapLocationSelectionReducer, printTitleReducer,
  displayUserLocationReducer, displayReportsOnMapReducer, bounceEventReducer,
  displayTrackTimepointsReducer, reportHeatmapStateReducer, displayInactiveRadiosReducer, openMapFeatureTypesReducer, mapClusterConfigReducer,
} from '../ducks/map-ui';
import popupReducer from '../ducks/popup';
import mapImagesReducer from '../ducks/map-images';
import userPreferencesReducer from '../ducks/user-preferences';
import eventFilterReducer from '../ducks/event-filter';
import mapLayerFilterReducer from '../ducks/map-layer-filter';
import userReducer, { userProfilesReducer, selectedUserProfileReducer, userLocationAccessGrantedReducer } from '../ducks/user';
import modalsReducer from '../ducks/modals';
import drawerReducer from '../ducks/drawer';
import eulaReducer from '../ducks/eula';
import eventSchemaReducer from '../ducks/event-schemas';
import featuresReducer from '../ducks/features';
import userLocationReducer from '../ducks/location';
import socketActivityReducer from '../ducks/realtime';
import userNotificationReducer from '../ducks/user-notifications';
import baseLayersReducer, { currentBaseLayerReducer } from '../ducks/layers';
import analyzersReducer from '../ducks/analyzers';
import timeSliderReducer from '../ducks/timeslider';
import externalReportingReducer from '../ducks/external-reporting';
import patrolTrackedBySchemaReducer from '../ducks/trackedby';
import sideBarReducer from '../ducks/side-bar';
import locallyEditedEventReducer from '../ducks/locally-edited-event';

const generateStorageConfig = (key, storageMethod = storage, version = -1, migrations) => {
  const config = { key, storage: storageMethod, version };

  if (migrations) {
    config.migrate = createMigrate(migrations);
  }

  return config;

};

const tokenPersistanceConfig = generateStorageConfig('token');
const homeMapPersistanceConfig = generateStorageConfig('homeMap');
const userPrefPersistanceConfig = generateStorageConfig('userPreferences');
const heatmapConfigPersistanceConfig = generateStorageConfig('heatmapConfig');
const userProfilePersistanceConfig = generateStorageConfig('userProfile');
const mapsPersistanceConfig = generateStorageConfig('maps');
const baseLayerPersistanceConfig = generateStorageConfig('baseLayer');
const featureFlagOverrideConfig = generateStorageConfig('featureFlagOverrides', storage, 0, flagOverrideMigrations);
const featureSetsPersistanceConfig = generateStorageConfig('featureSets', localForage);
const analyzersPersistanceConfig = generateStorageConfig('analyzers', localForage);
const mapDataZoomSimplificationConfig = generateStorageConfig('mapDataOnZoom', localForage);
const trackLengthPersistanceConfig = generateStorageConfig('trackLength');
const mapClusterStorageConfig = generateStorageConfig('mapClusterConfig');

const rootReducer = combineReducers({
  data: combineReducers({
    baseLayers: baseLayersReducer,
    eventStore: eventStoreReducer,
    patrolStore: patrolStoreReducer,
    feedEvents: eventFeedReducer,
    feedIncidents: incidentFeedReducer,
    locallyEditedEvent: locallyEditedEventReducer,
    mapEvents: mapEventsReducer,
    eula: eulaReducer,
    eventFilter: eventFilterReducer,
    patrolFilter: patrolFilterReducer,
    eventSchemas: eventSchemaReducer,
    eventTypes: eventTypesReducer,
    featureSets: persistReducer(featureSetsPersistanceConfig, featuresReducer),
    mapLayerFilter: mapLayerFilterReducer,
    analyzerFeatures: persistReducer(analyzersPersistanceConfig, analyzersReducer),
    maps: persistReducer(mapsPersistanceConfig, mapsReducer),
    mapSubjects: mapSubjectReducer,
    masterRequestCancelToken: masterRequestTokenReducer,
    observations: observationsReducer,
    patrols: patrolsReducer,
    patrolTypes: patrolTypesReducer,
    reports: externalReportingReducer,
    subjectGroups: subjectGroupsReducer,
    subjectStore: subjectStoreReducer,
    systemStatus: systemStatusReducer,
    token: persistReducer(tokenPersistanceConfig, tokenReducer),
    tracks: tracksReducer,
    user: userReducer,
    userProfiles: userProfilesReducer,
    selectedUserProfile: persistReducer(userProfilePersistanceConfig, selectedUserProfileReducer),
    socketUpdates: socketActivityReducer,
    patrolLeaderSchema: patrolTrackedBySchemaReducer,
  }),
  view: combineReducers({
    currentBaseLayer: persistReducer(baseLayerPersistanceConfig, currentBaseLayerReducer),
    featureFlagOverrides: persistReducer(featureFlagOverrideConfig, featureFlagOverrideReducer),
    homeMap: persistReducer(homeMapPersistanceConfig, homeMapReducer),
    heatmapStyles: persistReducer(heatmapConfigPersistanceConfig, heatmapStyleConfigReducer),
    heatmapSubjectIDs: heatmapSubjectIDsReducer,
    hiddenSubjectIDs: hiddenSubjectIDsReducer,
    hiddenFeatureIDs: hiddenFeatureIDsReducer,
    hiddenAnalyzerIDs: hiddenAnalyzerIDsReducer,
    subjectTrackState: subjectTrackReducer,
    patrolTrackState: patrolTracksReducer,
    mapImages: mapImagesReducer,
    mapIsLocked: mapLockStateReducer,
    showMapNames: displayMapNamesReducer,
    showUserLocation: displayUserLocationReducer,
    showTrackTimepoints: displayTrackTimepointsReducer,
    showReportsOnMap: displayReportsOnMapReducer,
    simplifyMapDataOnZoom: persistReducer(mapDataZoomSimplificationConfig, mapDataZoomSimplificationReducer),
    mapClusterConfig: persistReducer(mapClusterStorageConfig, mapClusterConfigReducer),
    modals: modalsReducer,
    drawer: drawerReducer,
    mapLocationSelection: mapLocationSelectionReducer,
    popup: popupReducer,
    userPreferences: persistReducer(userPrefPersistanceConfig, userPreferencesReducer),
    userLocation: userLocationReducer,
    userLocationAccessGranted: userLocationAccessGrantedReducer,
    showReportHeatmap: reportHeatmapStateReducer,
    trackLength: persistReducer(trackLengthPersistanceConfig, trackDateRangeReducer),
    userNotifications: userNotificationReducer,
    systemConfig: systemConfigReducer,
    timeSliderState: timeSliderReducer,
    printTitle: printTitleReducer,
    bounceEventIDs: bounceEventReducer,
    showInactiveRadios: displayInactiveRadiosReducer,
    openMapFeatureTypeNames: openMapFeatureTypesReducer,
    sideBar: sideBarReducer,
  }),
});

export default rootReducer;
