import axios from 'axios';
import { API_URL } from '../constants';
import { getBboxParamsFromMap } from '../utils/query';
import { calcUrlForImage } from '../utils/img';

const SUBJECTS_API_URL = `${API_URL}subjects`;

// actions

export const FETCH_MAP_SUBJECTS = 'FETCH_MAP_SUBJECTS';
export const FETCH_MAP_SUBJECTS_SUCCESS = 'FETCH_MAP_SUBJECTS_SUCCESS';
export const FETCH_MAP_SUBJECTS_ERROR = 'FETCH_MAP_SUBJECTS_ERROR';
export const SOCKET_SUBJECT_STATUS = 'SOCKET_SUBJECT_STATUS';

// action creators

export const fetchMapSubjects = (map, { token }) => {
  return function (dispatch) {
    if (!map) return;

    const bbox = getBboxParamsFromMap(map);

    axios.get(SUBJECTS_API_URL, {
      cancelToken: token,
      params: {
        bbox,
      }
    })
      .then(response => dispatch(fetchMapSubjectsSuccess(response)))
      .catch(error => dispatch(fetchMapSubjectsError(error)));
  };
};

const fetchMapSubjectsSuccess = response => ({
  type: FETCH_MAP_SUBJECTS_SUCCESS,
  payload: response.data,
});

const fetchMapSubjectsError = error => ({
  type: FETCH_MAP_SUBJECTS_ERROR,
  payload: error,
});

const INITIAL_MAP_SUBJECT_STATE = [];

export default function mapSubjectReducer(state = INITIAL_MAP_SUBJECT_STATE, action = {}) {
  switch (action.type) {
    case FETCH_MAP_SUBJECTS_SUCCESS: {
      const { payload: { data: subjects } } = action;
      return subjects.map((subject) => {
        subject.last_position.properties.name = subject.last_position.properties.name || subject.last_position.properties.title;
        return subject;
      });
    }
    case SOCKET_SUBJECT_STATUS: {
      const { payload } = action;
      payload.properties.image = calcUrlForImage(payload.properties.image);
      return state.map((subject) => {
        if (subject.id === payload.properties.id) {
          subject.last_position = Object.assign(subject.last_position, payload);
        }
        return subject;
      });
    }
    default: {
      return state;
    }
  }
};