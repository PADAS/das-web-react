import axios, { CancelToken } from 'axios';
import union from 'lodash/union';
import merge from 'lodash/merge';

import { API_URL } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';
import { getBboxParamsFromMap } from '../utils/query';
import { calcUrlForImage } from '../utils/img';
import { getUniqueSubjectGroupSubjects, updateSubjectLastPositionFromSocketStatusUpdate, updateSubjectsInSubjectGroupsFromSocketStatusUpdate } from '../utils/subjects';

const SUBJECTS_API_URL = `${API_URL}subjects`;
const SUBJECT_GROUPS_API_URL = `${API_URL}subjectgroups`;

// actions

const FETCH_SUBJECT_GROUPS_SUCCESS = 'FETCH_SUBJECT_GROUPS_SUCCESS';
// const FETCH_SUBJECT_GROUPS_ERROR = 'FETCH_SUBJECT_GROUPS_ERROR';

const FETCH_MAP_SUBJECTS_START = 'FETCH_MAP_SUBJECTS_START';
const FETCH_MAP_SUBJECTS_SUCCESS = 'FETCH_MAP_SUBJECTS_SUCCESS';
// const FETCH_MAP_SUBJECTS_ERROR = 'FETCH_MAP_SUBJECTS_ERROR';
const CLEAR_SUBJECT_DATA = 'CLEAR_SUBJECT_DATA';
export const SOCKET_SUBJECT_STATUS = 'SOCKET_SUBJECT_STATUS';

// action creators

const cancelableMapSubjectsFetch = () => {
  let cancelToken = CancelToken.source();
  const fetchFn = (map, params) => (dispatch, getState) => {
    let lastKnownBbox;

    if (!map) {
      lastKnownBbox = getState().data.mapSubjects.bbox;
    }

    if (!map && !lastKnownBbox) return Promise.reject();
  
    const bbox = map ? getBboxParamsFromMap(map) : lastKnownBbox;

    dispatch({
      type: FETCH_MAP_SUBJECTS_START,
      payload: { bbox },
    });

    cancelToken.cancel();
    cancelToken = CancelToken.source();
  
    return axios.get(SUBJECTS_API_URL, {
      cancelToken: cancelToken.token,
      params: {
        bbox,
        ...params,
      }
    })
      .then((response) => {
        if (response) {
          dispatch(fetchMapSubjectsSuccess(response));
          return response.data.data;
        }
        return [];
      });
    /* .catch(error => {
        dispatch(fetchMapSubjectsError(error));
        return Promise.reject(error);
      }); */
  };
  return [fetchFn, cancelToken];
};

export const [fetchMapSubjects, mapSubjectsFetchCancelToken] = cancelableMapSubjectsFetch();

export const clearSubjectData = () => ({
  type: CLEAR_SUBJECT_DATA,
});

export const fetchSubjectGroups = () => dispatch => axios.get(SUBJECT_GROUPS_API_URL)
  .then(response => dispatch(fetchSubjectGroupsSuccess(response)));

const fetchMapSubjectsSuccess = response => ({
  type: FETCH_MAP_SUBJECTS_SUCCESS,
  payload: response.data,
});
/* 
const fetchMapSubjectsError = error => ({
  type: FETCH_MAP_SUBJECTS_ERROR,
  payload: error,
});
 */
const fetchSubjectGroupsSuccess = response => ({
  type: FETCH_SUBJECT_GROUPS_SUCCESS,
  payload: response.data.data,
});

const INITIAL_MAP_SUBJECT_STATE = {
  bbox: null,
  subjects: [],
};



export default globallyResettableReducer((state, action = {}) => {
  switch (action.type) {
  case CLEAR_SUBJECT_DATA: {
    return { ...INITIAL_MAP_SUBJECT_STATE };
  }
  case FETCH_MAP_SUBJECTS_START: {
    const { bbox } = action.payload;
    return {
      ...state,
      bbox,
    };
  }
  case FETCH_MAP_SUBJECTS_SUCCESS: {
    const { payload: { data: subjects } } = action;

    const mapSubjectIDs = subjects.map(({ id }) => id);

    return {
      ...state,
      subjects: union(mapSubjectIDs, state.subjects),
    };
  }
  case SOCKET_SUBJECT_STATUS: {
    const { payload } = action;
    console.log('realtime: subject update', payload);
    payload.properties.image = calcUrlForImage(payload.properties.image);
    return {
      ...state,
      subjects: state.subjects.map((subject) => {
        if (subject.id === payload.properties.id) {
          return updateSubjectLastPositionFromSocketStatusUpdate(subject, payload);
        }
        return subject;
      }),
    };
  }
  default: {
    return state;
  }
  }
}, INITIAL_MAP_SUBJECT_STATE);

export const subjectGroupsReducer = globallyResettableReducer((state, action = {}) => {
  const { type, payload } = action;
  if (type === CLEAR_SUBJECT_DATA) {
    return [];
  }
  if (type === FETCH_SUBJECT_GROUPS_SUCCESS) {
    const replaceGroupSubjectsWithSubjectIDs = (...groups) => groups.map((group) => {
      const { subgroups, subjects } = group;
      return {
        ...group,
        subgroups: replaceGroupSubjectsWithSubjectIDs(...subgroups),
        subjects: subjects.map(({ id }) =>  id),
      };

    });

    return replaceGroupSubjectsWithSubjectIDs(...payload);
  }
  return state;
}, []);

const SUBJECT_STORE_INITIAL_STATE = {};

export const subjectStoreReducer = globallyResettableReducer((state = SUBJECT_STORE_INITIAL_STATE, action = {}) => {
  const { type, payload } = action;

  if (type === CLEAR_SUBJECT_DATA) {
    return SUBJECT_STORE_INITIAL_STATE;
  }

  if (type === FETCH_MAP_SUBJECTS_SUCCESS) {
    const { payload: { data: subjects } } = action;

    const newSubjects = subjects.map((subject) => {
      subject.last_position.properties.name = subject.last_position.properties.title || subject.last_position.properties.name;
      return subject;
    });

    const asObject = newSubjects.reduce((accumulator, item) => ({ ...accumulator, [item.id]: item }) , {});

    return merge({}, state, asObject);
  }

  if (type === FETCH_SUBJECT_GROUPS_SUCCESS) {
    const subjectGroupSubjects = getUniqueSubjectGroupSubjects(...payload);
    const asObject = subjectGroupSubjects.reduce((accumulator, item) => ({ ...accumulator, [item.id]: item }) , {});

    return merge({}, state, asObject);
  }

  if (type === SOCKET_SUBJECT_STATUS) {
    const { properties: { id } } = payload;

    if (!state[id]) return state;

    const updatedSubject = updateSubjectLastPositionFromSocketStatusUpdate(state[id], payload);

    return {
      ...state,
      [id]: updatedSubject,
    };
  }

  return state;
}, SUBJECT_STORE_INITIAL_STATE);
