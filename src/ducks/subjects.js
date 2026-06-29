import axios, { CancelToken } from 'axios';
import union from 'lodash/union';
import merge from 'lodash/merge';

import { API_URL } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';
import { getBboxParamsFromMap } from '../utils/query';
import { calcUrlForImage } from '../utils/img';
import { getUniqueSubjectGroupSubjects, updateDeviceStatusProperties, updateSubjectLastPositionFromSocketStatusUpdate } from '../utils/subjects';
const SUBJECTS_API_URL = `${API_URL}subjects`;
export const SUBJECT_GROUPS_API_URL = `${API_URL}subjectgroups`;

// actions

const FETCH_SUBJECT_GROUPS_SUCCESS = 'FETCH_SUBJECT_GROUPS_SUCCESS';
// const FETCH_SUBJECT_GROUPS_ERROR = 'FETCH_SUBJECT_GROUPS_ERROR';

const FETCH_MAP_SUBJECTS_START = 'FETCH_MAP_SUBJECTS_START';
const FETCH_MAP_SUBJECTS_SUCCESS = 'FETCH_MAP_SUBJECTS_SUCCESS';
// const FETCH_MAP_SUBJECTS_ERROR = 'FETCH_MAP_SUBJECTS_ERROR';
const CLEAR_SUBJECT_DATA = 'CLEAR_SUBJECT_DATA';
export const SOCKET_SUBJECT_STATUS = 'SOCKET_SUBJECT_STATUS';
export const SOCKET_NEW_SUBJECT = 'SOCKET_NEW_SUBJECT';
export const SOCKET_DELETE_SUBJECT = 'SOCKET_DELETE_SUBJECT';

// action creators

const cancelableMapSubjectsFetch = () => {
  let cancelToken = CancelToken.source();
  const fetchFn = (map, params) => async (dispatch, getState) => {
    try {

      const state = getState();
      let lastKnownBbox;

      if (!map) {
        lastKnownBbox = state?.data?.mapSubjects?.bbox;
      }

      if (!map && !lastKnownBbox) return Promise.reject();

      const timeSliderActive = state?.view?.timeSliderState?.active;

      const bbox = map ? await getBboxParamsFromMap(map) : lastKnownBbox;
      const use_lkl = !timeSliderActive;

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
          use_lkl,
          ...params,
          include_inactive: false,
        }
      })
        .then((response) => {
          if (response) {
            dispatch(fetchMapSubjectsSuccess(response));
            return response.data.data;
          }
          return [];
        });
    } catch (e) {
      return Promise.reject(e);
    }
  };
  return [fetchFn, cancelToken];
};

export const [fetchMapSubjects, mapSubjectsFetchCancelToken] = cancelableMapSubjectsFetch();

export const clearSubjectData = () => ({
  type: CLEAR_SUBJECT_DATA,
});

export const socketNewSubject = (payload) => ({
  type: SOCKET_NEW_SUBJECT,
  payload,
});

export const socketDeleteSubject = (payload) => ({
  type: SOCKET_DELETE_SUBJECT,
  payload,
});

export const fetchSubjectGroups = () => (dispatch) => axios.get(SUBJECT_GROUPS_API_URL)
  .then(response => {
    dispatch(fetchSubjectGroupsSuccess(response));
    return response;
  })
  .catch(_error => dispatch(fetchSubjectGroupsError())); // Fallback to empty array on error

const fetchMapSubjectsSuccess = response => ({
  type: FETCH_MAP_SUBJECTS_SUCCESS,
  payload: response.data,
});

const fetchSubjectGroupsSuccess = response => ({
  type: FETCH_SUBJECT_GROUPS_SUCCESS,
  payload: response?.data?.data ?? [],
});

const fetchSubjectGroupsError = _error => fetchSubjectGroupsSuccess([]);

const INITIAL_MAP_SUBJECT_STATE = {
  bbox: null,
  subjects: [],
};



let lastKnownMapSubjectValue = { ...INITIAL_MAP_SUBJECT_STATE }; /* PATCH -- store updates via FETCH_MAP_SUBJECTS_SUCCESS are not sticking when the number of map subjects in a query is > 2...race condition? redux funk? who knows. this fixes it for the time being. */

