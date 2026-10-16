import { SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS, SIDEBAR_WIDTH_PIXELS } from '../../constants';
import { calcMaxOtusTabWidth } from '../../utils/otus';

import { selectOtusTabWidth } from './';

describe('selectors - otus', () => {
  let innerWidth;
  beforeEach(() => {
    innerWidth = window.innerWidth;
    window.innerWidth = 1440;
  });

  afterEach(() => {
    window.innerWidth = innerWidth;
  });

  const buildState = (otusTabWidth) => ({ view: { userPreferences: { otusTabWidth } } });

  describe('selectOtusTabWidth', () => {
    test('falls back to the detail view width when the user has not resized the panel', () => {
      expect(selectOtusTabWidth(buildState(null))).toBe(SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS);
    });

    test('returns the width the user resized the panel to', () => {
      expect(selectOtusTabWidth(buildState(900))).toBe(900);
    });

    test('clamps a stored width to the panel bounds', () => {
      expect(selectOtusTabWidth(buildState(10))).toBe(SIDEBAR_WIDTH_PIXELS);
      expect(selectOtusTabWidth(buildState(5000))).toBe(calcMaxOtusTabWidth());
    });
  });
});
