import React, { memo, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Alert from 'react-bootstrap/Alert';

import { setCurrentUserLocation } from '../ducks/location';

import { GEOLOCATOR_OPTIONS } from '../constants';
import LoadingOverlay from '../LoadingOverlay';
import { ReactComponent as GpsLocationIcon } from '../common/images/icons/gps-location-icon.svg';

import styles from './styles.module.scss';

const GeoLocator = (props) => {
  const { className, label, onError, onStart, onSuccess, setCurrentUserLocation, userLocation } = props;
  const [fetchingLocation, setFetchingLocationState] = useState(false);
  const [locationFetchError, setLocationFetchErrorState] = useState(false);
  const clearAlertTimeout = useRef(null);

  useEffect(() => {
    /* unmount only */
    return () => {
      setFetchingLocationState(false);
      setLocationFetchErrorState(false);
      window.clearTimeout(clearAlertTimeout.current);
    };
  }, []);

  const startFetchLocation = () => {
    setLocationFetchErrorState(false);
    setFetchingLocationState(true);
    onStart();
    if (userLocation) return onLocationFetchSuccess(userLocation);
    else try {
      window.navigator.geolocation.getCurrentPosition(onLocationFetchSuccess, onLocationFetchError, GEOLOCATOR_OPTIONS);
    } catch (e) {
      onLocationFetchError(e);
    }
  };

  const onLocationFetchSuccess = (position) => {
    setCurrentUserLocation(position);
    const { coords } = position;
    onLocationFetchFinish();
    onSuccess(coords);
  };

  const onLocationFetchError = (error) => {
    setLocationFetchErrorState(error);
    onLocationFetchFinish();
    clearAlertTimeout.current = window.setTimeout(() => setLocationFetchErrorState(false), 3500);
    onError(error);
  };

  const onLocationFetchFinish = () => {
    setFetchingLocationState(false);
  };

  return <div className={className}>
    <button title={label} className={styles.button} onClick={startFetchLocation}>
      <GpsLocationIcon />
      <span>{label}</span>
    </button>
    {fetchingLocation && <LoadingOverlay className={styles.loadingOverlay} message='Trying to read your location...' />}
    {locationFetchError && <Alert variant='danger'>
      Could not read your current location: {locationFetchError.message}
    </Alert>}
  </div>;
};

const mapStatetoProps = ({ view: { userLocation } }) => ({ userLocation });
export default connect(mapStatetoProps, { setCurrentUserLocation })(memo(GeoLocator));

GeoLocator.defaultProps = {
  className: '',
  label: 'Use my location',
  onStart() {
  },
  onError() {
  },
  onSuccess() {
  },
};

GeoLocator.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onStart: PropTypes.func,
};
