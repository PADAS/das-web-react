import { getQuickLinkTitle } from './quick-links';

describe('utils - quick-links', () => {
  describe('getQuickLinkTitle', () => {
    test('returns the title of a quick link that has one', () => {
      expect(getQuickLinkTitle({ name: 'park', title: 'National Park' })).toBe('National Park');
    });

    test('falls back to the name of a quick link with no title', () => {
      expect(getQuickLinkTitle({ name: 'Game Reserve' })).toBe('Game Reserve');
    });

    test('falls back to the name of a quick link with an empty title', () => {
      expect(getQuickLinkTitle({ name: 'Game Reserve', title: '' })).toBe('Game Reserve');
    });
  });
});
