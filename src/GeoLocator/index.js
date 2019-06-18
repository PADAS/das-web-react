import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import LoadingOverlay from '../LoadingOverlay';
import { ReactComponent as GpsLocationIcon } from '../common/images/icons/gps-location-icon.svg';

import styles from './styles.module.scss';

const geolocatorOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

const GeoLocator = (props) => {
  const { className, label, onError, onStart, onSuccess } = props;
  const [fetchingLocation, setFetchingLocationState] = useState(false);
  const [locationFetchError, setLocationFetchErrorState] = useState(false);

  useEffect(() => {
    /* unmount only */
    return () => {
      setFetchingLocationState(false);
      setLocationFetchErrorState(false);
    };
  }, []);

  const startFetchLocation = () => {
    setLocationFetchErrorState(false);
    setFetchingLocationState(true);
    onStart();
    try {
      window.navigator.geolocation.getCurrentPosition(onLocationFetchSuccess, onLocationFetchError, geolocatorOptions);
    } catch (e) {
      onLocationFetchError(e);
    }
  };

  const onLocationFetchSuccess = (position) => {
    const { coords } = position;

    onLocationFetchFinish();
    onSuccess(coords);
  };

  const onLocationFetchError = (error) => {
    setLocationFetchErrorState(true);
    onLocationFetchFinish();
    onError(error);
  };

  const onLocationFetchFinish = () => {
    setFetchingLocationState(false);
  };

  return <div>
    <button title={label} className={`${styles.button} ${className}`} onClick={startFetchLocation}>
      <GpsLocationIcon />
      <span>{label}</span>
    </button>
    {fetchingLocation && <LoadingOverlay message='Getting your location' />}
    {locationFetchError && <span>Could not read your current location. <button onClick={startFetchLocation}>Try again</button></span>}
  </div>;
};

export default memo(GeoLocator);

GeoLocator.defaultProps = {
  className: '',
  label: 'Use my location',
  onStart() {
  },
  onError(error) {
    console.log('error fetching location', error);
  },
  onSuccess(coordinates) {
    console.log('here we are', coordinates);
  },
};

GeoLocator.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onStart: PropTypes.func,
};