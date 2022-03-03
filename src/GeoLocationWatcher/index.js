import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';

import { GEOLOCATOR_OPTIONS } from '../constants';

import { setCurrentUserLocation } from '../ducks/location';

const ONE_MINUTE = 1000 * 60;

const onLocationWatchError = (e) => {
  if (e?.code === e?.PERMISSION_DENIED) {
    console.warn('location access denied');
  } else {
    console.warn('error watching current location', e);
  }
};

const GeoLocationWatcher = ({ setCurrentUserLocation, onError = onLocationWatchError, userLocation }) => {

  const [userLocationInState, setUserLocationInState] = useState(userLocation);

  useEffect(() => {
    const startWatchingPosition = () => {
      return window.navigator.geolocation.watchPosition(setUserLocationInState, onError, GEOLOCATOR_OPTIONS);
    };

    const locationWatchId = startWatchingPosition();

    return () => {
      window.navigator.geolocation.clearWatch(locationWatchId);
    };
  }, [onError, setCurrentUserLocation]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isEqual(userLocationInState?.coords, userLocation?.coords)) {
        setCurrentUserLocation(userLocationInState);
      }
    }, ONE_MINUTE);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
};

const mapStateToProps = ({ view: { userLocation } }) => ({
  userLocation,
});

export default connect(mapStateToProps, { setCurrentUserLocation })(GeoLocationWatcher);
