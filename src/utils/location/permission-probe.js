import { GEOLOCATOR_OPTIONS } from '../../constants';

export const GEOLOCATION_PERMISSION_PROBE_RESULTS = {
  DENIED: 'denied',
  GRANTED: 'granted',
  UNKNOWN: 'unknown',
};

// A mock error without a code must not read as a denial, so fall back to the spec's value rather than
// comparing two undefineds.
export const isGeolocationPermissionDeniedError = (error) => !!error
  && error.code === (error.PERMISSION_DENIED ?? 1);

let probePromise = null;

// Browsers that don't support the Permissions API for geolocation (legacy Safari) only reveal a blocked
// permission by attempting a read. Memoized for the page lifetime so repeat callers never re-prompt.
export const probeGeolocationPermission = () => {
  if (!probePromise) {
    probePromise = new Promise((resolve) => {
      if (!window.navigator.geolocation?.getCurrentPosition) {
        return resolve(GEOLOCATION_PERMISSION_PROBE_RESULTS.UNKNOWN);
      }

      try {
        window.navigator.geolocation.getCurrentPosition(
          () => resolve(GEOLOCATION_PERMISSION_PROBE_RESULTS.GRANTED),
          (error) => resolve(isGeolocationPermissionDeniedError(error)
            ? GEOLOCATION_PERMISSION_PROBE_RESULTS.DENIED
            : GEOLOCATION_PERMISSION_PROBE_RESULTS.UNKNOWN),
          GEOLOCATOR_OPTIONS
        );
      } catch {
        resolve(GEOLOCATION_PERMISSION_PROBE_RESULTS.UNKNOWN);
      }
    });
  }

  return probePromise;
};

export const resetGeolocationPermissionProbe = () => {
  probePromise = null;
};
