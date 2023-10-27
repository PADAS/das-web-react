import uniq from 'lodash/uniq';

import { generateOptionalStorageConfig } from '../reducers/storage-config';
import globallyResettableReducer from '../reducers/global-resettable';

export const MAP_LAYER_FILTER_STORAGE_KEY = 'mapLayerFilter';
export const mapLayerFilterPersistenceConfig = generateOptionalStorageConfig(MAP_LAYER_FILTER_STORAGE_KEY, []);

// ACTIONS
const UPDATE_MAP_LAYER_FILTER = 'UPDATE_MAP_LAYER_FILTER';
const HIDE_SUBJECTS = 'HIDE_SUBJECTS';
const SHOW_SUBJECTS = 'SHOW_SUBJECTS';

const HIDE_FEATURES = 'HIDE_FEATURES';
const SHOW_FEATURES = 'SHOW_FEATURES';


const HIDE_ANALYZERS = 'HIDE_ANALYZERS';
const SHOW_ANALYZERS = 'SHOW_ANALYZERS';

const DISPLAY_REPORTS_ON_MAP = 'DISPLAY_REPORTS_ON_MAP';

// ACTION CREATORS
export const updateMapLayerFilter = (update) => ({
  type: UPDATE_MAP_LAYER_FILTER,
  payload: update,
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

export const displayReportsOnMapState = (enabled) => ({
  type: DISPLAY_REPORTS_ON_MAP,
  payload: enabled,
});

// REDUCER
export const INITIAL_FILTER_STATE = {
  text: '',
  hiddenSubjectIDs: [],
  hiddenAnalyzerIDs: [],
  hiddenFeatureIDs: [],
  showReportsOnMap: true,
};

const mapLayerFilterReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
  case (UPDATE_MAP_LAYER_FILTER): {
    return {
      ...state, ...payload,
    };
  }

  case (HIDE_SUBJECTS): {
    return {
      ...state,
      hiddenSubjectIDs: uniq([...payload, ...state.hiddenSubjectIDs])
    };
  }

  case (SHOW_SUBJECTS): {
    return {
      ...state,
      hiddenSubjectIDs: state.hiddenSubjectIDs.filter(item => !payload.includes(item)),
    };
  }

  case (HIDE_FEATURES): {
    return {
      ...state,
      hiddenFeatureIDs: uniq([...payload, ...state.hiddenFeatureIDs])
    };
  }

  case (SHOW_FEATURES): {
    return {
      ...state,
      hiddenFeatureIDs: state.hiddenFeatureIDs.filter(item => !payload.includes(item)),
    };
  }

  case (DISPLAY_REPORTS_ON_MAP): {
    return {
      ...state,
      showReportsOnMap: payload,
    };
  }

  case (HIDE_ANALYZERS): {
    return {
      ...state,
      hiddenAnalyzerIDs: uniq([...payload, ...state.hiddenAnalyzerIDs])
    };

  }
  case (SHOW_ANALYZERS): {
    return {
      ...state,
      hiddenAnalyzerIDs: state.hiddenAnalyzerIDs.filter(item => !payload.includes(item)),
    };
  }
  default: {
    return state;
  }
  }
};

export default globallyResettableReducer(mapLayerFilterReducer, INITIAL_FILTER_STATE);