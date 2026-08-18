import { matchPath } from 'react-router';

import { URL_PATTERNS } from '../constants/routes';

export const getCurrentIdFromURL = (pathname) => {
  const match = matchPath({ path: URL_PATTERNS.TAB_ITEM }, pathname);

  return match?.params?.id;
};

export const getCurrentTabFromURL = (pathname) => {
  const match = matchPath({ path: URL_PATTERNS.TAB }, pathname);

  return match?.params?.tab;
};

// Route patterns are relative to the router's basename, but window.location.pathname includes it, so
// matching a pattern against a raw pathname needs the prefix composed in first. The basename is accepted
// by the router with or without slashes around it, the composed pattern needs exactly one leading slash.
export const prefixedRoutePattern = (prefix, pattern) => {
  const trimmedPrefix = (prefix || '').replace(/^\/+/, '').replace(/\/+$/, '');

  return `${trimmedPrefix ? `/${trimmedPrefix}` : ''}${pattern}`;
};

export const tabPath = (tab) => `/${tab}`;

export const detailViewPattern = (tab) => `/${tab}/:id/*`;

// Drive a full-page (non-SPA) browser navigation. Wrapped so callers can be
// unit-tested without depending on jsdom's non-configurable window.location.
export const redirectToExternalUrl = (url) => {
  window.location.href = url;
};
