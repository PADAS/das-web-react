import { MIN_VISIBLE_MAP_WIDTH_PIXELS, SIDEBAR_WIDTH_PIXELS, VERTICAL_NAV_RAIL_WIDTH_PIXELS } from '../constants';

// A viewport too narrow for both still gets the minimum; the stylesheet caps
// the panel at the viewport.
export const calcMaxOtusTabWidth = () => Math.max(
  SIDEBAR_WIDTH_PIXELS,
  window.innerWidth - VERTICAL_NAV_RAIL_WIDTH_PIXELS - MIN_VISIBLE_MAP_WIDTH_PIXELS,
);

export const clampOtusTabWidth = (width) => Math.min(Math.max(width, SIDEBAR_WIDTH_PIXELS), calcMaxOtusTabWidth());
