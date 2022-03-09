import React, { useEffect, useRef } from 'react';
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
  const localUserLocationState = useRef(userLocation);

  useEffect(() => {
    const startWatchingPosition = () => {
      return window.navigator.geolocation.watchPosition(position => localUserLocationState.current = position, onError, GEOLOCATOR_OPTIONS);
    };

    const locationWatchId = startWatchingPosition();

    return () => {
      window.navigator.geolocation.clearWatch(locationWatchId);
    };
  }, [onError, setCurrentUserLocation]);

  useEffect(() => {
    const setUserLocationFromStateIfUpdated = () => {
      if (!isEqual(localUserLocationState?.current?.coords, userLocation?.coords)) {
        setCurrentUserLocation(localUserLocationState.current);
      }
    };

    if (!userLocation && !!localUserLocationState?.current) {
      setCurrentUserLocation(localUserLocationState.current);
    }

    const intervalId = window.setInterval(setUserLocationFromStateIfUpdated, ONE_MINUTE);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [setCurrentUserLocation, userLocation]);

  return null;
};

const mapStateToProps = ({ view: { userLocation } }) => ({
  userLocation,
});

export default connect(mapStateToProps, { setCurrentUserLocation })(GeoLocationWatcher);
