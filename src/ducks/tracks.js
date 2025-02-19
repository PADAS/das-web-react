import axios, { CancelToken, isCancel } from 'axios';
import isEqual from 'react-fast-compare';

import globallyResettableReducer from '../reducers/global-resettable';
import { API_URL } from '../constants';
import { SOCKET_SUBJECT_STATUS } from './subjects';
import {
  addSocketStatusUpdateToTrack,
  convertTrackFeatureCollectionToPoints,
  fixAntimeridianCrossing,
  trackHasDataWithinTimeRange,
} from '../utils/tracks';

export const TRACKS_API_URL = id => `${API_URL}subject/${id}/tracks/`;

// actions
export const FETCH_TRACKS_SUCCESS = 'FETCH_TRACKS_SUCCESS';
export const FETCH_TRACKS_ERROR = 'FETCH_TRACKS_ERROR';

// action creators
export const refreshTrackOnBulkObservationUpdateIfNecessary = (payload) => (dispatch, getState) => {
  const { subject_id, points } = payload;

  const { data: { tracks } } = getState();

  const subjectTrackData = tracks[subject_id];

  if (!subjectTrackData) return Promise.resolve();

  const [recentmostPoint] = points;
  const lastPoint = points[points.length - 1];

  const recentMostTime = new Date(recentmostPoint.time);
  const earliestTime = new Date(lastPoint.time);

  if (!trackHasDataWithinTimeRange(subjectTrackData, earliestTime, recentMostTime)) {
    return Promise.resolve();
  }

  return dispatch(fetchTracks({ since: subjectTrackData?.fetchedDateRange?.since }, undefined, subject_id));
};

export const fetchTracks = (dateParams, cancelToken = CancelToken.source(), ...ids) => {
  return async (dispatch) => {
    try {
      const responses = await Promise.all(ids.map(id => axios.get(TRACKS_API_URL(id), { params: dateParams, cancelToken: cancelToken.token })));

      const results = responses.reduce((accumulator, response, index) => {
        const trackFeatureCollection = fixAntimeridianCrossing(response.data.data);

        const asPoints = convertTrackFeatureCollectionToPoints(trackFeatureCollection);

        accumulator[ids[index]] = {
          track: trackFeatureCollection,
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


export const TRACK_LENGTH_ORIGINS = { EVENT_FILTER: 'EVENT_FILTER', CUSTOM_LENGTH: 'CUSTOM_LENGTH' };

// Actions
const SET_TRACK_SETTINGS_DEFAULT_CUSTOM_TRACK_LENGTH = 'SET_TRACK_SETTINGS_DEFAULT_CUSTOM_TRACK_LENGTH';
const SET_TRACK_SETTINGS_IS_TIME_OF_DAY_COLORING_ACTIVE = 'SET_TRACK_SETTINGS_IS_TIME_OF_DAY_COLORING_ACTIVE';
const SET_TRACK_SETTINGS_LENGTH = 'SET_TRACK_SETTINGS_LENGTH';
const SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN = 'SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN';

// Action creators
export const setDefaultCustomTrackLength = (defaultCustomTrackLength) => ({
  payload: defaultCustomTrackLength,
  type: SET_TRACK_SETTINGS_DEFAULT_CUSTOM_TRACK_LENGTH,
});

export const setIsTimeOfDayColoringActive = (isTimeOfDayColoringActive) => ({
  payload: isTimeOfDayColoringActive,
  type: SET_TRACK_SETTINGS_IS_TIME_OF_DAY_COLORING_ACTIVE,
});

export const setTrackLength = (length) => ({ payload: length, type: SET_TRACK_SETTINGS_LENGTH });

export const setTrackLengthOrigin = (origin) => ({
  payload: origin,
  type: SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN,
});

// Reducer
export const INITIAL_TRACK_SETTINGS_STATE = {
  defaultCustomTrackLength: undefined,
  isTimeOfDayColoringActive: false,
  length: 21,
  origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
};

export const trackSettingsReducer = globallyResettableReducer((state, action) => {
  switch (action.type) {
  case SET_TRACK_SETTINGS_DEFAULT_CUSTOM_TRACK_LENGTH:
    return { ...state, defaultCustomTrackLength: action.payload };

  case SET_TRACK_SETTINGS_IS_TIME_OF_DAY_COLORING_ACTIVE:
    return { ...state, isTimeOfDayColoringActive: action.payload };

  case SET_TRACK_SETTINGS_LENGTH:
    return { ...state, length: action.payload };

  case SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN:
    return { ...state, origin: action.payload };

  default:
    return state;
  }
}, INITIAL_TRACK_SETTINGS_STATE);
