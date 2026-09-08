import React, { memo, useState } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GpsLocationIcon } from '../common/images/icons/gps-location-icon.svg';

import { GEOLOCATOR_OPTIONS, USER_LOCATION_REFRESH_INTERVAL } from '../constants';
import { isGeolocationPermissionDeniedError } from '../utils/location/permission-probe';
import { setCurrentUserLocation } from '../ducks/location';

import LoadingOverlay from '../LoadingOverlay';

import * as styles from './styles.module.scss';

// receivedAt is when the store last received the position, which a running watcher refreshes on every tick
// even when the fix itself is unchanged, so a position counts as fresh while the watcher was still vouching
// for it within one refresh.
const FRESH_POSITION_MAX_AGE = USER_LOCATION_REFRESH_INTERVAL;
// A transient read failure can fall back to the stored position, but only for a few refreshes: past that
// nothing has vouched for it in a while.
const FALLBACK_POSITION_MAX_AGE = USER_LOCATION_REFRESH_INTERVAL * 5;

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

    if (positionAge(userLocation) < FRESH_POSITION_MAX_AGE) {
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

            // A position the watcher was refreshing until recently beats an error when the device can't
            // produce a new one, but a denial must stay visible and a position nothing has vouched for in a
            // while must not silently become the reported location.
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
