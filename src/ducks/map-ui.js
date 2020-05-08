import uniq from 'lodash/uniq';

// actions
const UPDATE_HEATMAP_CONFIG = 'UPDATE_HEATMAP_CONFIG';

const HIDE_SUBJECTS = 'HIDE_SUBJECTS';
const SHOW_SUBJECTS = 'SHOW_SUBJECTS';

const HIDE_FEATURES = 'HIDE_FEATURES';
const SHOW_FEATURES = 'SHOW_FEATURES';

const OPEN_MAP_FEATURE_TYPES = 'OPEN_MAP_FEATURE_TYPES';
const CLOSE_MAP_FEATURE_TYPES = 'CLOSE_MAP_FEATURE_TYPES';

const HIDE_ANALYZERS = 'HIDE_ANALYZERS';
const SHOW_ANALYZERS = 'SHOW_ANALYZERS';
const SHOW_INACTIVE_RADIOS = 'SHOW_INACTIVE_RADIOS';

const SET_MAP_LOCK_STATE = 'SET_MAP_LOCK_STATE';
const DISPLAY_SUBJECT_NAMES = 'DISPLAY_SUBJECT_NAMES';
const TOGGLE_DISPLAY_USER_LOCATION = 'TOGGLE_DISPLAY_USER_LOCATION';
const TOGGLE_TRACK_TIMEPOINTS = 'TOGGLE_TRACK_TIMEPOINTS';
const DISPLAY_REPORTS_ON_MAP = 'DISPLAY_REPORTS_ON_MAP';

const UPDATE_SUBJECT_HEATMAP_STATE = 'UPDATE_SUBJECT_HEATMAP_STATE';
const UPDATE_SUBJECT_TRACK_STATE = 'UPDATE_SUBJECT_TRACK_STATE';

const SET_REPORT_HEATMAP_VISIBILITY = 'SET_REPORT_HEATMAP_VISIBILITY';

const SET_PICKING_MAP_LOCATION_STATE = 'SET_PICKING_MAP_LOCATION_STATE';

const SET_PRINT_TITLE = 'SET_PRINT_TITLE';

const SET_BOUNCE_EVENT_ID = 'SET_BOUNCE_EVENT_ID';

const SET_MAP_DATA_ZOOM_SIMPLIFICATION = 'SET_MAP_DATA_ZOOM_SIMPLIFICATION';


// action creators
export const setReportHeatmapVisibility = (show) => ({
  type: SET_REPORT_HEATMAP_VISIBILITY,
  payload: show,
});

export const updateHeatmapConfig = (config) => ({
  type: UPDATE_HEATMAP_CONFIG,
  payload: config,
});

export const hideSubjects = (...subjectIDs) => ({
  type: HIDE_SUBJECTS,
  payload: subjectIDs,
});

export const showSubjects = (...subjectIDs) => ({
  type: SHOW_SUBJECTS,
  payload: subjectIDs,
});

export const hideFeatures = (...featureIDs) => ({
  type: HIDE_FEATURES,
  payload: featureIDs,
});

export const showFeatures = (...featureIDs) => ({
  type: SHOW_FEATURES,
  payload: featureIDs,
});

export const hideAnalyzers = (...analyzerFeatureIDs) => ({
  type: HIDE_ANALYZERS,
  payload: analyzerFeatureIDs,
});

export const showAnalyzers = (...analyzerFeatureIDs) => ({
  type: SHOW_ANALYZERS,
  payload: analyzerFeatureIDs,
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

export const toggleMapNameState = (enabled) => ({
  type: DISPLAY_SUBJECT_NAMES,
  payload: enabled,
});

export const displayReportsOnMapState = (enabled) => ({
  type: DISPLAY_REPORTS_ON_MAP,
  payload: enabled,
});

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

export const setPickingMapLocationState = (isPicking) => ({
  type: SET_PICKING_MAP_LOCATION_STATE,
  payload: isPicking,
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
export const reportHeatmapStateReducer = (state = INITIAL_REPORT_HEATMAP_STATE, action) => {
  const { type, payload } = action;
  if (type === SET_REPORT_HEATMAP_VISIBILITY) return payload;
  return state;
};

const INITIAL_HEATMAP_STYLE_STATE = {
  radiusInMeters: 500,
  intensity: 0.2,
};

export const heatmapStyleConfigReducer = (state = INITIAL_HEATMAP_STYLE_STATE, action) => {
  const { type, payload } = action;
  if (type === UPDATE_HEATMAP_CONFIG) return { ...state, ...payload };
  return state;
};

export const heatmapSubjectIDsReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === UPDATE_SUBJECT_HEATMAP_STATE) return payload;
  return state;
};

export const hiddenSubjectIDsReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === HIDE_SUBJECTS) return uniq([...payload, ...state]);
  if (type === SHOW_SUBJECTS) return state.filter(item => !payload.includes(item));
  return state;
};

export const hiddenFeatureIDsReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === HIDE_FEATURES) return uniq([...payload, ...state]);
  if (type === SHOW_FEATURES) return state.filter(item => !payload.includes(item));
  return state;
};

export const hiddenAnalyzerIDsReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === HIDE_ANALYZERS) return uniq([...payload, ...state]);
  if (type === SHOW_ANALYZERS) return state.filter(item => !payload.includes(item));
  return state;
};

export const openMapFeatureTypesReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === OPEN_MAP_FEATURE_TYPES) return uniq([...payload, ...state]);
  if (type === CLOSE_MAP_FEATURE_TYPES) return state.filter(item => !payload.includes(item));
  return state;
};

export const mapLockStateReducer = (state = false, action) => {
  const { type, payload } = action;
  if (type === SET_MAP_LOCK_STATE) return payload;
  return state;
};

export const mapDataZoomSimplificationReducer = (state = { enabled: true }, action) => {
  const { type } = action;
  if (type === SET_MAP_DATA_ZOOM_SIMPLIFICATION) return { enabled: !state.enabled };
  return state;
};


export const displayMapNamesReducer = (state = true, action) => {
  const { type, payload } = action;
  if (type === DISPLAY_SUBJECT_NAMES) return payload;
  return state;
};

export const displayReportsOnMapReducer = (state = true, action) => {
  const { type, payload } = action;
  if (type === DISPLAY_REPORTS_ON_MAP) return payload;
  return state;
};

export const INITIAL_TRACK_STATE = {
  visible: [],
  pinned: [],
};

export const subjectTrackReducer = (state = INITIAL_TRACK_STATE, action) => {
  const { type, payload } = action;
  if (type === UPDATE_SUBJECT_TRACK_STATE) return { ...state, ...payload };
  return state;
};

export const pickingLocationOnMapReducer = (state = false, action) => {
  const { type, payload } = action;
  if (type === SET_PICKING_MAP_LOCATION_STATE) {
    return payload;
  }
  return state;
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