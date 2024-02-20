import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { GEOLOCATOR_OPTIONS } from '../constants';
import { setCurrentUserLocation } from '../ducks/location';
import { setUserLocationAccessGranted } from '../ducks/user';
import { showToast } from '../utils/toast';
import { userIsGeoPermissionRestricted } from '../utils/geo-perms';

const DENIED_STATE = 'denied';
const GRANTED_STATE = 'granted';
const ONE_MINUTE = 1000 * 60;

const GeoLocationWatcher = ({ updateRate = ONE_MINUTE }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'geoLocationWatcher' });

  const user = useSelector((state) => state.data.user);
  const userLocation = useSelector((state) => state.view.userLocation);
  const userLocationAccessGranted = useSelector((state) => state.view.userLocationAccessGranted?.granted);

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
          type: toast.TYPE.ERROR,
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
    onGeoUpdateSuccess();
    dispatch(setCurrentUserLocation(location));
  }, [dispatch, onGeoUpdateSuccess]);

  const onGeoError = useCallback((error) => {
    if (error && error.code === error.PERMISSION_DENIED && userIsGeoPermissionRestricted(user)) {
      clearUserLocation();
    }
  }, [clearUserLocation, user]);

  useEffect(() => {
    const setPermissionState = (state) => {
      if (state === GRANTED_STATE) {
        toast.dismiss(errorToastId.current);
        return dispatch(setUserLocationAccessGranted(true));
      }
      return dispatch(setUserLocationAccessGranted(false));
    };

    const handlePermissionStateChange = (event) => setPermissionState(event.target.state);

    if (navigator?.permissions?.query) {
      let permStatus;
      window.navigator.permissions.query({ name: 'geolocation' })
        .then((permissionStatus) => {
          permStatus = permissionStatus;

          setPermissionState(permStatus.state);

          permStatus.addEventListener('change', handlePermissionStateChange);
        });

      return () => permStatus?.removeEventListener('change', handlePermissionStateChange);
    } else {
      window.navigator.geolocation.getCurrentPosition(
        () => setPermissionState(GRANTED_STATE),
        () => setPermissionState(DENIED_STATE),
        GEOLOCATOR_OPTIONS
      );
    }
  }, [dispatch]);

  useEffect(() => {
    window.navigator.geolocation.getCurrentPosition(onGeoInitSuccess, onGeoError, GEOLOCATOR_OPTIONS);
  }, [onGeoInitSuccess, onGeoError]);

  useEffect(() => {
    if (!userLocationAccessGranted) {
      clearUserLocation();
      if (userIsGeoPermissionRestricted(user)) {
        showPermissionsToast();
      }
    }
  }, [clearUserLocation, showPermissionsToast, userLocationAccessGranted, user]);

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
