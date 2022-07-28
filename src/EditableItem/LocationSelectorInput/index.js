import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import debounceRender from 'react-debounce-render';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import { ReactComponent as LocationIcon } from '../../common/images/icons/marker-feed.svg';
import { ReactComponent as PolygonIcon } from '../../common/images/icons/polygon.svg';

import { calcGpsDisplayString } from '../../utils/location';
import { DEVELOPMENT_FEATURE_FLAGS } from '../../constants';
import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import { MapContext } from '../../App';
import { setModalVisibilityState } from '../../ducks/modals';

import GpsInput from '../../GpsInput';
import MapAreaPicker from '../../MapAreaPicker';
import MapLocationPicker from '../../MapLocationPicker';
import GeoLocator from '../../GeoLocator';
import TextCopyBtn from '../../TextCopyBtn';

import styles from './styles.module.scss';

const { ENABLE_EVENT_GEOMETRY } = DEVELOPMENT_FEATURE_FLAGS;

const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

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

  const map = useContext(MapContext);

  const locationInputAnchorRef = useRef(null);
  const locationInputLabelRef = useRef(null);
  const popoverContentRef = useRef(null);

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const displayString = location ? calcGpsDisplayString(location[1], location[0], gpsFormat) : placeholder;
  const popoverClassString = ENABLE_EVENT_GEOMETRY
    ? popoverClassName ? `${styles.newGpsPopover} ${popoverClassName}` : styles.newGpsPopover
    : popoverClassName ? `${styles.gpsPopover} ${popoverClassName}` : styles.gpsPopover;
  const shouldShowCopyButton = copyable && (displayString !== placeholder);

  const onClickLocation = useCallback(() => setIsPopoverOpen(!isPopoverOpen), [isPopoverOpen]);

  const onHidePopover = useCallback(() => setIsPopoverOpen(false), []);

  const onLabelKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && isPopoverOpen) {
      setIsPopoverOpen(false);
    }
  }, [isPopoverOpen]);

  const stopEventBubbling = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!!popoverContentRef.current && !popoverContentRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Area
  const onAreaSelectStart = useCallback(() => {
    dispatch(setModalVisibilityState(false));
    dispatch(hideSideBar());
  }, [dispatch]);

  const onAreaSelectCancel = useCallback(() => {
    dispatch(setModalVisibilityState(true));
    dispatch(showSideBar());
  }, [dispatch]);

  // Location
  const showUserLocation = useSelector((state) => state.view.showUserLocation);

  const onLocationSelectStart = useCallback(() => {
    dispatch(setModalVisibilityState(false));
    dispatch(hideSideBar());
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
      onClick={onClickLocation}
      ref={locationInputAnchorRef}
    >
      <LocationIcon className={styles.icon} />
      <span style={!location ? { marginRight: 'auto' } : {}}>{displayString}</span>
      {shouldShowCopyButton && <TextCopyBtn className={styles.locationCopyBtn} text={displayString} />}
    </div>

    <Overlay
      container={locationInputLabelRef.current}
      onHide={onHidePopover}
      placement="bottom"
      rootClose
      shouldUpdatePosition={true}
      show={isPopoverOpen}
      target={locationInputAnchorRef.current}
    >
      {ENABLE_EVENT_GEOMETRY
        ? <Popover className={popoverClassString}>
          <Tabs className={styles.locationTabs} defaultActiveKey="area">
            <Tab eventKey="area" title="Area">
              <div className={styles.locationAreaContent}>
                <MapAreaPicker
                  className={styles.createAreaButton}
                  onAreaSelectCancel={onAreaSelectCancel}
                  onAreaSelectStart={onAreaSelectStart}
                >
                  <PolygonIcon />
                  Create report area
                </MapAreaPicker>
              </div>
            </Tab>

            <Tab eventKey="point" title="Point">
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
            </Tab>
          </Tabs>
        </Popover>
      : <Popover placement='bottom' className={popoverClassString}>
        {isPopoverOpen && <div ref={popoverContentRef}>
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
        </div>}
      </Popover>}
    </Overlay>
  </label>;
};

export default debounceRender(memo(LocationSelectorInput));

LocationSelectorInput.defaultProps = {
  className: '',
  copyable: true,
  label: 'Location:',
  location: null,
  placeholder: 'Click here to set location',
  popoverClassName: '',
};

LocationSelectorInput.propTypes = {
  className: PropTypes.string,
  copyable: PropTypes.bool,
  label: PropTypes.string,
  location: PropTypes.arrayOf(PropTypes.number),
  map: PropTypes.object.isRequired,
  onLocationChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  popoverClassName: PropTypes.string,
};
