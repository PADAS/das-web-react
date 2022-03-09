import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';
import isEqual from 'react-fast-compare';

import { GEOLOCATOR_OPTIONS } from '../constants';

import { userIsGeoPermissionRestricted } from '../utils/geo-perms';
import { showToast } from '../utils/toast';

import { setCurrentUserLocation } from '../ducks/location';

const ONE_MINUTE = 1000 * 60;


const GeoLocationWatcher = ({ setCurrentUserLocation, user, userLocation, updateRate = ONE_MINUTE }) => {
  const localUserLocationState = useRef(userLocation);
  const errorToastId = useRef(null);

  const onError = useCallback((error) => {
    if (error.code === error.PERMISSION_DENIED && userIsGeoPermissionRestricted(user)) {

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
    console.warn('error watching current location', error);
  }, [user]);

  useEffect(() => {
    const startWatchingPosition = () => {
      return window.navigator.geolocation.watchPosition(
        position =>
          localUserLocationState.current = position,
        onError,
        GEOLOCATOR_OPTIONS,
      );
    };

    const locationWatchId = startWatchingPosition();

    return () => {
      window.navigator.geolocation.clearWatch(locationWatchId);
    };
  }, [onError]);

  useEffect(() => {
    const setUserLocationFromStateIfUpdated = () => {
      if (!isEqual(localUserLocationState?.current?.coords, userLocation?.coords)) {
        setCurrentUserLocation(localUserLocationState.current);
      }
    };

    if (!userLocation && !!localUserLocationState?.current) {
      setCurrentUserLocation(localUserLocationState.current);
    }

    const intervalId = window.setInterval(setUserLocationFromStateIfUpdated, updateRate);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [updateRate, userLocation, setCurrentUserLocation]);

  return null;
};

const mapStateToProps = ({ data: { user }, view: { userLocation } }) => ({ user, userLocation });

export default connect(mapStateToProps, { setCurrentUserLocation })(GeoLocationWatcher);
