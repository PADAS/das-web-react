import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';

import { GEOLOCATOR_OPTIONS } from '../constants';

import { userIsGeoPermissionRestricted } from '../utils/geo-perms';
import { showToast } from '../utils/toast';

import { setCurrentUserLocation } from '../ducks/location';


const GeoLocationWatcher = ({ setCurrentUserLocation: onSuccess, user }) => {

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
      return window.navigator.geolocation.watchPosition(onSuccess, onError, GEOLOCATOR_OPTIONS);
    };

    const locationWatchId = startWatchingPosition();

    return () => {
      window.navigator.geolocation.clearWatch(locationWatchId);
    };
  }, [onError, onSuccess]);

  return null;
};

const mapStateToProps = ({ data: { user } }) => ({ user });
export default connect(mapStateToProps, { setCurrentUserLocation })(GeoLocationWatcher);
