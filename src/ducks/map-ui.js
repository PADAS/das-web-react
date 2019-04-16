import uniq from 'lodash/uniq';

const UPDATE_HEATMAP_CONFIG = 'UPDATE_HEATMAP_CONFIG';

const HIDE_SUBJECTS = 'HIDE_SUBJECTS';
const SHOW_SUBJECTS = 'SHOW_SUBJECTS';

const ADD_SUBJECTS_TO_HEATMAP = 'ADD_SUBJECTS_TO_HEATMAP';
const REMOVE_SUBJECTS_FROM_HEATMAP = 'REMOVE_SUBJECTS_FROM_HEATMAP';

export const updateHeatmapConfig = (config) => ({
  type: UPDATE_HEATMAP_CONFIG,
  payload: config,
});

export const hideSubjects = (subjectIDs) => ({
  type: HIDE_SUBJECTS,
  payload: subjectIDs,
});

export const showSubjects = (subjectIDs) => ({
  type: SHOW_SUBJECTS,
  payload: subjectIDs,
});


export const addSubjectsToHeatmap = (subjectIDs) => ({
 type: ADD_SUBJECTS_TO_HEATMAP,
 payload: subjectIDs,
});

export const removeSubjectsFromHeatmap = (subjectIDs) => ({
  type: REMOVE_SUBJECTS_FROM_HEATMAP,
  payload: subjectIDs,
 });

export const heatmapStyleConfigReducer = (state = {}, action) => {
  const { type, payload } = action;
  if (type === UPDATE_HEATMAP_CONFIG) return { ...state, ...payload };
  return state;
};

export const heatmapSubjectIDsReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === ADD_SUBJECTS_TO_HEATMAP) return uniq([...payload, ...state]);
  if (type === REMOVE_SUBJECTS_FROM_HEATMAP) return state.filter(item => !payload.includes(item));
  return state;
}

export const hiddenSubjectIDsReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === SHOW_SUBJECTS) return uniq([...payload, ...state]);
  if (type === HIDE_SUBJECTS) return state.filter(item => !payload.includes(item));
  return state;
};
