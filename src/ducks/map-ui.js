import uniq from 'lodash/uniq';

// actions
const UPDATE_HEATMAP_CONFIG = 'UPDATE_HEATMAP_CONFIG';

const HIDE_SUBJECTS = 'HIDE_SUBJECTS';
const SHOW_SUBJECTS = 'SHOW_SUBJECTS';

const UPDATE_HEATMAP_SUBJECT_STATE = 'UPDATE_HEATMAP_SUBJECT_STATE';

const UPDATE_SUBJECT_TRACK_STATE = 'UPDATE_SUBJECT_TRACK_STATE';

// action creators
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


export const updateHeatmapSubjects = (update) => ({
  type: UPDATE_HEATMAP_SUBJECT_STATE,
  payload: update,
 });

 export const updateTrackState = (update) => ({
   type: UPDATE_SUBJECT_TRACK_STATE,
   payload: update,
 });

 // reducers
export const heatmapStyleConfigReducer = (state = {}, action) => {
  const { type, payload } = action;
  if (type === UPDATE_HEATMAP_CONFIG) return { ...state, ...payload };
  return state;
};

export const heatmapSubjectIDsReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === UPDATE_HEATMAP_SUBJECT_STATE) return payload;
  return state;
}

export const hiddenSubjectIDsReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === HIDE_SUBJECTS) return uniq([...payload, ...state]);
  if (type === SHOW_SUBJECTS) return state.filter(item => !payload.includes(item));
  return state;
};

const INITIAL_TRACK_STATE = {
  visible: [],
  pinned: [],
};

export const subjectTrackReducer = (state = INITIAL_TRACK_STATE, action) => {
  const { type, payload } = action;
  if (type === UPDATE_SUBJECT_TRACK_STATE) return { ...state, ...payload };
  return state;
};