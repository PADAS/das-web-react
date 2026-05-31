import React, { memo, useState } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GpsLocationIcon } from '../common/images/icons/gps-location-icon.svg';

import { GEOLOCATOR_OPTIONS } from '../constants';
import { setCurrentUserLocation } from '../ducks/location';

import LoadingOverlay from '../LoadingOverlay';

import * as styles from './styles.module.scss';

const GetUserLocationButton = ({ onClick = null, onError = null, onGet, ref, renderContent = null, ...otherProps }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'getUserLocationButton' });

  const userLocation = useSelector((state) => state.view.userLocation);

  const [isLoading, setIsLoading] = useState(false);

  const reportError = (error) => (onError
    ? onError(error)
    : toast.error(t('errorToastMessage', { errorMessage: error.message })));

  const onButtonClick = () => {
    onClick?.();

    if (userLocation) {
      // If the user location is already available in the store we just return it.
      onGet(userLocation.coords);
    } else {
      setIsLoading(true);

      try {
        // Request the location from the navigator.geolocation API.
        window.navigator.geolocation.getCurrentPosition(
          (position) => {
            setIsLoading(false);

            dispatch(setCurrentUserLocation(position));
            onGet(position.coords);
          },
          (error) => {
            setIsLoading(false);

            reportError(error);
          },
          GEOLOCATOR_OPTIONS
        );
      } catch (error) {
        setIsLoading(false);

        reportError(error);
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
      {renderContent?.() || <GpsLocationIcon data-testid="gps-location-icon" />}
    </button>

    {isLoading && <LoadingOverlay className={styles.loadingOverlay} message={t('loadingOverlayMessage')} />}
  </>;
};

export default memo(GetUserLocationButton);
