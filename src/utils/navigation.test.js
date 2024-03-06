import { getCurrentIdFromURL, getCurrentTabFromURL } from './navigation';

describe('Navigation utils', () => {
  describe('getCurrentIdFromURL', () => {
    test('gets the id from the pathname', () => {
      expect(getCurrentIdFromURL('/events/reportId-1234')).toBe('reportId-1234');
      expect(getCurrentIdFromURL('/patrols/patrolId-987/')).toBe('patrolId-987');
      expect(getCurrentIdFromURL('/events/reportId-5678/other-stuff')).toBe('reportId-5678');
      expect(getCurrentIdFromURL('/patrols/new')).toBe('new');
    });

    test('returns undefined if there is not an id', () => {
      expect(getCurrentIdFromURL('/')).toBeUndefined();
      expect(getCurrentIdFromURL('/events')).toBeUndefined();
      expect(getCurrentIdFromURL('/patrols/')).toBeUndefined();
    });
  });

  describe('getCurrentTabFromURL', () => {
    test('gets the tab from the pathname', () => {
      expect(getCurrentTabFromURL('/events')).toBe('events');
      expect(getCurrentTabFromURL('/patrols/')).toBe('patrols');
      expect(getCurrentTabFromURL('/events/other-stuff')).toBe('events');
      expect(getCurrentTabFromURL('/patrols/new')).toBe('patrols');
      expect(getCurrentTabFromURL('/layers')).toBe('layers');
    });

    test('returns undefined if there is not a tab', () => {
      expect(getCurrentTabFromURL('/')).toBeUndefined();
    });
  });
});
