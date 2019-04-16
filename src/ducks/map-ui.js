const UPDATE_HEATMAP_CONFIG = 'UPDATE_HEATMAP_CONFIG';
const HIDE_SUBJECTS = 'HIDE_SUBJECTS';
const SHOW_SUBJECTS = 'SHOW_SUBJECTS';

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


export const heatmapReducer = (state = {}, action) => {
  const { type, payload } = action;
  if (type === UPDATE_HEATMAP_CONFIG) return { ...state, ...payload };
  return state;
};



export const hiddenSubjectIDsReducer = (state = [], action) => {
  const { type, payload } = action;
  if (type === SHOW_SUBJECTS) return state.filter(item => !payload.includes(item));
  if (type === HIDE_SUBJECTS) return [...payload, ...state];

  return state;
};
