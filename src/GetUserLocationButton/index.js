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

  const isUserLocationWatched = useSelector((state) => state.view.userLocationAccessGranted?.granted);
  const userLocation = useSelector((state) => state.view.userLocation);

  const [isLoading, setIsLoading] = useState(false);

  const reportError = (error) => {
    const isPermissionDenied = isGeolocationPermissionDeniedError(error);

    if (isPermissionDenied) onPermissionDenied?.();

    if (onError) return onError(error);

    // A parent that handles the denial shows the reason inline next to the button, so a toast would only
    // repeat it.
    if (isPermissionDenied && onPermissionDenied) return;

    toast.error(t('errorToastMessage', { errorMessage: error.message }));
  };

  const onButtonClick = (event) => {
    onClick?.();

    if (isDisabled) {
      // The activation does nothing, so move focus to the button: assistive technology then announces its
      // disabled state and the description explaining why.
      event.currentTarget.focus();

      return;
    }

    // A live watch is what makes the stored position current: had the user moved, it would have fired. Without
    // one, a position an earlier click left in the store says nothing about where the user is now.
    if (isUserLocationWatched && userLocation) {
      onGet(userLocation.coords);
    } else {
      setIsLoading(true);

      try {
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
