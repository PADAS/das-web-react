import { MIN_VISIBLE_MAP_WIDTH_PIXELS, SIDEBAR_WIDTH_PIXELS, VERTICAL_NAV_RAIL_WIDTH_PIXELS } from '../constants';

import { calcMaxOtusTabWidth, clampOtusTabWidth } from './otus';

describe('utils - otus', () => {
  let innerWidth;
  beforeEach(() => {
    innerWidth = window.innerWidth;
    window.innerWidth = 1440;
  });

  afterEach(() => {
    window.innerWidth = innerWidth;
  });

  describe('calcMaxOtusTabWidth', () => {
    test('leaves room for the vertical nav rail and some map', () => {
      expect(calcMaxOtusTabWidth()).toBe(1440 - VERTICAL_NAV_RAIL_WIDTH_PIXELS - MIN_VISIBLE_MAP_WIDTH_PIXELS);
    });

    test('never goes below the minimum panel width on a narrow viewport', () => {
      window.innerWidth = 600;

      expect(calcMaxOtusTabWidth()).toBe(SIDEBAR_WIDTH_PIXELS);
    });
  });

  describe('clampOtusTabWidth', () => {
    test('keeps a width within the bounds', () => {
      expect(clampOtusTabWidth(800)).toBe(800);
    });

    test('raises a width below the minimum panel width', () => {
      expect(clampOtusTabWidth(100)).toBe(SIDEBAR_WIDTH_PIXELS);
    });

    test('lowers a width above the maximum panel width', () => {
      expect(clampOtusTabWidth(5000)).toBe(calcMaxOtusTabWidth());
    });
  });
});
