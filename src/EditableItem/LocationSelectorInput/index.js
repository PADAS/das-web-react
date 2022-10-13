import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import debounceRender from 'react-debounce-render';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as LocationIcon } from '../../common/images/icons/marker-feed.svg';

import { calcGpsDisplayString } from '../../utils/location';
import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import { MapContext } from '../../App';
import { setModalVisibilityState } from '../../ducks/modals';

import GpsInput from '../../GpsInput';
import MapLocationPicker from '../../MapLocationPicker';
import GeoLocator from '../../GeoLocator';
import TextCopyBtn from '../../TextCopyBtn';

import styles from './styles.module.scss';

const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

const calculateInputDisplayString = (location, gpsFormat) => {
  return location
    ? calcGpsDisplayString(location[1], location[0], gpsFormat)
    : 'Click here to set location';
};

const LocationSelectorInput = ({
  className,
  copyable = true,
  label,
  location,
  onLocationChange,
  placeholder,
  popoverClassName,
}) => {
  const dispatch = useDispatch();

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);
  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);

  const map = useContext(MapContext);

  const locationInputAnchorRef = useRef(null);
  const locationInputLabelRef = useRef(null);
  const popoverContentRef = useRef(null);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const displayString = calculateInputDisplayString(location, gpsFormat);

  const popoverClassString = popoverClassName ? `${styles.gpsPopover} ${popoverClassName}` : styles.gpsPopover;
  const shouldShowCopyButton = copyable && (displayString !== placeholder);

  // Point locations
  const showUserLocation = useSelector((state) => state.view.showUserLocation);

  const onLocationSelectStart = useCallback(() => {
    dispatch(setModalVisibilityState(false));
    dispatch(hideSideBar());

    eventReportTracker.track('Click set location to add report point');
  }, [dispatch]);

  const onLocationSelectCancel = useCallback(() => {
    dispatch(setModalVisibilityState(true));
    dispatch(showSideBar());
  }, [dispatch]);

  const onLocationSelect = useCallback((event) => {
    onLocationChange([event.lngLat.lng, event.lngLat.lat]);
    setIsPopoverOpen(false);

    dispatch(setModalVisibilityState(true));
    dispatch(showSideBar());
  }, [dispatch, onLocationChange]);

  const onGeoLocationStart = useCallback(() => eventReportTracker.track('Click \'Use My Location\''), []);

  const onGeoLocationSuccess = useCallback((coords) => {
    onLocationChange([coords.longitude, coords.latitude]);
    setIsPopoverOpen(false);

    dispatch(setModalVisibilityState(true));
  }, [dispatch, onLocationChange]);

  const onGpsInputKeydown = useCallback((event) => {
    if (event.key === 'Enter') {
      setIsPopoverOpen(false);
    }
  }, []);

  // Global
  const onClickLocationControl = useCallback(() => {
    setIsPopoverOpen(!isPopoverOpen);
  }, [isPopoverOpen]);

  const onLabelKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && isPopoverOpen) {
      setIsPopoverOpen(false);
    }
  }, [isPopoverOpen]);

  const stopEventBubbling = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onHidePopover = useCallback(() => {
    if (!isPickingLocation) {
      setIsPopoverOpen(false);
    }
  }, [isPickingLocation]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!!popoverContentRef.current && !popoverContentRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return <label
    className={`${styles.locationSelectionLabel} ${className}`}
    onClick={stopEventBubbling}
    onKeyDown={onLabelKeyDown}
    ref={locationInputLabelRef}
    >
    {!!label && <span data-testid="locationSelectorInput-label">{label}</span>}

    <div
      className={`${styles.locationAnchor} ${!!location ? '' : 'empty'}`}
      data-testid="set-location-button"
      onClick={onClickLocationControl}
      ref={locationInputAnchorRef}
    >

      <LocationIcon className={styles.icon} />
      <span className={styles.displayString}>{displayString}</span>
      {shouldShowCopyButton && <TextCopyBtn className={styles.locationCopyBtn} text={displayString} />}
    </div>

    <Overlay
      container={locationInputLabelRef.current}
      onHide={onHidePopover}
      placement='bottom'
      rootClose
      shouldUpdatePosition={true}
      show={isPopoverOpen}
      target={locationInputAnchorRef.current}
    >
      <Popover placement='bottom' className={popoverClassString}>
        {isPopoverOpen && <div className={styles.popoverContent} ref={popoverContentRef}>
          <>
            <GpsInput onValidChange={onLocationChange} lngLat={location} onKeyDown={onGpsInputKeydown} />
            <div className={styles.locationButtons}>
              <MapLocationPicker
                  map={map}
                  onLocationSelectStart={onLocationSelectStart}
                  onLocationSelectCancel={onLocationSelectCancel}
                  onLocationSelect={onLocationSelect}
                />
              {!!showUserLocation && <GeoLocator
                  className={styles.geoLocator}
                  onStart={onGeoLocationStart}
                  onSuccess={onGeoLocationSuccess}
                />}
            </div>
          </>

        </div>}
      </Popover>
    </Overlay>
  </label>;
};

export default debounceRender(memo(LocationSelectorInput));

LocationSelectorInput.defaultProps = {
  className: '',
  copyable: true,
  label: 'Location:',
  location: null,
  placeholder: null,
  popoverClassName: '',
};

LocationSelectorInput.propTypes = {
  className: PropTypes.string,
  copyable: PropTypes.bool,
  label: PropTypes.string,
  location: PropTypes.arrayOf(PropTypes.number),
  onLocationChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  popoverClassName: PropTypes.string,
};
