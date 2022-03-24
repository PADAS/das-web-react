import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';

import { GEOLOCATOR_OPTIONS } from '../constants';

import { userIsGeoPermissionRestricted } from '../utils/geo-perms';
import { showToast } from '../utils/toast';

import { setCurrentUserLocation } from '../ducks/location';

const ONE_MINUTE = 1000 * 60;

const GeoLocationWatcher = ({ setCurrentUserLocation, user, userLocation, updateRate = ONE_MINUTE }) => {
  const [locationAccessGranted, setLocationAccessGranted] = useState(false);

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
    const GRANTED_STATE = 'granted';
    let permStatus;

    const setPermissionState = (state) => {
      if (state === GRANTED_STATE) {
        toast.dismiss(errorToastId.current);
        return setLocationAccessGranted(true);
      }
      return setLocationAccessGranted(false);
    };

    const handlePermissionStateChange = ({ target: { state } }) => setPermissionState(state);


    navigator.permissions.query({ name: 'geolocation' })
      .then(function(permissionStatus) {
        permStatus = permissionStatus;

        setPermissionState(permStatus.state);

        permStatus.addEventListener('change', handlePermissionStateChange);
      });

    return () => {
      permStatus?.removeEventListener('change', handlePermissionStateChange);
    };
  }, []);

  useEffect(() => {
    window.navigator.geolocation.getCurrentPosition(onGeoInitSuccess, onGeoError, GEOLOCATOR_OPTIONS);
  }, [onGeoInitSuccess, onGeoError]);

  useEffect(() => {
    if (!locationAccessGranted && userIsGeoPermissionRestricted(user)) {
      clearUserLocation();
      showPermissionsToast();
    }
  }, [clearUserLocation, showPermissionsToast, locationAccessGranted, user]);

  useEffect(() => {
    if (locationAccessGranted) {
      window.navigator.geolocation.getCurrentPosition(onGeoInitSuccess, onGeoError, GEOLOCATOR_OPTIONS);
      locationWatchId.current = startWatchingPosition();
    }
    return () => {
      window.navigator.geolocation.clearWatch(locationWatchId.current);
    };
  }, [startWatchingPosition, onGeoError, onGeoInitSuccess, locationAccessGranted]);

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

const mapStateToProps = ({ data: { user }, view: { userLocation } }) => ({ user, userLocation });

export default connect(mapStateToProps, { setCurrentUserLocation })(GeoLocationWatcher);
