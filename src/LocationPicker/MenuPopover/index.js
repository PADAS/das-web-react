import React, { forwardRef, useEffect, useRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GpsLocationIcon } from '../../common/images/icons/gps-location-icon.svg';
import { ReactComponent as MarkerFeedIcon } from '../../common/images/icons/marker-feed.svg';

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import { setModalVisibilityState } from '../../ducks/modals';

import GetUserLocationButton from '../../GetUserLocationButton';
import GpsInput from '../../GpsInput';
import PickMapLocationButton from '../../PickMapLocationButton';

import styles from './styles.module.scss';

const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

const MenuPopover = ({
  className,
  id,
  onChange,
  onClose,
  style,
  target,
  value,
  ...otherProps
}, ref) => {
  const dispatch = useDispatch();
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
    }
  };

  const onGpsInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      onClose();
    }
  };

  const onMapLocationPick = (event) => {
    onChange([event.lngLat.lng, event.lngLat.lat]);

    onClose();

    dispatch(setModalVisibilityState(true));
    dispatch(showSideBar());
  };

  const onPickMapLocationCancel = () => {
    dispatch(setModalVisibilityState(true));
    dispatch(showSideBar());
  };

  const onPickMapLocationClick = () => {
    dispatch(setModalVisibilityState(false));
    dispatch(hideSideBar());

    eventReportTracker.track('Click \'Set on map\'');
  };

  const onUserLocationGet = (coordinates) => {
    onChange([coordinates.longitude, coordinates.latitude]);

    onClose();
  };

  // Select the GPS input on mount so user can type away or navigate.
  useEffect(() => {
    gpsInputRef.current.select();
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    const onMouseDown = (event) => !wrapperRef.current.contains(event.target)
      && !target.current.contains(event.target)
      && onClose();

    document.addEventListener('mousedown', onMouseDown);

    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [onClose, target]);

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
        onKeyDown={onGpsInputKeyDown}
        onChange={onChange}
        value={value}
        ref={gpsInputRef}
      />

      <div className={styles.buttons}>
        <PickMapLocationButton
          onCancel={onPickMapLocationCancel}
          onClick={onPickMapLocationClick}
          onPick={onMapLocationPick}
          ref={!showUserLocation ? lastFocusableElementRef : undefined}
          renderContent={() => <>
            <MarkerFeedIcon />

            {t('pickMapLocationButton')}
          </>}
        />

        {!!showUserLocation && <GetUserLocationButton
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
