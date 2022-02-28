import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { GEOLOCATOR_OPTIONS } from '../constants';

import { setCurrentUserLocation } from '../ducks/location';

const onLocationWatchError = (e) => {
  console.warn('error watching current location', e);
};

const GeoLocationWatcher = ({ setCurrentUserLocation: onSuccess, onError = onLocationWatchError }) => {

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

export default connect(null, { setCurrentUserLocation })(GeoLocationWatcher);
