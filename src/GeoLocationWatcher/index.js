import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';
import isEqual from 'react-fast-compare';

import { GEOLOCATOR_OPTIONS } from '../constants';

import { userIsGeoPermissionRestricted } from '../utils/geo-perms';
import { showToast } from '../utils/toast';

import { setCurrentUserLocation } from '../ducks/location';

const ONE_MINUTE = 1000 * 60;


const GeoLocationWatcher = ({ setCurrentUserLocation, user, userLocation, updateRate = ONE_MINUTE }) => {
  const [localUserLocationState, setLocalUserLocationState] = useState(userLocation);
  const [isInit, setInit] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const locationWatchId = useRef(null);

  const errorToastId = useRef(null);

  const onGeoSuccess = useCallback((location) => {
    setLocalUserLocationState(location);
  }, []);

  const onGeoError = useCallback((error) => {
    setLocalUserLocationState(null);
    setCurrentUserLocation(null);

    if (error && error.code === error.PERMISSION_DENIED && userIsGeoPermissionRestricted(user)) {
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
    }
  }, [setCurrentUserLocation, user]);

  const startWatchingPosition = useCallback(() => {
    return window.navigator.geolocation.watchPosition(
      onGeoSuccess,
      onGeoError,
      GEOLOCATOR_OPTIONS,
    );
  }, [onGeoSuccess, onGeoError]);


  useEffect(() => {
    const GRANTED_STATE = 'granted';
    let permStatus;

    const setPermissionState = (state) => {
      if (state === GRANTED_STATE) {
        return setIsAllowed(true);
      }
      return setIsAllowed(false);
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
    setInit(true);
  }, []);

  useEffect(() => {
    if (isInit) {
      if (!isAllowed) {
        onGeoError();
      } else {
        window.navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, GEOLOCATOR_OPTIONS);
      }
    }
  }, [isInit, onGeoError, onGeoSuccess, isAllowed]);

  useEffect(() => {
    locationWatchId.current = startWatchingPosition();
    return () => {
      window.navigator.geolocation.clearWatch(locationWatchId.current);
    };
  }, [startWatchingPosition]);

  useEffect(() => {
    const setUserLocationFromStateIfUpdated = () => {
      if (!isEqual(localUserLocationState?.coords, userLocation?.coords)) {
        setCurrentUserLocation(localUserLocationState);
      }
    };

    if (!userLocation && !!localUserLocationState) {
      setCurrentUserLocation(localUserLocationState);
    }

    const intervalId = window.setInterval(setUserLocationFromStateIfUpdated, updateRate);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [updateRate, userLocation, localUserLocationState, setCurrentUserLocation]);

  return null;
};

const mapStateToProps = ({ data: { user }, view: { userLocation } }) => ({ user, userLocation });

export default connect(mapStateToProps, { setCurrentUserLocation })(GeoLocationWatcher);
