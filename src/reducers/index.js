import { combineReducers } from 'redux';
import localForage from 'localforage';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { generateStorageConfig } from './storage-config';
import coordinateReferenceSystemsReducer from '../ducks/coordinate-reference-systems';
import tokenReducer, { masterRequestTokenReducer } from '../ducks/auth';
import eventStoreReducer, { mapEventsReducer, eventFeedReducer, incidentFeedReducer } from '../ducks/events';
import communityReducer from '../ducks/community';
import eventCategoriesReducer from '../ducks/event-categories';
import eventTypesReducer from '../ducks/event-types';
import observationsReducer from '../ducks/observations';
import { patrolsFeedReducer, patrolStoreReducer, patrolTracksReducer } from '../ducks/patrols';
import patrolTypesReducer from '../ducks/patrol-types';
import patrolFilterReducer, { persistenceConfig as patrolFilterPersistenceConfig } from '../ducks/patrol-filter';
import mapsReducer, { homeMapReducer } from '../ducks/maps';
import mapPositionReducer, { persistenceConfig as mapPositionPersistenceConfig } from '../ducks/map-position';
import tracksReducer, { trackSettingsReducer } from '../ducks/tracks';
import mapSubjectReducer, { subjectGroupsReducer, subjectStoreReducer } from '../ducks/subjects';
import gearReducer from '../ducks/gear';
import systemConfigReducer from '../ducks/system-config';
import systemStatusReducer from '../ducks/system-status';
import {
  heatmapStyleConfigReducer,
  displayMapNamesReducer,
  heatmapSubjectIDsReducer,
  subjectTrackReducer,
  mapLockStateReducer,
  mapDataZoomSimplificationReducer,
  mapLocationSelectionReducer,
  printTitleReducer,
  displayUserLocationReducer,
  bounceEventReducer,
  displayTrackTimepointsReducer,
  reportHeatmapStateReducer,
  displayInactiveRadiosReducer,
  openMapFeatureTypesReducer,
  mapClusterConfigReducer,
  mapClusterConfigMigrations,
} from '../ducks/map-ui';
import { mapFeatureHighlightIdReducer } from '../ducks/mapFeatureHighlight';
import popupReducer from '../ducks/popup';
import mapImagesReducer from '../ducks/map-images';
import userPreferencesReducer from '../ducks/user-preferences';
import eventFilterReducer, { persistenceConfig as eventFilterPersistenceConfig } from '../ducks/event-filter';
import mapLayerFilterReducer, { mapLayerFilterPersistenceConfig } from '../ducks/map-layer-filter';
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
import recentEventDataReceivedReducer from '../ducks/recent-event-data-received';
import experimentalFeaturesReducer from '../ducks/experimental-features';

const tokenPersistenceConfig = generateStorageConfig('token');
const homeMapPersistenceConfig = generateStorageConfig('homeMap');
const userPrefPersistenceConfig = generateStorageConfig('userPreferences');
const mapLabelPreferencesPersistenceConfig = generateStorageConfig('mapLabelPreferences');
const heatmapConfigPersistenceConfig = generateStorageConfig('heatmapConfig');
const userProfilePersistenceConfig = generateStorageConfig('userProfile');
const mapsPersistenceConfig = generateStorageConfig('maps');
const baseLayerPersistenceConfig = generateStorageConfig('baseLayer');
const featureSetsPersistenceConfig = generateStorageConfig('featureSets', localForage);
const analyzersPersistenceConfig = generateStorageConfig('analyzers', localForage);
const mapDataZoomSimplificationConfig = generateStorageConfig('mapDataOnZoom', localForage);
const trackSettingsPersistenceConfig = generateStorageConfig('trackSettings');
const mapClusterStorageConfig = generateStorageConfig('mapClusterConfig', storage, 1, mapClusterConfigMigrations);
const coordinateReferenceSystemsStorageConfig = generateStorageConfig('coordinateReferenceSystems');
const experimentalFeaturesStorageConfig = generateStorageConfig('experimentalFeatures');

