import { matchPath } from 'react-router';

import {
  detailViewPattern,
  getCurrentIdFromURL,
  getCurrentTabFromURL,
  prefixedRoutePattern,
  redirectToExternalUrl,
  tabPath,
} from './navigation';

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
      expect(getCurrentTabFromURL('/gear')).toBe('gear');
    });

    test('returns undefined if there is not a tab', () => {
      expect(getCurrentTabFromURL('/')).toBeUndefined();
    });
  });

  describe('tabPath', () => {
    test('prefixes the tab key with a leading slash', () => {
      expect(tabPath('events')).toBe('/events');
      expect(tabPath('patrols')).toBe('/patrols');
    });
  });

  describe('detailViewPattern', () => {
    test('builds a matchPath pattern scoped to the given tab', () => {
      expect(detailViewPattern('events')).toBe('/events/:id/*');
    });

    test('matches a detail view URL and any nested path beneath it', () => {
      expect(matchPath(detailViewPattern('patrols'), '/patrols/patrolId-987')).not.toBeNull();
      expect(matchPath(detailViewPattern('patrols'), '/patrols/patrolId-987/legs/legId-1')).not.toBeNull();
    });

    test('does not match a different tab or the bare tab path', () => {
      expect(matchPath(detailViewPattern('patrols'), '/events/reportId-1234')).toBeNull();
      expect(matchPath(detailViewPattern('patrols'), '/patrols')).toBeNull();
    });
  });

  describe('prefixedRoutePattern', () => {
    test('leaves the pattern untouched for the root prefix', () => {
      expect(prefixedRoutePattern('/', '/community/:value/*')).toBe('/community/:value/*');
    });

    test('composes a non-root prefix into the pattern', () => {
      expect(prefixedRoutePattern('/er/', '/community/:value/*')).toBe('/er/community/:value/*');
      expect(prefixedRoutePattern('/er', '/community/:value/*')).toBe('/er/community/:value/*');
    });

    test('matches a pathname that includes the prefix', () => {
      expect(matchPath(prefixedRoutePattern('/er/', '/community/:value/*'), '/er/community/abc')).not.toBeNull();
      expect(matchPath(prefixedRoutePattern('/', '/community/:value/*'), '/community/abc')).not.toBeNull();
    });

    test('does not match a prefixed pathname when the prefix is left out', () => {
      expect(matchPath('/community/:value/*', '/er/community/abc')).toBeNull();
    });
  });

  describe('redirectToExternalUrl', () => {
    afterEach(() => {
      window.history.replaceState({}, '', '/');
    });

    test('assigns the given url to window.location', () => {
      // jsdom only applies same-document (hash) navigations observably — a full
      // cross-origin navigation logs "not implemented" without updating
      // location — so assert the href assignment via a hash fragment.
      redirectToExternalUrl('#linked');

      expect(window.location.hash).toBe('#linked');
    });
  });
});
