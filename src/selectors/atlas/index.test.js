import { SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS, SIDEBAR_WIDTH_PIXELS } from '../../constants';
import { calcMaxAtlasTabWidth } from '../../utils/atlas';

import { selectAtlasTabWidth } from './';

describe('selectors - atlas', () => {
  let innerWidth;
  beforeEach(() => {
    innerWidth = window.innerWidth;
    window.innerWidth = 1440;
  });

  afterEach(() => {
    window.innerWidth = innerWidth;
  });

  const buildState = (atlasTabWidth) => ({ view: { userPreferences: { atlasTabWidth } } });

  describe('selectAtlasTabWidth', () => {
    test('falls back to the detail view width when the user has not resized the panel', () => {
      expect(selectAtlasTabWidth(buildState(null))).toBe(SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS);
    });

    test('returns the width the user resized the panel to', () => {
      expect(selectAtlasTabWidth(buildState(900))).toBe(900);
    });

    test('clamps a stored width to the panel bounds', () => {
      expect(selectAtlasTabWidth(buildState(10))).toBe(SIDEBAR_WIDTH_PIXELS);
      expect(selectAtlasTabWidth(buildState(5000))).toBe(calcMaxAtlasTabWidth());
    });
  });
});
