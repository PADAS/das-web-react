import axios from 'axios';
import isEqual from 'react-fast-compare';

import { API_URL } from '../constants';
import { SOCKET_SUBJECT_STATUS } from '../ducks/subjects';

const TRACKS_API_URL = id => `${API_URL}subject/${id}/tracks/`;

// actions
export const FETCH_TRACKS = 'FETCH_TRACKS';
export const FETCH_TRACKS_SUCCESS = 'FETCH_TRACKS_SUCCESS';
export const FETCH_TRACKS_ERROR = 'FETCH_TRACKS_ERROR';

const SET_TRACK_DATE_RANGE = 'SET_TRACK_DATE_RANGE';

// action creators
export const fetchTracks = (...ids) => {
  return async (dispatch) => {
    try {
      const responses = await Promise.all(ids.map(id => axios.get(TRACKS_API_URL(id))));

      const results = responses.reduce((accumulator, response, index) => {
        accumulator[ids[index]] = response.data.data;
        return accumulator;
      }, {});

      dispatch(fetchTracksSuccess(results));
    } catch (error) {
      dispatch(fetchTracksError(error));
    }
  };
};

const fetchTracksSuccess = results => ({
  type: FETCH_TRACKS_SUCCESS,
  payload: results,
});

const fetchTracksError = error => ({
  type: FETCH_TRACKS_ERROR,
  payload: error,
});

export const setTrackDateRange = (range) => ({
  type: SET_TRACK_DATE_RANGE,
  payload: range,
});

// reducers
const INITIAL_TRACKS_STATE = {};
export default function tracksReducer(state = INITIAL_TRACKS_STATE, action = {}) {
  switch (action.type) {
  case SOCKET_SUBJECT_STATUS: {
    const { payload } = action;
    const { properties: { id } } = payload;
    const tracks = state[id];
    if (!tracks) return state;

    const [trackFeature] = tracks.features;

    if (isEqual(trackFeature.geometry.coordinates[0], payload.geometry.coordinates)) {
      return state;
    }

    if (isEqual(trackFeature.properties.coordinateProperties.times[0], payload.properties.coordinateProperties.time)) {
      return state;
    }
      
    return {
      ...state,
      [id]: {
        ...tracks,
        features: [
          {
            ...trackFeature,
            properties: {
              ...trackFeature.properties,
              coordinateProperties: {
                ...trackFeature.coordinateProperties,
                times: [payload.properties.coordinateProperties.time, ...trackFeature.properties.coordinateProperties.times],
              },
            },
            geometry: {
              ...trackFeature.geometry,
              coordinates: [
                payload.geometry.coordinates,
                ...trackFeature.geometry.coordinates,
              ],
            }
          }
        ]
          
      }
    };

  }
  case FETCH_TRACKS_SUCCESS: {
    return { ...state, ...action.payload };
  }

  default: {
    return state;
  }
  }
};

const INITIAL_TRACK_DATE_RANGE_STATE = {};
export const trackDateRangeReducer = (state = INITIAL_TRACK_DATE_RANGE_STATE, { type, payload }) => {
  if (type === SET_TRACK_DATE_RANGE) {
    return {
      ...state, ...payload,
    };
  }
  return state;
};