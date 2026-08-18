import {
  GEOLOCATION_PERMISSION_PROBE_RESULTS,
  isGeolocationPermissionDeniedError,
  probeGeolocationPermission,
  resetGeolocationPermissionProbe,
} from './permission-probe';

describe('probeGeolocationPermission', () => {
  let originalGeolocation;
  beforeEach(() => {
    originalGeolocation = window.navigator.geolocation;

    resetGeolocationPermissionProbe();
  });

  afterEach(() => {
    window.navigator.geolocation = originalGeolocation;
  });

  test('resolves granted when the position is read', async () => {
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback) => successCallback({ coords: {} })),
    };

    await expect(probeGeolocationPermission()).resolves.toBe(GEOLOCATION_PERMISSION_PROBE_RESULTS.GRANTED);
  });

  test('resolves denied when the user has blocked the permission', async () => {
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) => errorCallback({ code: 1, PERMISSION_DENIED: 1 })),
    };

    await expect(probeGeolocationPermission()).resolves.toBe(GEOLOCATION_PERMISSION_PROBE_RESULTS.DENIED);
  });

  test('resolves unknown for errors other than a denial', async () => {
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) => errorCallback({ code: 3, PERMISSION_DENIED: 1 })),
    };

    await expect(probeGeolocationPermission()).resolves.toBe(GEOLOCATION_PERMISSION_PROBE_RESULTS.UNKNOWN);
  });

  test('resolves unknown when the geolocation API is unavailable', async () => {
    window.navigator.geolocation = undefined;

    await expect(probeGeolocationPermission()).resolves.toBe(GEOLOCATION_PERMISSION_PROBE_RESULTS.UNKNOWN);
  });

  test('resolves unknown when the geolocation API throws', async () => {
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn(() => {
        throw new Error('blocked by permissions policy');
      }),
    };

    await expect(probeGeolocationPermission()).resolves.toBe(GEOLOCATION_PERMISSION_PROBE_RESULTS.UNKNOWN);
  });

  test('reads the position only once no matter how many callers ask', async () => {
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback) => successCallback({ coords: {} })),
    };

    const results = await Promise.all([
      probeGeolocationPermission(),
      probeGeolocationPermission(),
      probeGeolocationPermission(),
    ]);

    expect(window.navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array(3).fill(GEOLOCATION_PERMISSION_PROBE_RESULTS.GRANTED));
  });

  test('keeps returning the first result after it resolved', async () => {
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) => errorCallback({ code: 1, PERMISSION_DENIED: 1 })),
    };

    await probeGeolocationPermission();

    window.navigator.geolocation.getCurrentPosition = jest.fn(
      (successCallback) => successCallback({ coords: {} })
    );

    await expect(probeGeolocationPermission()).resolves.toBe(GEOLOCATION_PERMISSION_PROBE_RESULTS.DENIED);
    expect(window.navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
});

describe('isGeolocationPermissionDeniedError', () => {
  test('recognizes a denial', () => {
    expect(isGeolocationPermissionDeniedError({ code: 1, PERMISSION_DENIED: 1 })).toBe(true);
  });

  test('recognizes a denial when the error only carries a code', () => {
    expect(isGeolocationPermissionDeniedError({ code: 1 })).toBe(true);
  });

  test('does not treat other geolocation failures as a denial', () => {
    expect(isGeolocationPermissionDeniedError({ code: 2, PERMISSION_DENIED: 1 })).toBe(false);
    expect(isGeolocationPermissionDeniedError({ code: 3, PERMISSION_DENIED: 1 })).toBe(false);
  });

  test('does not treat an error without a code as a denial', () => {
    expect(isGeolocationPermissionDeniedError({ message: 'Error' })).toBe(false);
  });

  test('does not treat a missing error as a denial', () => {
    expect(isGeolocationPermissionDeniedError(undefined)).toBe(false);
  });
});
