import axios from 'axios';
import { API_URL } from '../constants';
import { SOCKET_SUBJECT_STATUS } from '../ducks/subjects';

const TRACKS_API_URL = id => `${API_URL}subject/${id}/tracks/`;

// actions
export const FETCH_TRACKS = 'FETCH_TRACKS';
export const FETCH_TRACKS_SUCCESS = 'FETCH_TRACKS_SUCCESS';
export const FETCH_TRACKS_ERROR = 'FETCH_TRACKS_ERROR';

// action creators
export const fetchTracks = (id, config = {}) => {
  return function (dispatch) {
    return axios.get(TRACKS_API_URL(id), config)
      .then(response => dispatch(fetchTracksSuccess(id, response)))
      .catch(error => dispatch(fetchTracksError(error)));
  };
};

const fetchTracksSuccess = (id, response) => ({
  type: FETCH_TRACKS_SUCCESS,
  payload: { id, tracks: response.data.data },
});

const fetchTracksError = error => ({
  type: FETCH_TRACKS_ERROR,
  payload: error,
});

const INITIAL_TRACKS_STATE = {};
// reducers
export default function tracksReducer(state = INITIAL_TRACKS_STATE, action = {}) {
  switch (action.type) {
    case SOCKET_SUBJECT_STATUS: {
      const { payload } = action;
      const { properties: { id } } = payload;
      const tracks = state[id];
      if (!tracks) return state;
      return {
        ...state,
        [id]: {
          ...tracks,
          properties: {
            ...tracks.properties,
            coordinateProperties: {
              ...tracks.properties.coordinateProperties,
              times: [payload.properties.coordinateProperties.time, ...tracks.properties.coordinateProperties.times],
            },
          },
          geometry: {
            ...tracks.geometry,
            coordinates: [
              payload.geometry.coordinates,
              ...tracks.geometry.coordinates,
            ],
          }
        }
      };

    }
    case FETCH_TRACKS_SUCCESS: {
      const { payload: { id, tracks } } = action;
      return { ...state, [id]: tracks };
    }

    default: {
      return state;
    }
  }
};