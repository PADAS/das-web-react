import { MIN_VISIBLE_MAP_WIDTH_PIXELS, SIDEBAR_WIDTH_PIXELS, VERTICAL_NAV_RAIL_WIDTH_PIXELS } from '../constants';

import { calcMaxAtlasTabWidth, clampAtlasTabWidth } from './atlas';

describe('utils - atlas', () => {
  let innerWidth;
  beforeEach(() => {
    innerWidth = window.innerWidth;
    window.innerWidth = 1440;
  });

  afterEach(() => {
    window.innerWidth = innerWidth;
  });

  describe('calcMaxAtlasTabWidth', () => {
    test('leaves room for the vertical nav rail and some map', () => {
      expect(calcMaxAtlasTabWidth()).toBe(1440 - VERTICAL_NAV_RAIL_WIDTH_PIXELS - MIN_VISIBLE_MAP_WIDTH_PIXELS);
    });

    test('never goes below the minimum panel width on a narrow viewport', () => {
      window.innerWidth = 600;

      expect(calcMaxAtlasTabWidth()).toBe(SIDEBAR_WIDTH_PIXELS);
    });
  });

  describe('clampAtlasTabWidth', () => {
    test('keeps a width within the bounds', () => {
      expect(clampAtlasTabWidth(800)).toBe(800);
    });

    test('raises a width below the minimum panel width', () => {
      expect(clampAtlasTabWidth(100)).toBe(SIDEBAR_WIDTH_PIXELS);
    });

    test('lowers a width above the maximum panel width', () => {
      expect(clampAtlasTabWidth(5000)).toBe(calcMaxAtlasTabWidth());
    });
  });
});
