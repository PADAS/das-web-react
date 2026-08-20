import { lazy, Suspense, useContext, useEffect, useRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GpsLocationIcon } from '../../common/images/icons/gps-location-icon.svg';
import { ReactComponent as MarkerFeedIcon } from '../../common/images/icons/marker-feed.svg';

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../utils/analytics';

import { MapContext } from '../../MapContext';

import GetUserLocationButton from '../../GetUserLocationButton';
import GpsInput from '../../GpsInput';

const PickMapLocationButton = lazy(() => import('../../PickMapLocationButton'));

import * as styles from './styles.module.scss';

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
