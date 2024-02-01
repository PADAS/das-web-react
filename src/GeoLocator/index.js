import React, { memo, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Alert from 'react-bootstrap/Alert';
import { useTranslation } from 'react-i18next';

import { setCurrentUserLocation } from '../ducks/location';

import { GEOLOCATOR_OPTIONS } from '../constants';
import LoadingOverlay from '../LoadingOverlay';
import { ReactComponent as GpsLocationIcon } from '../common/images/icons/gps-location-icon.svg';

import styles from './styles.module.scss';

const GeoLocator = ({
  className,
  onError,
  onStart,
  onSuccess,
  setCurrentUserLocation,
  userLocation,
  ...restProps
}) => {
  const { t } = useTranslation('details-view', { keyPrefix: 'geoLocator' });
  const { label = t('buttonLabel') } = restProps;
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
    onStart?.();
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
    onError?.(error);
  };

  const onLocationFetchFinish = () => {
    setFetchingLocationState(false);
  };

  return <div className={className}>
    <button title={label} className={styles.button} onClick={startFetchLocation}>
      <GpsLocationIcon />
      <span>{label}</span>
    </button>
    {fetchingLocation && <LoadingOverlay className={styles.loadingOverlay} message={t('loadingMessage')} />}
    {locationFetchError && <Alert variant='danger'>
      {t('readingLocationError', {
        locationErrorMessage: locationFetchError.message
      })}
    </Alert>}
  </div>;
};

const mapStateToProps = ({ view: { userLocation } }) => ({ userLocation });
export default connect(mapStateToProps, { setCurrentUserLocation })(memo(GeoLocator));

GeoLocator.defaultProps = {
  className: '',
  onStart: null,
  onError: null,
  onSuccess() {
  },
};

GeoLocator.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onStart: PropTypes.func,
  label: PropTypes.string,
};
