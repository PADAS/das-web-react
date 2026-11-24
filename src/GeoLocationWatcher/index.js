import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { GEOLOCATION_PERMISSION_STATES } from '../utils/location/constants';
import { GEOLOCATOR_OPTIONS } from '../constants';
import { selectIsGeoPermissionRestricted, selectIsSignedInUserLoaded } from '../selectors/user';
import { setCurrentUserLocation } from '../ducks/location';
import { setUserLocationAccessGranted } from '../ducks/user';
import { showToast } from '../utils/toast';
import useGeolocationPermissionState from '../hooks/useGeolocationPermissionState';

const ONE_MINUTE = 1000 * 60;

const GeoLocationWatcher = ({ updateRate = ONE_MINUTE }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'geoLocationWatcher' });

  const isGeoPermissionRestricted = useSelector(selectIsGeoPermissionRestricted);
  const isSignedInUserLoaded = useSelector(selectIsSignedInUserLoaded);
  const userLocation = useSelector((state) => state.view.userLocation);
  const userLocationAccessGranted = useSelector((state) => state.view.userLocationAccessGranted?.granted);

  // Placed after the selectors because it depends on one of them.
  const geolocationPermissionState = useGeolocationPermissionState(isSignedInUserLoaded);

  const errorToastId = useRef(null);
  const localUserLocationState = useRef(userLocation);
  const locationWatchId = useRef(null);

  const showPermissionsToast = useCallback(() => {
    if (!errorToastId.current) {
      errorToastId.current = showToast({
        link: { href: 'https://support.google.com/chrome/answer/142065', title: t('shareLocationToastTitle') },
        message: t('shareLocationToastMessage'),
        toastConfig: {
          autoClose: false,
          onClose: () => {
            errorToastId.current = null;
          },
          type: 'error',
        },
      });
    }
  }, [t]);

  const clearUserLocation = useCallback(() => {
    localUserLocationState.current = null;
    dispatch(setCurrentUserLocation(null));
  }, [dispatch]);

  const onGeoUpdateSuccess = useCallback((location) => {
    localUserLocationState.current = location;
  }, []);

  const onGeoInitSuccess = useCallback((location) => {
    onGeoUpdateSuccess(location);
    dispatch(setCurrentUserLocation(location));
  }, [dispatch, onGeoUpdateSuccess]);

  const onGeoError = useCallback((error) => {
    if (error && error.code === error.PERMISSION_DENIED && isGeoPermissionRestricted) {
      clearUserLocation();
    }
  }, [clearUserLocation, isGeoPermissionRestricted]);

  useEffect(() => {
    if (geolocationPermissionState === null) return;

    const isGranted = geolocationPermissionState === GEOLOCATION_PERMISSION_STATES.GRANTED;

    // react-toastify dismisses every toast when it is given a null id.
    if (isGranted && errorToastId.current) {
      toast.dismiss(errorToastId.current);
    }

    dispatch(setUserLocationAccessGranted(isGranted));
  }, [dispatch, geolocationPermissionState]);

  useEffect(() => {
    if (!userLocationAccessGranted) {
      clearUserLocation();
      // Location access is unknown until it is first checked, once signed in.
      if (isGeoPermissionRestricted && isSignedInUserLoaded) {
        showPermissionsToast();
      }
    }
  }, [
    clearUserLocation,
    isGeoPermissionRestricted,
    isSignedInUserLoaded,
    showPermissionsToast,
    userLocationAccessGranted,
  ]);

  useEffect(() => {
    if (userLocationAccessGranted) {
      window.navigator.geolocation.getCurrentPosition(onGeoInitSuccess, onGeoError, GEOLOCATOR_OPTIONS);
      locationWatchId.current = window.navigator.geolocation.watchPosition(
        onGeoUpdateSuccess,
        onGeoError,
        GEOLOCATOR_OPTIONS,
      );
    }
    return () => window.navigator.geolocation.clearWatch(locationWatchId.current);
  }, [onGeoError, onGeoInitSuccess, onGeoUpdateSuccess, userLocationAccessGranted]);

  useEffect(() => {
    const setNewUserLocation = () => {
      dispatch(setCurrentUserLocation(localUserLocationState.current));
    };

    if (localUserLocationState.current && !userLocation) {
      setNewUserLocation();
    }

    const intervalId = window.setInterval(setNewUserLocation, updateRate);

    return () => window.clearInterval(intervalId);
  }, [dispatch, updateRate, userLocation]);

  return null;
};

export default GeoLocationWatcher;
