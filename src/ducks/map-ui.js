import uniq from 'lodash/uniq';

// actions
const UPDATE_HEATMAP_CONFIG = 'UPDATE_HEATMAP_CONFIG';

const HIDE_SUBJECTS = 'HIDE_SUBJECTS';
const SHOW_SUBJECTS = 'SHOW_SUBJECTS';

const UPDATE_HEATMAP_SUBJECT_STATE = 'UPDATE_HEATMAP_SUBJECT_STATE';
const ADD_HEATMAP_SUBJECTS = 'UPDATE_HEATMAP_SUBJECT_STATE';
const REMOVE_HEATMAP_SUBJECTS = 'UPDATE_HEATMAP_SUBJECT_STATE';

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



export const addHeatmapSubjects = (...subjectIDs) => (dispatch, getState) => {
  const { view: { heatmapSubjectIDs } } = getState();
  return dispatch(updateHeatmapSubjects(uniq([...subjectIDs, ...heatmapSubjectIDs])));
};

export const removeHeatmapSubjects = (...subjectIDs) => (dispatch, getState) => {
  const { view: { heatmapSubjectIDs } } = getState();
  return dispatch(updateHeatmapSubjects(heatmapSubjectIDs.filter(id => !subjectIDs.includes(id))));
};

export const updateHeatmapSubjects = (update) => ({
  type: UPDATE_HEATMAP_SUBJECT_STATE,
  payload: update,
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