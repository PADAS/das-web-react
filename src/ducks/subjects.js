import axios from 'axios';
import unionBy from 'lodash/unionBy';

import { API_URL } from '../constants';
import { getBboxParamsFromMap } from '../utils/query';
import { calcUrlForImage } from '../utils/img';

const SUBJECTS_API_URL = `${API_URL}subjects`;
const SUBJECT_GROUPS_API_URL = `${API_URL}subjectgroups`;

// actions

const FETCH_SUBJECT_GROUPS_SUCCESS = 'FETCH_SUBJECT_GROUPS_SUCCESS';
const FETCH_SUBJECT_GROUPS_ERROR = 'FETCH_SUBJECT_GROUPS_ERROR';

const FETCH_MAP_SUBJECTS_SUCCESS = 'FETCH_MAP_SUBJECTS_SUCCESS';
const FETCH_MAP_SUBJECTS_ERROR = 'FETCH_MAP_SUBJECTS_ERROR';
export const SOCKET_SUBJECT_STATUS = 'SOCKET_SUBJECT_STATUS';

// action creators

export const fetchMapSubjects = (map, { token }) => {
  return function (dispatch) {
    if (!map) return;

    const bbox = getBboxParamsFromMap(map);

    return axios.get(SUBJECTS_API_URL, {
      cancelToken: token,
      params: {
        bbox,
      }
    })
      .then(response => dispatch(fetchMapSubjectsSuccess(response)))
      .catch(error => dispatch(fetchMapSubjectsError(error)));
  };
};

export const fetchSubjectGroups = () => (dispatch) =>
  axios.get(SUBJECT_GROUPS_API_URL)
    .then(response => dispatch(fetchSubjectGroupsSuccess(response)));

const fetchMapSubjectsSuccess = response => ({
  type: FETCH_MAP_SUBJECTS_SUCCESS,
  payload: response.data,
});

const fetchMapSubjectsError = error => ({
  type: FETCH_MAP_SUBJECTS_ERROR,
  payload: error,
});

const fetchSubjectGroupsSuccess = response => ({
  type: FETCH_SUBJECT_GROUPS_SUCCESS,
  payload: response.data.data,
});

const INITIAL_MAP_SUBJECT_STATE = [];

export default function mapSubjectReducer(state = INITIAL_MAP_SUBJECT_STATE, action = {}) {
  switch (action.type) {
    case FETCH_MAP_SUBJECTS_SUCCESS: {
      const { payload: { data: subjects } } = action;
      const newSubjects = subjects.map((subject) => {
        subject.last_position.properties.name = subject.last_position.properties.title || subject.last_position.properties.name;
        return subject;
      });
      return unionBy(newSubjects, state, 'id');
    }
    case SOCKET_SUBJECT_STATUS: {
      const { payload } = action;
      console.log('realtime: subject update', payload);
      payload.properties.image = calcUrlForImage(payload.properties.image);
      return state.map((subject) => {
        if (subject.id === payload.properties.id) {
          return {
            ...subject,
            last_position: {
              ...subject.last_position, ...payload, properties: {
                ...subject.last_position.properties,
                ...payload.properties,
                radio_state: payload.properties.state || subject.last_position.radio_state, // API incongruency band-aid :(
              }
            },
          };
        }
        return subject;
      });
    }
    default: {
      return state;
    }
  }
};

export const subjectGroupsReducer = (state = [], action = {}) => {
  const { type, payload } = action;
  if (type === FETCH_SUBJECT_GROUPS_SUCCESS) {
    return payload;
  }
  return state;
};