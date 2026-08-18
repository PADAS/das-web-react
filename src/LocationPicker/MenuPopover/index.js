import { lazy, Suspense, useContext, useEffect, useId, useRef, useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GpsLocationIcon } from '../../common/images/icons/gps-location-icon.svg';
import { ReactComponent as MarkerFeedIcon } from '../../common/images/icons/marker-feed.svg';

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { GEOLOCATION_PERMISSION_PROBE_RESULTS, probeGeolocationPermission } from '../../utils/location/permission-probe';

import { MapContext } from '../../MapContext';

import GetUserLocationButton from '../../GetUserLocationButton';
import GpsInput from '../../GpsInput';

const PickMapLocationButton = lazy(() => import('../../PickMapLocationButton'));

import * as styles from './styles.module.scss';

const DENIED_STATE = 'denied';
const MAX_POPOVER_WIDTH = 380;
const MIN_POPOVER_WIDTH = 280;

// TODO: This is a common component and its events shouldn't be linked to the event report track category.
const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

const MenuPopover = ({
  className,
  onBlur,
  onChange,
  onClose,
  ref,
  setLocationButtonRef,
  style,
  target,
  value,
  ...otherProps
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'locationPicker.menuPopover' });

  const map = useContext(MapContext);

  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);
  const showUserLocation = useSelector((state) => state.view.showUserLocation);

  const gpsFormatToggleRef = useRef();
  const gpsInputRef = useRef();
  const lastFocusableElementRef = useRef();
  // Set the popover width equal to the location picker's width if it's between the min and max boundaries and store it
  // in a ref so it doesn't change.
  const popoverWidthRef = useRef(
    Math.min(MAX_POPOVER_WIDTH, Math.max(MIN_POPOVER_WIDTH, target.current?.offsetWidth))
  );
  const wrapperRef = useRef();

  const permissionBlockedMessageId = useId();

  const [isLocationPermissionDenied, setIsLocationPermissionDenied] = useState(false);

  const onWrapperKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      onClose();

      setLocationButtonRef.current.focus();
    }
  };

  const onGpsInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      onClose();

      setLocationButtonRef.current.focus();
    }
  };

  const onMapLocationPick = (event) => {
    onChange({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });

    onClose();

    setLocationButtonRef.current.focus();
  };

  const onUserLocationGet = (coordinates) => {
    onChange({ latitude: coordinates.latitude, longitude: coordinates.longitude });

    onClose();

    setLocationButtonRef.current.focus();
  };

  useEffect(() => {
    // Select the GPS input on mount so user can type away or navigate.
    gpsInputRef.current.select();
  }, []);

  useEffect(() => {
    // The message explains why the "use my location" button won't work, so it's pointless without that button.
    if (!showUserLocation) return;

    let isListening = true;

    // Without the Permissions API there's nothing to subscribe to, so a denial arriving after this
    // resolves only surfaces on the next page load.
    const probePermission = () => probeGeolocationPermission().then((result) => {
      if (!isListening) return;

      setIsLocationPermissionDenied(result === GEOLOCATION_PERMISSION_PROBE_RESULTS.DENIED);
    });

    if (window.navigator.permissions?.query) {
      let permissionStatus;

      const onPermissionStateChange = (event) => setIsLocationPermissionDenied(event.target.state === DENIED_STATE);

      window.navigator.permissions.query({ name: 'geolocation' })
        .then((status) => {
          if (!isListening) return;

          permissionStatus = status;

          setIsLocationPermissionDenied(status.state === DENIED_STATE);

          status.addEventListener('change', onPermissionStateChange);
        })
        // Browsers that don't know the geolocation permission name reject the query, leaving the probe as
        // the only way to tell whether it's blocked.
        .catch(probePermission);

      return () => {
        isListening = false;

        permissionStatus?.removeEventListener('change', onPermissionStateChange);
      };
    }

    probePermission();

    return () => {
      isListening = false;
    };
  }, [showUserLocation]);

  useEffect(() => {
    // Create a focus trap while the component is mounted so only internal elements are focused when pressing tab only
    // if the user is not picking a location from the map.
    if (!isPickingLocation) {
      const onKeyDown = (event) => {
        if (event.key === 'Tab') {
          const lastFocusableElement = lastFocusableElementRef.current || gpsInputRef.current;
          if (event.shiftKey && document.activeElement === gpsFormatToggleRef.current) {
            event.preventDefault();

            lastFocusableElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
            event.preventDefault();

            gpsFormatToggleRef.current.focus();
          }
        }
      };

      document.addEventListener('keydown', onKeyDown);

      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [isPickingLocation]);

  useEffect(() => {
    // Add a pointer down event to close the menu if the user clicks outside only if the user is not picking a location
    // from the map.
    if (!isPickingLocation) {
      const onPointerDown = (event) => {
        if (!wrapperRef.current.contains(event.target) && !setLocationButtonRef.current.contains(event.target)) {
          onClose(event);

          if (onBlur && !target.current.contains(event.target)) {
            // Clicking away from our picker when the menu is open doesn't trigger the wrapper's blur event, so we need
            // to trigger the onBlur callback manually.
            const blurEvent = new FocusEvent('blur', {
              bubbles: true,
              cancelable: false,
              relatedTarget: event.target,
            });

            Object.defineProperties(blurEvent, {
              target: {
                value: target.current,
              },
            });

            onBlur(blurEvent);
          }
        }
      };

      document.addEventListener('pointerdown', onPointerDown);

      return () => document.removeEventListener('pointerdown', onPointerDown);
    }
  }, [isPickingLocation, onBlur, onClose, setLocationButtonRef, target]);

  return <Popover
      aria-label={t('dialogLabel')}
      className={`${className} ${styles.menuPopover}`}
      ref={ref}
      role="dialog"
      style={{ ...style, minWidth: popoverWidthRef.current, width: popoverWidthRef.current }}
      {...otherProps}
    >
    <div className={styles.wrapper} onKeyDown={isPickingLocation ? undefined : onWrapperKeyDown} ref={wrapperRef}>
      <GpsInput
        gpsFormatToggleRef={gpsFormatToggleRef}
        inputRef={gpsInputRef}
        onKeyDown={isPickingLocation ? undefined : onGpsInputKeyDown}
        onChange={onChange}
        value={value}
      />

      {showUserLocation && isLocationPermissionDenied && <p
        className={styles.permissionBlockedMessage}
        id={permissionBlockedMessageId}
        role="status"
      >
        {t('permissionBlockedMessage')}
      </p>}

      <div className={styles.buttons}>
        {map && (
          <Suspense fallback={null}>
            <PickMapLocationButton
              onClick={() => eventReportTracker.track('Click \'Set on map\'')}
              onPick={onMapLocationPick}
              ref={!showUserLocation ? lastFocusableElementRef : undefined}
              renderContent={() => <>
                <MarkerFeedIcon />

                {t('pickMapLocationButton')}
              </>}
            />
          </Suspense>
        )}

        {showUserLocation && <GetUserLocationButton
          aria-describedby={isLocationPermissionDenied ? permissionBlockedMessageId : undefined}
          isDisabled={isLocationPermissionDenied}
          onClick={() => eventReportTracker.track('Click \'Use my location\'')}
          onGet={onUserLocationGet}
          ref={lastFocusableElementRef}
          renderContent={() => <>
            <GpsLocationIcon />

            {t('getUserLocationButton')}
          </>}
        />}
      </div>
    </div>
  </Popover>;
};

export default MenuPopover;
