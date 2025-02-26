import React, { forwardRef, memo, useEffect, useRef, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GpsLocationIcon } from '../common/images/icons/gps-location-icon.svg';

import { setCurrentUserLocation } from '../ducks/location';

import { GEOLOCATOR_OPTIONS } from '../constants';
import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const GetUserLocationButton = ({ onClick = null, onGet, renderContent, ...otherProps }, ref) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'getUserLocationButton' });

  const userLocation = useSelector((state) => state.view.userLocation);

  const clearAlertTimeout = useRef(null);

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const onGetCurrentPositionSuccess = (position) => {
    setIsLoading(false);

    dispatch(setCurrentUserLocation(position));

    onGet(position.coords);
  };

  const onGetCurrentPositionError = (error) => {
    setError(error);
    setIsLoading(false);

    clearAlertTimeout.current = window.setTimeout(() => setError(null), 3500);
  };

  const onButtonClick = () => {
    setError(null);
    setIsLoading(true);

    onClick?.();

    if (userLocation) {
      onGetCurrentPositionSuccess(userLocation);
    } else {
      try {
        window.navigator.geolocation.getCurrentPosition(
          onGetCurrentPositionSuccess,
          onGetCurrentPositionError,
          GEOLOCATOR_OPTIONS
        );
      } catch (error) {
        onGetCurrentPositionError(error);
      }
    }
  };

  useEffect(() => () => {
    // Clear the timeout when component unmounts.
    window.clearTimeout(clearAlertTimeout.current);
  }, []);

  return <>
    <button
        aria-label={t('userLocationButtonLabel')}
        title={t('userLocationButtonLabel')}
        {...otherProps}
        onClick={onButtonClick}
        ref={ref}
        type="button"
      >
      {renderContent?.() || <GpsLocationIcon />}
    </button>

    {isLoading && <LoadingOverlay className={styles.loadingOverlay} message={t('loadingOverlayMessage')} />}

    {error && <Alert variant="danger">{t('errorAlert', { errorMessage: error.message })}</Alert>}
  </>;
};

export default (memo(forwardRef(GetUserLocationButton)));