const rootReducer = combineReducers({
  data: combineReducers({
    baseLayers: baseLayersReducer,
    eventStore: eventStoreReducer,
    patrolsFeed: patrolsFeedReducer,
    patrolStore: patrolStoreReducer,
    feedEvents: eventFeedReducer,
    feedIncidents: incidentFeedReducer,
    community: communityReducer,
    locallyEditedEvent: locallyEditedEventReducer,
    mapEvents: mapEventsReducer,
    eula: eulaReducer,
    eventFilter: persistReducer(eventFilterPersistenceConfig, eventFilterReducer),
    patrolFilter: persistReducer(patrolFilterPersistenceConfig, patrolFilterReducer),
    eventSchemas: eventSchemaReducer,
    eventCategories: eventCategoriesReducer,
    eventTypes: eventTypesReducer,
    featureSets: persistReducer(featureSetsPersistenceConfig, featuresReducer),
    gear: gearReducer,
    mapLayerFilter: persistReducer(
      mapLayerFilterPersistenceConfig,
      mapLayerFilterReducer,
    ),
    analyzerFeatures: persistReducer(analyzersPersistenceConfig, analyzersReducer),
    mapPosition: persistReducer(mapPositionPersistenceConfig, mapPositionReducer),
    maps: persistReducer(mapsPersistenceConfig, mapsReducer),
    mapSubjects: mapSubjectReducer,
    masterRequestCancelToken: masterRequestTokenReducer,
    recentEventDataReceived: recentEventDataReceivedReducer,
    observations: observationsReducer,
    patrolTypes: patrolTypesReducer,
    reports: externalReportingReducer,
    subjectGroups: subjectGroupsReducer,
    subjectStore: subjectStoreReducer,
    systemStatus: systemStatusReducer,
    token: persistReducer(tokenPersistenceConfig, tokenReducer),
    tracks: tracksReducer,
    user: userReducer,
    userProfiles: userProfilesReducer,
    selectedUserProfile: persistReducer(userProfilePersistenceConfig, selectedUserProfileReducer),
    socketUpdates: socketActivityReducer,
    patrolLeaderSchema: patrolTrackedBySchemaReducer,
  }),
  view: combineReducers({
    coordinateReferenceSystems: persistReducer(coordinateReferenceSystemsStorageConfig, coordinateReferenceSystemsReducer),
    currentBaseLayer: persistReducer(baseLayerPersistenceConfig, currentBaseLayerReducer),
    experimentalFeatures: persistReducer(experimentalFeaturesStorageConfig, experimentalFeaturesReducer),
    homeMap: persistReducer(homeMapPersistenceConfig, homeMapReducer),
    heatmapStyles: persistReducer(heatmapConfigPersistenceConfig, heatmapStyleConfigReducer),
    heatmapSubjectIDs: heatmapSubjectIDsReducer,
    subjectTrackState: subjectTrackReducer,
    patrolTrackState: patrolTracksReducer,
    mapImages: mapImagesReducer,
    mapIsLocked: mapLockStateReducer,
    showMapNames: persistReducer(mapLabelPreferencesPersistenceConfig, displayMapNamesReducer),
    showUserLocation: displayUserLocationReducer,
    showTrackTimepoints: displayTrackTimepointsReducer,
    simplifyMapDataOnZoom: persistReducer(mapDataZoomSimplificationConfig, mapDataZoomSimplificationReducer),
    mapClusterConfig: persistReducer(mapClusterStorageConfig, mapClusterConfigReducer),
    modals: modalsReducer,
    drawer: drawerReducer,
    mapLocationSelection: mapLocationSelectionReducer,
    popup: popupReducer,
    userPreferences: persistReducer(userPrefPersistenceConfig, userPreferencesReducer),
    userLocation: userLocationReducer,
    userLocationAccessGranted: userLocationAccessGrantedReducer,
    showReportHeatmap: reportHeatmapStateReducer,
    trackSettings: persistReducer(trackSettingsPersistenceConfig, trackSettingsReducer),
    userNotifications: userNotificationReducer,
    systemConfig: systemConfigReducer,
    timeSliderState: timeSliderReducer,
    printTitle: printTitleReducer,
    mapFeatureHighlightIDs: mapFeatureHighlightIdReducer,
    bounceEventIDs: bounceEventReducer,
    showInactiveRadios: displayInactiveRadiosReducer,
    openMapFeatureTypeNames: openMapFeatureTypesReducer,
    sideBar: sideBarReducer,
  }),
});

export default rootReducer;
