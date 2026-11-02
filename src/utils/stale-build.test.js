import { CLIENT_BUILD_VERSION } from '../constants';
import getWindowLocation from './getWindowLocation';

import { registerStaleBuildRecovery, RELOADED_BUILD_STORAGE_KEY, reloadOnceOnPreloadError } from './stale-build';

jest.mock('./getWindowLocation', () => jest.fn());

describe('utils - stale-build', () => {
  let reload;

  beforeEach(() => {
    reload = jest.fn();
    getWindowLocation.mockImplementation(() => ({ reload }));

    window.sessionStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('reloadOnceOnPreloadError', () => {
    test('reloads the page when this build has not reloaded yet', () => {
      reloadOnceOnPreloadError();

      expect(reload).toHaveBeenCalledTimes(1);
      expect(window.sessionStorage.getItem(RELOADED_BUILD_STORAGE_KEY)).toBe(CLIENT_BUILD_VERSION);
    });

    test('reloads the page when only an earlier build has reloaded', () => {
      window.sessionStorage.setItem(RELOADED_BUILD_STORAGE_KEY, 'release-2.150.1-1234');

      reloadOnceOnPreloadError();

      expect(reload).toHaveBeenCalledTimes(1);
    });

    test('does not reload the page a second time for the same build', () => {
      reloadOnceOnPreloadError();
      reloadOnceOnPreloadError();

      expect(reload).toHaveBeenCalledTimes(1);
    });

    test('does not reload the page while the browser is offline', () => {
      jest.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);

      reloadOnceOnPreloadError();

      expect(reload).not.toHaveBeenCalled();
    });

    test('reloads the page when a part fails to load again once the browser is back online', () => {
      const onLineSpy = jest.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
      reloadOnceOnPreloadError();

      onLineSpy.mockReturnValue(true);
      reloadOnceOnPreloadError();

      expect(reload).toHaveBeenCalledTimes(1);
    });

    test('does not reload the page when the session storage is unavailable', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });

      reloadOnceOnPreloadError();

      expect(reload).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('registerStaleBuildRecovery', () => {
    test('reloads the page when a part of the build fails to load', () => {
      registerStaleBuildRecovery();

      window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));

      expect(reload).toHaveBeenCalledTimes(1);
    });
  });
});
