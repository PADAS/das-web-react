import axios, { CancelToken, isCancel } from 'axios';
import isEqual from 'react-fast-compare';

import globallyResettableReducer from '../reducers/global-resettable';
import { API_URL, DEFAULT_TRACK_LENGTH } from '../constants';
import { SOCKET_SUBJECT_STATUS } from './subjects';
import { addSocketStatusUpdateToTrack, convertTrackFeatureCollectionToPoints } from '../utils/tracks';

const TRACKS_API_URL = id => `${API_URL}subject/${id}/tracks/`;

// actions
export const FETCH_TRACKS_SUCCESS = 'FETCH_TRACKS_SUCCESS';
export const FETCH_TRACKS_ERROR = 'FETCH_TRACKS_ERROR';

const SET_TRACK_LENGTH = 'SET_TRACK_LENGTH';
const SET_TRACK_LENGTH_ORIGIN = 'SET_TRACK_LENGTH_ORIGIN';

// action creators
export const fetchTracks = (dateParams, cancelToken = CancelToken.source(), ...ids) => {
  return async (dispatch) => {
    try {
      const responses = await Promise.all(ids.map(id => axios.get(TRACKS_API_URL(id), { params: dateParams, cancelToken: cancelToken.token })));

      const results = responses.reduce((accumulator, response, index) => {
        const asPoints = convertTrackFeatureCollectionToPoints(response.data.data);

        accumulator[ids[index]] = {
          track: response.data.data,
          points: asPoints,
          fetchedDateRange: dateParams,
        };

        return accumulator;
      }, {});

      dispatch(fetchTracksSuccess(results));
    } catch (error) {
      if (!isCancel(error)) {
        console.warn('error fetching tracks', error);
        dispatch(fetchTracksError(error));
      }
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

export const setTrackLength = (range) => ({
  type: SET_TRACK_LENGTH,
  payload: range,
});

export const setTrackLengthRangeOrigin = (origin) => ({
  type: SET_TRACK_LENGTH_ORIGIN,
  payload: origin,
});

// reducers
const INITIAL_TRACKS_STATE = {};
const tracksReducer = (state = INITIAL_TRACKS_STATE, action = {}) => {
  switch (action.type) {
  case SOCKET_SUBJECT_STATUS: {
    const { payload } = action;
    const { properties: { id } } = payload;
    const tracks = state[id];
    if (!tracks) return state;

    const [trackFeature] = tracks.track.features;

    if (!trackFeature.geometry) return state;

    if (isEqual(trackFeature.geometry.coordinates[0], payload.geometry.coordinates)
     || isEqual(trackFeature.properties.coordinateProperties.times[0], payload.properties.coordinateProperties.time)) {
      return state;
    }

    return {
      ...state,
      [id]: addSocketStatusUpdateToTrack(tracks, payload),
    };

  }
  case FETCH_TRACKS_SUCCESS: {
    return {
      ...state,
      ...action.payload,
    };
  }
  default: {
    return state;
  }
  }
};

export default globallyResettableReducer(tracksReducer, INITIAL_TRACKS_STATE);


export const TRACK_LENGTH_ORIGINS = {
  eventFilter: 'eventFilter',
  customLength: 'customLength',
};

const INITIAL_TRACK_DATE_RANGE_STATE = {
  origin: TRACK_LENGTH_ORIGINS.customLength,
  length: DEFAULT_TRACK_LENGTH //set by systemConfig.trackLength when used
};

export const trackDateRangeReducer = globallyResettableReducer((state, { type, payload }) => {
  if (type === SET_TRACK_LENGTH_ORIGIN) {
    return {
      ...state,
      origin: payload,
    };
  }
  if (type === SET_TRACK_LENGTH) {
    return {
      ...state, length: payload,
    };
  }

  return state;
}, INITIAL_TRACK_DATE_RANGE_STATE);
