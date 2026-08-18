import React, { memo, useState } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GpsLocationIcon } from '../common/images/icons/gps-location-icon.svg';

import { GEOLOCATOR_OPTIONS } from '../constants';
import { isGeolocationPermissionDeniedError } from '../utils/location/permission-probe';
import { setCurrentUserLocation } from '../ducks/location';

import LoadingOverlay from '../LoadingOverlay';

import * as styles from './styles.module.scss';

const GetUserLocationButton = ({
  className = '',
  isDisabled = false,
  onClick = null,
  onError = null,
  onGet,
  onPermissionDenied = null,
  ref,
  renderContent = null,
  ...otherProps
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'getUserLocationButton' });

  const userLocation = useSelector((state) => state.view.userLocation);

  const [isLoading, setIsLoading] = useState(false);

  const reportError = (error) => {
    const isPermissionDenied = isGeolocationPermissionDeniedError(error);

    if (isPermissionDenied) onPermissionDenied?.();

    if (onError) return onError(error);

    // A blocked permission is already surfaced inline next to the button, a toast would just repeat it.
    if (isPermissionDenied) return;

    toast.error(t('errorToastMessage', { errorMessage: error.message }));
  };

  const onButtonClick = () => {
    if (isDisabled) return;

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
        // The button takes part in the location picker's focus trap, so it must stay focusable while blocked.
        aria-disabled={isDisabled || undefined}
        aria-label={t('userLocationButtonLabel')}
        className={`${className} ${isDisabled ? styles.ghosted : ''}`.trim()}
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
