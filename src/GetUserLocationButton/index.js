import React, { forwardRef, memo, useState } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GpsLocationIcon } from '../common/images/icons/gps-location-icon.svg';

import { GEOLOCATOR_OPTIONS } from '../constants';
import { setCurrentUserLocation } from '../ducks/location';

import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const GetUserLocationButton = ({ onClick = null, onGet, renderContent = null, ...otherProps }, ref) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'getUserLocationButton' });

  const userLocation = useSelector((state) => state.view.userLocation);

  const [isLoading, setIsLoading] = useState(false);

  const onGetCurrentPositionSuccess = (position) => {
    setIsLoading(false);

    dispatch(setCurrentUserLocation(position));

    onGet(position.coords);
  };

  const onGetCurrentPositionError = (error) => {
    setIsLoading(false);

    toast.error(t('errorToastMessage', { errorMessage: error.message }));
  };

  const onButtonClick = () => {
    setIsLoading(true);

    onClick?.();

    if (userLocation) {
      // If the user location is already available in the store we just return it.
      onGetCurrentPositionSuccess(userLocation);
    } else {
      try {
        // Otherwise, we request it from the navigator.geolocation API.
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

  return <>
    <button
        aria-label={t('userLocationButtonLabel')}
        onClick={onButtonClick}
        ref={ref}
        title={t('userLocationButtonLabel')}
        type="button"
        {...otherProps}
      >
      {renderContent?.() || <GpsLocationIcon />}
    </button>

    {isLoading && <LoadingOverlay className={styles.loadingOverlay} message={t('loadingOverlayMessage')} />}
  </>;
};

export default memo(forwardRef(GetUserLocationButton));
