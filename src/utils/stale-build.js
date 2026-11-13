import { CLIENT_BUILD_VERSION } from '../constants';
import getWindowLocation from './getWindowLocation';

export const RELOADED_BUILDS_STORAGE_KEY = 'er-reloaded-stale-builds';

// A deploy deletes the old build's files, so a page still running it can only
// load its lazy parts again after reloading onto the new build.
export const reloadOnceOnPreloadError = () => {
  try {
    // Every build is remembered, so a rollout serving two builds cannot loop.
    const reloadedBuilds = JSON.parse(window.sessionStorage.getItem(RELOADED_BUILDS_STORAGE_KEY)) ?? [];

    // Offline, the reload would fail and show the browser's error page.
    if (window.navigator.onLine && !reloadedBuilds.includes(CLIENT_BUILD_VERSION)) {
      window.sessionStorage.setItem(
        RELOADED_BUILDS_STORAGE_KEY,
        JSON.stringify([...reloadedBuilds, CLIENT_BUILD_VERSION])
      );
      getWindowLocation().reload();
    }
  } catch (error) {
    console.warn('Failed to reload the page onto the latest build:', error);
  }
};

export const registerStaleBuildRecovery = () => {
  window.addEventListener('vite:preloadError', reloadOnceOnPreloadError);
};
