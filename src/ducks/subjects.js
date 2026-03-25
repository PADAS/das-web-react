import axios, { CancelToken } from 'axios';
import union from 'lodash/union';
import merge from 'lodash/merge';

import { API_URL } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';
import { getBboxParamsFromMap } from '../utils/query';
import { calcUrlForImage } from '../utils/img';
import { getUniqueSubjectGroupSubjects, updateDeviceStatusProperties, updateSubjectLastPositionFromSocketStatusUpdate } from '../utils/subjects';
import { pinSubjectTracks } from './map-ui';

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

            // Auto-pin tracks for ropeless_buoy_gearset subjects (buoy site feature)
            // Only when zoomed in (z > 10) to avoid unnecessary track loading when zoomed out
            const currentZoom = map?.getZoom();
            if (currentZoom && currentZoom > 8) {
              const subjects = response.data.data || [];
              const buoyGearsetSubjects = subjects.filter(
                subject => subject.subject_subtype === 'ropeless_buoy_gearset'
              );

              if (buoyGearsetSubjects.length > 0) {
                const buoyGearsetIDs = buoyGearsetSubjects.map(s => s.id);
                dispatch(pinSubjectTracks(...buoyGearsetIDs));
              }
            }

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

  return lastKnownMapSubjectValue;
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
        subjects: subjects.map(({ id }) => id),
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
