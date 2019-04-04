const UPDATE_HEATMAP_CONFIG = 'UPDATE_HEATMAP_CONFIG';
const SET_SIDEBAR_STATE = 'SET_SIDEBAR_STATE';

export const updateHeatmapConfig = (config) => ({
  type: UPDATE_HEATMAP_CONFIG,
  payload: config,
});

export const setSidebarState = isOpen => ({
  type: SET_SIDEBAR_STATE,
  payload: isOpen,
});

export const heatmapReducer = (state = {}, action) => {
  const { type, payload } = action;
  if (type === UPDATE_HEATMAP_CONFIG) return { ...state, ...payload };
  return state;
};


export const sidebarStateReducer = (state = { open: true }, action) => {
  const { type, payload } = action;
  if (type === SET_SIDEBAR_STATE) return { open: payload };
  return state;
}