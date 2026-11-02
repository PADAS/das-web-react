import { CLIENT_BUILD_VERSION } from '../constants';
import getWindowLocation from './getWindowLocation';

export const RELOADED_BUILD_STORAGE_KEY = 'er-reloaded-stale-build';

// A deploy deletes the old build's files, so a page still running it can only
// load its lazy parts again after reloading onto the new build.
export const reloadOnceOnPreloadError = () => {
  try {
    // Offline, the reload would fail and show the browser's error page.
    if (window.navigator.onLine
      && window.sessionStorage.getItem(RELOADED_BUILD_STORAGE_KEY) !== CLIENT_BUILD_VERSION) {
      window.sessionStorage.setItem(RELOADED_BUILD_STORAGE_KEY, CLIENT_BUILD_VERSION);
      getWindowLocation().reload();
    }
  } catch (error) {
    console.warn('Failed to reload the page onto the latest build:', error);
  }
};

export const registerStaleBuildRecovery = () => {
  window.addEventListener('vite:preloadError', reloadOnceOnPreloadError);
};
