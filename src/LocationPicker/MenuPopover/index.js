import React, { forwardRef, useEffect, useRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GpsLocationIcon } from '../../common/images/icons/gps-location-icon.svg';
import { ReactComponent as MarkerFeedIcon } from '../../common/images/icons/marker-feed.svg';

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../utils/analytics';

import GetUserLocationButton from '../../GetUserLocationButton';
import GpsInput from '../../GpsInput';
import PickMapLocationButton from '../../PickMapLocationButton';

import styles from './styles.module.scss';

// TODO: This is a common component and its events shouldn't be linked to the event report track category.
const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

const MenuPopover = ({
  className,
  id,
  onChange,
  onClose,
  setLocationButtonRef,
  style,
  target,
  value,
  ...otherProps
}, ref) => {
  const { t } = useTranslation('components', { keyPrefix: 'locationPicker.menuPopover' });

  const showUserLocation = useSelector((state) => state.view.showUserLocation);

  const firstFocusableElementRef = useRef();
  const gpsInputRef = useRef();
  const lastFocusableElementRef = useRef();
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
    onChange([event.lngLat.lng, event.lngLat.lat]);

    onClose();

    setLocationButtonRef.current.focus();
  };

  const onUserLocationGet = (coordinates) => {
    onChange([coordinates.longitude, coordinates.latitude]);

    onClose();

    setLocationButtonRef.current.focus();
  };

  useEffect(() => {
    // Select the GPS input on mount so user can type away or navigate.
    gpsInputRef.current.select();
  }, []);

  useEffect(() => {
    // Create a focus trap while the component is mounted so only internal elements are focused when pressing tab.
    const onKeyDown = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === firstFocusableElementRef.current) {
          event.preventDefault();

          lastFocusableElementRef.current.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusableElementRef.current) {
          event.preventDefault();

          firstFocusableElementRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return <Popover
      className={`${className} ${styles.menuPopover}`}
      id={`${id}-menuPopover`}
      ref={ref}
      role="presentation"
      style={{ ...style, minWidth: target.current?.offsetWidth, width: target.current?.offsetWidth }}
      {...otherProps}
    >
    <div className={styles.wrapper} onKeyDown={onWrapperKeyDown} ref={wrapperRef}>
      <GpsInput
        gpsFormatToggleRef={firstFocusableElementRef}
        id={`${id}-menuPopover-gpsInput`}
        inputRef={gpsInputRef}
        onKeyDown={onGpsInputKeyDown}
        onChange={onChange}
        value={value}
      />

      <div className={styles.buttons}>
        <PickMapLocationButton
          // onClick={() => eventReportTracker.track('Click \'Set on map\'')}
          onPick={onMapLocationPick}
          ref={!showUserLocation ? lastFocusableElementRef : undefined}
          renderContent={() => <>
            <MarkerFeedIcon />

            {t('pickMapLocationButton')}
          </>}
        />

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

export default forwardRef(MenuPopover);
