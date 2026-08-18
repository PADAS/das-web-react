export const GEOLOCATION_PERMISSION_PROBE_RESULTS = {
  DENIED: 'denied',
  GRANTED: 'granted',
  UNKNOWN: 'unknown',
};

// A read verdict is all the probe needs, so skip the GPS hardware and take any cached fix.
const PROBE_GEOLOCATOR_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: Infinity,
  timeout: 5000,
};

// Only classify as a denial when the error is shaped like a GeolocationPositionError, otherwise any
// unrelated error carrying code 1 reads as a blocked permission.
export const isGeolocationPermissionDeniedError = (error) => !!error
  && error.PERMISSION_DENIED !== undefined
  && error.code === error.PERMISSION_DENIED;

let probePromise = null;

// Browsers that don't support the Permissions API for geolocation (legacy Safari) only reveal a blocked
// permission by attempting a read. Only in-flight and granted results are memoized: re-probing after a
// denial costs nothing (it errors without prompting) and is the only way to notice the user unblocking it.
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
          PROBE_GEOLOCATOR_OPTIONS
        );
      } catch {
        resolve(GEOLOCATION_PERMISSION_PROBE_RESULTS.UNKNOWN);
      }
    }).then((result) => {
      if (result !== GEOLOCATION_PERMISSION_PROBE_RESULTS.GRANTED) {
        probePromise = null;
      }

      return result;
    });
  }

  return probePromise;
};

export const resetGeolocationPermissionProbe = () => {
  probePromise = null;
};
