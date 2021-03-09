import { SOCKET_SUBJECT_STATUS } from './subjects';
import { USER_LOCATION_RETRIEVED } from './location';
import { uuid } from '../utils/string';

const SHOW_POPUP = 'SHOW_POPUP';
const HIDE_POPUP = 'HIDE_POPUP';

export const showPopup = (type, data) => ({
  type: SHOW_POPUP,
  payload: {
    type,
    data,
  },
});

export const hidePopup = (id) => ({
  type: HIDE_POPUP,
  payload: id,
});

export default (state = null, action = {}) => {
  const { type, payload } = action;
  if (type === SHOW_POPUP) {
    const popup = { ...payload, id: uuid() };
    return popup;
  }
  if (type === HIDE_POPUP) {
    return null;
  }

  if (type === USER_LOCATION_RETRIEVED) {
    if (state && state.type === 'current-user-location') {
      return {
        ...state,
        data: {
          location: payload,
        },
      };
    }
  }

  if (type === SOCKET_SUBJECT_STATUS) {
    if (!state
      || state.type !== 'subject'
      || !state.data.properties
      || state.data.properties.id !== payload.properties.id) {
      return state;
    }
    const { geometry, properties } = payload;
    const returnVal = {
      ...state, data: {
        ...state.data,
        geometry: {
          ...state.data.geometry,
          ...geometry,
        },
        properties: {
          ...state.data.properties,
          ...properties,
        },
      }
    };
    if (payload.hasOwnProperty('device_status_properties')) {
      returnVal.data.properties.device_status_properties = JSON.stringify(payload.device_status_properties);
    }

    return returnVal;
  }
  return state;
};