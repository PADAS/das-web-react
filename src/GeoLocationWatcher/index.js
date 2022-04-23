import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';

import { GEOLOCATOR_OPTIONS } from '../constants';

import { userIsGeoPermissionRestricted } from '../utils/geo-perms';
import { showToast } from '../utils/toast';

import { setCurrentUserLocation } from '../ducks/location';
import { setUserLocationAccessGranted } from '../ducks/user';

const ONE_MINUTE = 1000 * 60;
const GRANTED_STATE = 'granted';
const DENIED_STATE = 'denied';

const GeoLocationWatcher = ({ setCurrentUserLocation, setUserLocationAccessGranted, user, userLocation, userLocationAccessGranted, updateRate = ONE_MINUTE }) => {
  const localUserLocationState = useRef(userLocation);
  const locationWatchId = useRef(null);
  const errorToastId = useRef(null);

  const showPermissionsToast = useCallback(() => {
    if (!errorToastId.current) {
      errorToastId.current = showToast({
        link: { href: 'https://support.google.com/chrome/answer/142065', title: 'Learn how' },
        message: 'Share your location to view data with geo-permissions',
        toastConfig: {
          autoClose: false,
          type: toast.TYPE.ERROR,
          onClose() {
            errorToastId.current = null;
          },
        },
      });
    }
  }, []);

  const clearUserLocation = useCallback(() => {
    localUserLocationState.current = null;
    setCurrentUserLocation(null);
  }, [setCurrentUserLocation]);

  const onGeoUpdateSuccess = useCallback((location) => {
    localUserLocationState.current = location;
  }, []);

  const onGeoInitSuccess = useCallback((location) => {
    onGeoUpdateSuccess();
    setCurrentUserLocation(location);
  }, [onGeoUpdateSuccess, setCurrentUserLocation]);

  const onGeoError = useCallback((error) => {
    if (error && error.code === error.PERMISSION_DENIED && userIsGeoPermissionRestricted(user)) {
      clearUserLocation();
    }
  }, [clearUserLocation, user]);

  const startWatchingPosition = useCallback(() => {
    return window.navigator.geolocation.watchPosition(
      onGeoUpdateSuccess,
      onGeoError,
      GEOLOCATOR_OPTIONS,
    );
  }, [onGeoUpdateSuccess, onGeoError]);


  useEffect(() => {
    let permStatus;

    const setPermissionState = (state) => {
      if (state === GRANTED_STATE) {
        toast.dismiss(errorToastId.current);
        return setUserLocationAccessGranted(true);
      }
      return setUserLocationAccessGranted(false);
    };

    const handlePermissionStateChange = ({ target: { state } }) => setPermissionState(state);

    if (navigator?.permissions?.query) {
      window.navigator.permissions.query({ name: 'geolocation' })
        .then(function(permissionStatus) {
          permStatus = permissionStatus;

          setPermissionState(permStatus.state);

          permStatus.addEventListener('change', handlePermissionStateChange);
        });

      return () => {
        permStatus?.removeEventListener('change', handlePermissionStateChange);
      };
    }

    else {
      window.navigator.geolocation.getCurrentPosition(
        () =>  setPermissionState(GRANTED_STATE),
        () => setPermissionState(DENIED_STATE)
      );
    }
  }, [setUserLocationAccessGranted]);

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
      locationWatchId.current = startWatchingPosition();
    }
    return () => {
      window.navigator.geolocation.clearWatch(locationWatchId.current);
    };
  }, [startWatchingPosition, onGeoError, onGeoInitSuccess, userLocationAccessGranted]);

  useEffect(() => {
    const setNewUserLocation = () => {
      setCurrentUserLocation(localUserLocationState.current);
    };

    if (localUserLocationState.current && !userLocation) {
      setNewUserLocation();
    }

    const intervalId = window.setInterval(setNewUserLocation, updateRate);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [updateRate, userLocation, setCurrentUserLocation]);

  return null;
};

const mapStateToProps = ({ data: { user }, view: { userLocation, userLocationAccessGranted } }) => ({ user, userLocation, userLocationAccessGranted: userLocationAccessGranted?.granted });

export default connect(mapStateToProps, { setCurrentUserLocation, setUserLocationAccessGranted })(GeoLocationWatcher);
