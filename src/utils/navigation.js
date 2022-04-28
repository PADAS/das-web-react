import { matchPath } from 'react-router-dom';

export const getCurrentIdFromURL = (pathname) => {
  const match = matchPath({ path: '/:tab/:id' }, pathname);

  return match?.params?.id;
};

export const getCurrentTabFromURL = (pathname) => {
  const match = matchPath('/:tab/*', pathname);

  return match?.params?.tab;
};
