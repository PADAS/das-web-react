import { createTransform } from 'redux-persist';
import omit from 'lodash/omit';
import uniq from 'lodash/uniq';

import { generateOptionalStorageConfig } from '../../reducers/storage-config';
import globallyResettableReducer from '../../reducers/global-resettable';
import { MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../../constants';

export const MAP_LAYER_FILTER_STORAGE_KEY = 'mapLayerFilter';

// Actions
export const SET_GROUPED = 'MAP_LAYER_FILTER.SET_GROUPED';

export const SET_SORT_BY = 'MAP_LAYER_FILTER.SET_SORT_BY';

export const SET_SORT_DIRECTION = 'MAP_LAYER_FILTER.SET_SORT_DIRECTION';

export const SET_TEXT = 'MAP_LAYER_FILTER.SET_TEXT';

const HIDE_SUBJECTS = 'HIDE_SUBJECTS';
const SHOW_SUBJECTS = 'SHOW_SUBJECTS';

const HIDE_FEATURES = 'HIDE_FEATURES';
const SHOW_FEATURES = 'SHOW_FEATURES';

const HIDE_ANALYZERS = 'HIDE_ANALYZERS';
const SHOW_ANALYZERS = 'SHOW_ANALYZERS';

const DISPLAY_REPORTS_ON_MAP = 'DISPLAY_REPORTS_ON_MAP';

const FROM_ATLAS_META = { isFromAtlas: true };

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

export const setMapLayersFilterText = (text) => ({ payload: text, type: SET_TEXT });

export const hideSubjectsFromAtlas = (...subjectIDs) => ({ ...hideSubjects(...subjectIDs), meta: FROM_ATLAS_META });

export const showSubjectsFromAtlas = (...subjectIDs) => ({ ...showSubjects(...subjectIDs), meta: FROM_ATLAS_META });

export const setMapLayersFilterTextFromAtlas = (text) => ({ ...setMapLayersFilterText(text), meta: FROM_ATLAS_META });

export const setMapLayersGrouped = (grouped) => ({ payload: grouped, type: SET_GROUPED });

export const setMapLayersSortBy = (sortBy) => ({ payload: sortBy, type: SET_SORT_BY });

export const setMapLayersSortDirection = (sortDirection) => ({ payload: sortDirection, type: SET_SORT_DIRECTION });

// Reducer
export const INITIAL_FILTER_STATE = {
  grouped: true,
  hiddenAnalyzerIDs: [],
  hiddenFeatureIDs: [],
  hiddenSubjectIDs: [],
  isHiddenBeforeAtlasBySubjectID: {},
  showReportsOnMap: true,
  sortBy: MAP_LAYER_SORT_VALUES.LAST_UPDATE,
  sortDirection: SORT_DIRECTION.down,
  text: '',
  textBeforeAtlas: null,
};

const calcHiddenSubjectIDsBeforeAtlas = (state) => [
  ...state.hiddenSubjectIDs.filter((subjectID) => !Object.hasOwn(state.isHiddenBeforeAtlasBySubjectID, subjectID)),
  ...Object.keys(state.isHiddenBeforeAtlasBySubjectID)
    .filter((subjectID) => state.isHiddenBeforeAtlasBySubjectID[subjectID]),
];

const STORED_VALUE_BEFORE_ATLAS_MAP = {
  hiddenSubjectIDs: calcHiddenSubjectIDsBeforeAtlas,
  text: (state) => state.textBeforeAtlas ?? state.text,
};

// Atlas changes last only for the session, so the stored copy is written as
// if Atlas had never made them.
const withoutAtlasChangesTransform = createTransform(
  (inboundState, key, state) => STORED_VALUE_BEFORE_ATLAS_MAP[key](state),
  (outboundState) => outboundState,
  { whitelist: Object.keys(STORED_VALUE_BEFORE_ATLAS_MAP) }
);

const optionalStorageConfig = generateOptionalStorageConfig(MAP_LAYER_FILTER_STORAGE_KEY, INITIAL_FILTER_STATE);

export const mapLayerFilterPersistenceConfig = {
  ...optionalStorageConfig,
  blacklist: ['isHiddenBeforeAtlasBySubjectID', 'textBeforeAtlas'],
  transforms: [withoutAtlasChangesTransform, ...optionalStorageConfig.transforms],
};

// Only Atlas's first change to a subject is recorded; a user change drops it.
const updateIsHiddenBeforeAtlasBySubjectID = (state, action) => {
  if (!action.meta?.isFromAtlas) return omit(state.isHiddenBeforeAtlasBySubjectID, action.payload);

  const hiddenSubjectIDs = new Set(state.hiddenSubjectIDs);

  return {
    ...Object.fromEntries(action.payload.map((subjectID) => [subjectID, hiddenSubjectIDs.has(subjectID)])),
    ...state.isHiddenBeforeAtlasBySubjectID,
  };
};

const mapLayerFilterReducer = (state, action) => {
  switch (action.type) {
  case HIDE_SUBJECTS:
    return {
      ...state,
      hiddenSubjectIDs: uniq([...action.payload, ...state.hiddenSubjectIDs]),
      isHiddenBeforeAtlasBySubjectID: updateIsHiddenBeforeAtlasBySubjectID(state, action),
    };

  case SHOW_SUBJECTS:
    return {
      ...state,
      hiddenSubjectIDs: state.hiddenSubjectIDs.filter((item) => !action.payload.includes(item)),
      isHiddenBeforeAtlasBySubjectID: updateIsHiddenBeforeAtlasBySubjectID(state, action),
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
    return {
      ...state,
      text: action.payload,
      textBeforeAtlas: action.meta?.isFromAtlas ? state.textBeforeAtlas ?? state.text : null,
    };

  default:
    return state;
  }
};

export default globallyResettableReducer(mapLayerFilterReducer, INITIAL_FILTER_STATE);
