import { SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS } from '../../constants';
import { clampAtlasTabWidth } from '../../utils/atlas';

// Not memoized: the clamp depends on the viewport, which the store knows nothing about.
export const selectAtlasTabWidth = (state) =>
  clampAtlasTabWidth(state.view.userPreferences.atlasTabWidth ?? SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS);
