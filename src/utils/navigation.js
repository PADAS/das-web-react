import { matchPath } from 'react-router';

export const getCurrentIdFromURL = (pathname) => {
  const match = matchPath({ path: '/:tab/:id/*' }, pathname);

  return match?.params?.id;
};

export const getCurrentTabFromURL = (pathname) => {
  const match = matchPath('/:tab/*', pathname);

  return match?.params?.tab;
};

// Drive a full-page (non-SPA) browser navigation. Wrapped so callers can be
// unit-tested without depending on jsdom's non-configurable window.location.
export const redirectToExternalUrl = (url) => {
  window.location.href = url;
};
