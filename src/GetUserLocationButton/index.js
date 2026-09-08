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

// Matches GeoLocationWatcher's refresh cadence.
const FRESH_POSITION_MAX_AGE = 1000 * 60;
// A transient read failure can fall back to the stored fix, but only while it is still plausibly where
// the user is standing.
const FALLBACK_POSITION_MAX_AGE = 1000 * 60 * 5;

const positionAge = (position) => (position?.receivedAt ? Date.now() - position.receivedAt : Infinity);

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

  const onButtonClick = (event) => {
    onClick?.();

    if (isDisabled) {
      // The activation does nothing, so move focus to the button: assistive technology then announces its
      // disabled state and the description explaining why.
      event.currentTarget.focus();

      return;
    }

    if (positionAge(userLocation) < FRESH_POSITION_MAX_AGE) {
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

            // A recent fix beats an error when the device can't produce a new one, but a denial must stay
            // visible and an old fix must not silently become the reported location.
            if (positionAge(userLocation) < FALLBACK_POSITION_MAX_AGE && !isGeolocationPermissionDeniedError(error)) {
              return onGet(userLocation.coords);
            }

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
