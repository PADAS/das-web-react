import uniq from 'lodash/uniq';

import { DEFAULT_SHOW_NAMES_IN_MAP_CONFIG } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';

// actions
const UPDATE_HEATMAP_CONFIG = 'UPDATE_HEATMAP_CONFIG';

const OPEN_MAP_FEATURE_TYPES = 'OPEN_MAP_FEATURE_TYPES';
const CLOSE_MAP_FEATURE_TYPES = 'CLOSE_MAP_FEATURE_TYPES';

const SHOW_INACTIVE_RADIOS = 'SHOW_INACTIVE_RADIOS';

const SET_MAP_LOCK_STATE = 'SET_MAP_LOCK_STATE';
const DISPLAY_SUBJECT_NAMES = 'DISPLAY_SUBJECT_NAMES';
const TOGGLE_DISPLAY_USER_LOCATION = 'TOGGLE_DISPLAY_USER_LOCATION';
const TOGGLE_TRACK_TIMEPOINTS = 'TOGGLE_TRACK_TIMEPOINTS';

const UPDATE_SUBJECT_HEATMAP_STATE = 'UPDATE_SUBJECT_HEATMAP_STATE';
export const UPDATE_SUBJECT_TRACK_STATE = 'UPDATE_SUBJECT_TRACK_STATE';

const SET_REPORT_HEATMAP_VISIBILITY = 'SET_REPORT_HEATMAP_VISIBILITY';

const SET_MAP_LOCATION_SELECTION_EVENT = 'SET_MAP_LOCATION_SELECTION_EVENT';
const SET_MAP_LOCATION_SELECTION_PATROL = 'SET_MAP_LOCATION_SELECTION_PATROL';
const SET_IS_PICKING_LOCATION = 'SET_IS_PICKING_LOCATION';

const SET_PRINT_TITLE = 'SET_PRINT_TITLE';

const SET_BOUNCE_EVENT_ID = 'SET_BOUNCE_EVENT_ID';

const SET_MAP_DATA_ZOOM_SIMPLIFICATION = 'SET_MAP_DATA_ZOOM_SIMPLIFICATION';

export const SET_MAP_CLUSTER_CONFIG = 'SET_MAP_CLUSTER_CONFIG';


// action creators
export const setReportHeatmapVisibility = (show) => ({
  type: SET_REPORT_HEATMAP_VISIBILITY,
  payload: show,
});

export const updateHeatmapConfig = (config) => ({
  type: UPDATE_HEATMAP_CONFIG,
  payload: config,
});

export const openMapFeatureType = (...mapFeatureTypes) => ({
  type: OPEN_MAP_FEATURE_TYPES,
  payload: mapFeatureTypes,
});

export const closeMapFeatureType = (...mapFeatureTypes) => ({
  type: CLOSE_MAP_FEATURE_TYPES,
  payload: mapFeatureTypes,
});

export const addHeatmapSubjects = (...subjectIDs) => (dispatch, getState) => {
  const { view: { heatmapSubjectIDs } } = getState();
  return dispatch(updateHeatmapSubjects(uniq([...subjectIDs, ...heatmapSubjectIDs])));
};

export const removeHeatmapSubjects = (...subjectIDs) => (dispatch, getState) => {
  const { view: { heatmapSubjectIDs } } = getState();
  return dispatch(updateHeatmapSubjects(heatmapSubjectIDs.filter(id => !subjectIDs.includes(id))));
};

export const updateHeatmapSubjects = (update) => ({
  type: UPDATE_SUBJECT_HEATMAP_STATE,
  payload: update,
});

export const toggleMapLockState = (enabled) => ({
  type: SET_MAP_LOCK_STATE,
  payload: enabled,
});

export const toggleMapDataSimplificationOnZoom = () => ({
  type: SET_MAP_DATA_ZOOM_SIMPLIFICATION,
});

export const toggleMapNamesState = (enabledLayers) => (dispatch) => {
  return dispatch({
    type: DISPLAY_SUBJECT_NAMES,
    payload: enabledLayers,
  });
};

export const toggleDisplayUserLocation = () => ({
  type: TOGGLE_DISPLAY_USER_LOCATION,
});

export const toggleTrackTimepointState = () => ({
  type: TOGGLE_TRACK_TIMEPOINTS,
});

export const toggleShowInactiveRadioState = (enabled) => ({
  type: SHOW_INACTIVE_RADIOS,
  payload: enabled,
});

export const toggleTrackState = (id) => (dispatch, getState) => {
  const { view: { subjectTrackState: { pinned, visible } } } = getState();
  if (pinned.includes(id)) {
    return dispatch(updateTrackState({
      pinned: pinned.filter(item => item !== id),
      visible: visible.filter(item => item !== id),
    }));
  }
  if (visible.includes(id)) {
    return dispatch(updateTrackState({
      pinned: [...pinned, id],
      visible: visible.filter(item => item !== id),
    }));
  }
  return dispatch(updateTrackState({
    visible: [...visible, id],
  }));

};

export const MAP_LOCATION_SELECTION_MODES = { EVENT_GEOMETRY: 'eventGeometry', DEFAULT: 'default' };

export const setMapLocationSelectionEvent = (event) => ({
  type: SET_MAP_LOCATION_SELECTION_EVENT,
  payload: { event },
});

