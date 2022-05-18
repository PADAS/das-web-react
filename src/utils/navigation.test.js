import { getCurrentIdFromURL, getCurrentTabFromURL } from './navigation';

describe('Navigation utils', () => {
  describe('getCurrentIdFromURL', () => {
    test('gets the id from the pathname', () => {
      expect(getCurrentIdFromURL('/reports/reportId-1234')).toBe('reportId-1234');
      expect(getCurrentIdFromURL('/patrols/patrolId-987/')).toBe('patrolId-987');
      expect(getCurrentIdFromURL('/reports/reportId-5678/other-stuff')).toBe('reportId-5678');
      expect(getCurrentIdFromURL('/patrols/new')).toBe('new');
    });

    test('returns undefined if there is not an id', () => {
      expect(getCurrentIdFromURL('/')).toBeUndefined();
      expect(getCurrentIdFromURL('/reports')).toBeUndefined();
      expect(getCurrentIdFromURL('/patrols/')).toBeUndefined();
    });
  });

  describe('getCurrentTabFromURL', () => {
    test('gets the tab from the pathname', () => {
      expect(getCurrentTabFromURL('/reports')).toBe('reports');
      expect(getCurrentTabFromURL('/patrols/')).toBe('patrols');
      expect(getCurrentTabFromURL('/reports/other-stuff')).toBe('reports');
      expect(getCurrentTabFromURL('/patrols/new')).toBe('patrols');
      expect(getCurrentTabFromURL('/layers')).toBe('layers');
    });

    test('returns undefined if there is not a tab', () => {
      expect(getCurrentTabFromURL('/')).toBeUndefined();
    });
  });
});
