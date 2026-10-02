import { SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS } from '../../constants';
import { clampOtusTabWidth } from '../../utils/otus';

// Not memoized: the clamp depends on the viewport, which the store knows nothing about.
export const selectOtusTabWidth = (state) =>
  clampOtusTabWidth(state.view.userPreferences.otusTabWidth ?? SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS);