export const setMapLocationSelectionPatrol = (patrol) => ({
  type: SET_MAP_LOCATION_SELECTION_PATROL,
  payload: { patrol },
});

export const setIsPickingLocation = (isPickingLocation, mode = MAP_LOCATION_SELECTION_MODES.DEFAULT) => ({
  type: SET_IS_PICKING_LOCATION,
  payload: { isPickingLocation, mode },
});

export const updateTrackState = (update) => ({
  type: UPDATE_SUBJECT_TRACK_STATE,
  payload: update,
});

export const setPrintTitle = (title) => ({
  type: SET_PRINT_TITLE,
  payload: title,
});

export const setBounceEventIDs = (eventId) => ({
  type: SET_BOUNCE_EVENT_ID,
  payload: eventId,
});

export const setMapClusterConfig = (payload) => ({
  type: SET_MAP_CLUSTER_CONFIG,
  payload,
});

// reducers

const INITIAL_PRINT_TITLE_STATE = '';
export const printTitleReducer = (state = INITIAL_PRINT_TITLE_STATE, action) => {
  const { type, payload } = action;
  if (type === SET_PRINT_TITLE) return payload;
  return state;
};

export const bounceEventReducer = (state = '', action) => {
  const { type, payload } = action;
  if (type === SET_BOUNCE_EVENT_ID) return payload;
  return state;
};

const INITIAL_REPORT_HEATMAP_STATE = false;
export const reportHeatmapStateReducer = globallyResettableReducer((state, action) => {
  const { type, payload } = action;
  if (type === SET_REPORT_HEATMAP_VISIBILITY) return payload;
  return state;
}, INITIAL_REPORT_HEATMAP_STATE);

const INITIAL_HEATMAP_STYLE_STATE = {
  radiusInMeters: 500,
  intensity: 0.2,
};

export const heatmapStyleConfigReducer = (state = INITIAL_HEATMAP_STYLE_STATE, action) => {
  const { type, payload } = action;
  if (type === UPDATE_HEATMAP_CONFIG) return { ...state, ...payload };
  return state;
};

export const heatmapSubjectIDsReducer = globallyResettableReducer((state, action) => {
  const { type, payload } = action;
  if (type === UPDATE_SUBJECT_HEATMAP_STATE) return payload;
  return state;
}, []);

export const openMapFeatureTypesReducer = globallyResettableReducer((state, action) => {
  const { type, payload } = action;
  if (type === OPEN_MAP_FEATURE_TYPES) return uniq([...payload, ...state]);
  if (type === CLOSE_MAP_FEATURE_TYPES) return state.filter(item => !payload.includes(item));
  return state;
}, []);

export const mapLockStateReducer = (state = false, action) => {
  const { type, payload } = action;
  if (type === SET_MAP_LOCK_STATE) return payload;
  return state;
};

export const mapDataZoomSimplificationReducer = (state = { enabled: false }, action) => {
  const { type } = action;
  if (type === SET_MAP_DATA_ZOOM_SIMPLIFICATION) return { enabled: !state.enabled };
  return state;
};


export const displayMapNamesReducer = (state = DEFAULT_SHOW_NAMES_IN_MAP_CONFIG, action) => {
  const { type, payload } = action;
  if (type === DISPLAY_SUBJECT_NAMES) {
    return payload;
  }
  return state;
};

export const INITIAL_TRACK_STATE = {
  visible: [],
  pinned: [],
};

export const subjectTrackReducer = globallyResettableReducer((state, action) => {
  const { type, payload } = action;
  if (type === UPDATE_SUBJECT_TRACK_STATE) return { ...state, ...payload };
  return state;
}, INITIAL_TRACK_STATE);

const INITIAL_MAP_LOCATION_SELECTION_STATE = {
  event: null,
  isPickingLocation: false,
  mode: MAP_LOCATION_SELECTION_MODES.DEFAULT,
};

export const mapLocationSelectionReducer = (state = INITIAL_MAP_LOCATION_SELECTION_STATE, action) => {
  switch (action.type) {
  case SET_MAP_LOCATION_SELECTION_EVENT:
    return { ...state, event: action.payload.event, patrol: null };

  case SET_MAP_LOCATION_SELECTION_PATROL:
    return { ...state, event: null, patrol: action.payload.patrol };

  case SET_IS_PICKING_LOCATION:
    return {
      ...state,
      isPickingLocation: action.payload.isPickingLocation,
      mode: action.payload.mode,
    };

  default:
    return state;
  }
};

export const displayUserLocationReducer = (state = true, action) => {
  const { type } = action;
  if (type === TOGGLE_DISPLAY_USER_LOCATION) {
    return !state;
  }
  return state;
};

export const displayTrackTimepointsReducer = (state = true, action) => {
  const { type } = action;
  if (type === TOGGLE_TRACK_TIMEPOINTS) {
    return !state;
  }
  return state;
};

export const displayInactiveRadiosReducer = (state = true, action) => {
  const { type } = action;
  if (type === SHOW_INACTIVE_RADIOS) {
    return !state;
  }
  return state;
};

const INITIAL_MAP_CLUSTER_STATE = { reports: true, subjects: true };
export const mapClusterConfigReducer = (state = INITIAL_MAP_CLUSTER_STATE, action) => {
  const { type, payload } = action;

  if (type === SET_MAP_CLUSTER_CONFIG) return payload;

  return state;
};