export default globallyResettableReducer((state = INITIAL_MAP_SUBJECT_STATE, action = {}) => {
  if (action.type === CLEAR_SUBJECT_DATA) {
    lastKnownMapSubjectValue = { ...INITIAL_MAP_SUBJECT_STATE };
  }

  if (action.type === FETCH_MAP_SUBJECTS_START) {
    const { bbox } = action.payload;
    lastKnownMapSubjectValue = {
      ...state,
      bbox,
    };
  }

  if (action.type === FETCH_MAP_SUBJECTS_SUCCESS) {
    const { payload: { data: subjects } } = action;

    const mapSubjectIDs = subjects.map(({ id }) => id);

    lastKnownMapSubjectValue = {
      ...state,
      subjects: union(mapSubjectIDs, state.subjects),
    };
  }

  if (action.type === SOCKET_NEW_SUBJECT) {
    const { subject_id } = action.payload;
    lastKnownMapSubjectValue = {
      ...state,
      subjects: union([subject_id], state.subjects),
    };
  }

  if (action.type === SOCKET_DELETE_SUBJECT) {
    const { subject_id } = action.payload;
    lastKnownMapSubjectValue = {
      ...state,
      subjects: state.subjects.filter((id) => id !== subject_id),
    };
  }

  return lastKnownMapSubjectValue;
}, INITIAL_MAP_SUBJECT_STATE);

// Recursively removes a subject ID from every node in the groups tree.
// Returns the original array/group reference when nothing changed, to preserve
// referential equality for memoized selectors (e.g. reselect).
const removeSubjectIdFromGroups = (groups, subjectId) => {
  let changed = false;
  const next = groups.map((group) => {
    const nextSubgroups = removeSubjectIdFromGroups(group.subgroups, subjectId);
    const nextSubjects = group.subjects.filter((id) => id !== subjectId);
    if (nextSubgroups === group.subgroups && nextSubjects.length === group.subjects.length) {
      return group;
    }
    changed = true;
    return { ...group, subgroups: nextSubgroups, subjects: nextSubjects };
  });
  return changed ? next : groups;
};

// Recursively appends subjectId to the subjects array of any group node whose
// id is in targetGroupIds. Idempotent: skips if already present. Group ids not
// found in the tree are silently ignored.
const addSubjectIdToGroups = (groups, subjectId, targetGroupIds) => groups.map((group) => {
  const updatedSubgroups = addSubjectIdToGroups(group.subgroups, subjectId, targetGroupIds);
  if (!targetGroupIds.includes(group.id)) {
    return { ...group, subgroups: updatedSubgroups };
  }
  const subjects = group.subjects.includes(subjectId)
    ? group.subjects
    : [...group.subjects, subjectId];
  return { ...group, subgroups: updatedSubgroups, subjects };
});

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
        subjects: subjects.map(({ id }) => id),
      };

    });

    return replaceGroupSubjectsWithSubjectIDs(...payload);
  }
  if (type === SOCKET_NEW_SUBJECT) {
    const { subject_id, subject_group_ids } = payload;
    if (!subject_group_ids || subject_group_ids.length === 0) {
      return state;
    }
    return addSubjectIdToGroups(state, subject_id, subject_group_ids);
  }
  if (type === SOCKET_DELETE_SUBJECT) {
    const { subject_id } = payload;
    return removeSubjectIdFromGroups(state, subject_id);
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
      if (!subject.last_position) return subject;

      subject.last_position.properties.name = subject.last_position.properties.title || subject.last_position.properties.name;
      return subject;
    });

    const asObject = newSubjects.reduce((accumulator, item) => ({ ...accumulator, [item.id]: item }), {});

    return merge({}, state, asObject);
  }

  if (type === FETCH_SUBJECT_GROUPS_SUCCESS) {
    const subjectGroupSubjects = getUniqueSubjectGroupSubjects(...payload);
    const asObject = subjectGroupSubjects.reduce((accumulator, item) => ({ ...accumulator, [item.id]: item }), {});

    return merge({}, state, asObject);
  }

  if (type === SOCKET_NEW_SUBJECT) {
    const { subject_id, subject_data } = payload;
    let normalized = subject_data;
    if (subject_data.last_position) {
      normalized = {
        ...subject_data,
        last_position: {
          ...subject_data.last_position,
          properties: {
            ...subject_data.last_position.properties,
            name: subject_data.last_position.properties.title || subject_data.last_position.properties.name,
          },
        },
      };
    }
    return {
      ...state,
      [subject_id]: normalized,
    };
  }

  if (type === SOCKET_DELETE_SUBJECT) {
    const { subject_id } = payload;
    const { [subject_id]: _removed, ...rest } = state;
    return rest;
  }

  if (type === SOCKET_SUBJECT_STATUS) {
    const { properties: { id } } = payload;

    const subjectFromState = state[id];

    if (!subjectFromState) return state;

    console.log('realtime: subject update', payload);

    const cloned = { ...payload };

    if (subjectFromState.device_status_properties
      && payload.device_status_properties
    ) {
      cloned.device_status_properties = updateDeviceStatusProperties(
        subjectFromState.device_status_properties,
        cloned.device_status_properties,
      );
    }

    cloned.properties.image = calcUrlForImage(cloned.properties.image);

    const updatedSubject = updateSubjectLastPositionFromSocketStatusUpdate(state[id], cloned);

    return {
      ...state,
      [id]: updatedSubject,
    };
  }

  return state;
}, SUBJECT_STORE_INITIAL_STATE);
