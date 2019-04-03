import { SOCKET_SUBJECT_STATUS } from './subjects';
import { uuid } from '../utils/string';

const SHOW_POPUP = 'SHOW_POPUP';
const HIDE_POPUP = 'HIDE_POPUP';

const UPDATE_HEATMAP_CONFIG = 'UPDATE_HEATMAP_CONFIG';

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

export const updateHeatmapDisplay = (config) => ({
  type: UPDATE_HEATMAP_CONFIG,
  payload: config,
});

export const popupReducer = (state = null, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SHOW_POPUP: {
      const popup = { ...payload, id: uuid() };
      return popup;
    }
    case HIDE_POPUP: {
      return null;
    }
    case SOCKET_SUBJECT_STATUS: {
      if (!state
        || state.type !== 'subject'
        || !state.data.properties
        || state.data.properties.id !== payload.properties.id) {
        return state;
      }
      const { geometry, properties } = payload;
      return {
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
    }
    default: {
      return state;
    }
  }
}

export const heatmapReducer = (state = {}, action) => {
  const { type, payload } = action;
  if (type === UPDATE_HEATMAP_CONFIG) return { ...state, ...payload };
  return state;
}