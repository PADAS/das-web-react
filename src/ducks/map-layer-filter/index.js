import uniq from 'lodash/uniq';

import { generateOptionalStorageConfig } from '../../reducers/storage-config';
import globallyResettableReducer from '../../reducers/global-resettable';
import { MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../../constants';

export const MAP_LAYER_FILTER_STORAGE_KEY = 'mapLayerFilter';

// Actions
const SET_GROUPED = 'MAP_LAYER_FILTER_SET_GROUPED';

const SET_SORT_BY = 'MAP_LAYER_FILTER_SET_SORT_BY';

const SET_SORT_DIRECTION = 'MAP_LAYER_FILTER_SET_SORT_DIRECTION';

const SET_TEXT = 'MAP_LAYER_FILTER_SET_TEXT';

const HIDE_SUBJECTS = 'HIDE_SUBJECTS';
const SHOW_SUBJECTS = 'SHOW_SUBJECTS';

const HIDE_FEATURES = 'HIDE_FEATURES';
const SHOW_FEATURES = 'SHOW_FEATURES';

const HIDE_ANALYZERS = 'HIDE_ANALYZERS';
const SHOW_ANALYZERS = 'SHOW_ANALYZERS';

const DISPLAY_REPORTS_ON_MAP = 'DISPLAY_REPORTS_ON_MAP';

// Action creators
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

export const displayReportsOnMapState = (enabled) => ({
  type: DISPLAY_REPORTS_ON_MAP,
  payload: enabled,
});

export const setGrouped = (grouped) => ({ payload: grouped, type: SET_GROUPED });

export const setSortBy = (sortBy) => ({ payload: sortBy, type: SET_SORT_BY });

export const setSortDirection = (sortDirection) => ({ payload: sortDirection, type: SET_SORT_DIRECTION });

export const setText = (text) => ({ payload: text, type: SET_TEXT });

// Reducer
export const INITIAL_FILTER_STATE = {
  grouped: true,
  hiddenAnalyzerIDs: [],
  hiddenFeatureIDs: [],
  hiddenSubjectIDs: [],
  showReportsOnMap: true,
  sortBy: MAP_LAYER_SORT_VALUES.LAST_UPDATE,
  sortDirection: SORT_DIRECTION.down,
  text: '',
};

export const mapLayerFilterPersistenceConfig = generateOptionalStorageConfig(
  MAP_LAYER_FILTER_STORAGE_KEY,
  INITIAL_FILTER_STATE
);

const mapLayerFilterReducer = (state, action) => {
  switch (action.type) {
  case HIDE_SUBJECTS:
    return {
      ...state,
      hiddenSubjectIDs: uniq([...action.payload, ...state.hiddenSubjectIDs])
    };

  case SHOW_SUBJECTS:
    return {
      ...state,
      hiddenSubjectIDs: state.hiddenSubjectIDs.filter((item) => !action.payload.includes(item)),
    };

  case HIDE_FEATURES:
    return {
      ...state,
      hiddenFeatureIDs: uniq([...action.payload, ...state.hiddenFeatureIDs])
    };

  case SHOW_FEATURES:
    return {
      ...state,
      hiddenFeatureIDs: state.hiddenFeatureIDs.filter((item) => !action.payload.includes(item)),
    };

  case DISPLAY_REPORTS_ON_MAP:
    return { ...state, showReportsOnMap: action.payload };

  case HIDE_ANALYZERS:
    return {
      ...state,
      hiddenAnalyzerIDs: uniq([...action.payload, ...state.hiddenAnalyzerIDs])
    };

  case SHOW_ANALYZERS:
    return {
      ...state,
      hiddenAnalyzerIDs: state.hiddenAnalyzerIDs.filter((item) => !action.payload.includes(item)),
    };

  case SET_GROUPED:
    return { ...state, grouped: action.payload };

  case SET_SORT_BY:
    return { ...state, sortBy: action.payload };

  case SET_SORT_DIRECTION:
    return { ...state, sortDirection: action.payload };

  case SET_TEXT:
    return { ...state, text: action.payload };

  default:
    return state;
  }
};

export default globallyResettableReducer(mapLayerFilterReducer, INITIAL_FILTER_STATE);
