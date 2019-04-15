const UPDATE_HEATMAP_CONFIG = 'UPDATE_HEATMAP_CONFIG';

export const updateHeatmapConfig = (config) => ({
  type: UPDATE_HEATMAP_CONFIG,
  payload: config,
});

export const heatmapReducer = (state = {}, action) => {
  const { type, payload } = action;
  if (type === UPDATE_HEATMAP_CONFIG) return { ...state, ...payload };
  return state;
};
