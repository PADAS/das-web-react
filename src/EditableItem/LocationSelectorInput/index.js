import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
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

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);
  const showUserLocation = useSelector((state) => state.view.showUserLocation);

  const gpsInputAnchorRef = useRef(null);
  const gpsInputLabelRef = useRef(null);
  const popoverContentRef = useRef(null);

  const [isGpsPopoverOpen, setIsGpsPopoverOpenState] = useState(false);

  const displayString = location ? calcGpsDisplayString(location[1], location[0], gpsFormat) : placeholder;
  const popoverClassString = ENABLE_EVENT_GEOMETRY
    ? popoverClassName ? `${styles.newGpsPopover} ${popoverClassName}` : styles.newGpsPopover
    : popoverClassName ? `${styles.gpsPopover} ${popoverClassName}` : styles.gpsPopover;
  const shouldShowCopyButton = copyable && (displayString !== placeholder);

  const hideGpsPopover = useCallback(() => setIsGpsPopoverOpenState(false), []);

  const onClickLocation = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsGpsPopoverOpenState(!isGpsPopoverOpen);
  }, [isGpsPopoverOpen]);

  const onLocationSelectFromMapStart = useCallback(() => {
    dispatch(setModalVisibilityState(false));
    dispatch(hideSideBar());
  }, [dispatch]);

  const onLocationSelectFromMapCancel = useCallback(() => {
    dispatch(setModalVisibilityState(true));
    dispatch(showSideBar());
  }, [dispatch]);

  const onGeoLocationStart = useCallback(() => {
    eventReportTracker.track('Click \'Use My Location\'');
  }, []);

  const onGeoLocationSuccess = useCallback((coords) => {
    onLocationChange([coords.longitude, coords.latitude]);
    hideGpsPopover();

    dispatch(setModalVisibilityState(true));
  }, [dispatch, hideGpsPopover, onLocationChange]);

  const onLocationSelectFromMap = useCallback((event) => {
    onLocationChange([event.lngLat.lng, event.lngLat.lat]);
    hideGpsPopover();

    dispatch(setModalVisibilityState(true));
    dispatch(showSideBar());
  }, [dispatch, hideGpsPopover, onLocationChange]);

  const handleEscapePress = useCallback((event) => {
    if (event.key === 'Escape' && isGpsPopoverOpen) {
      event.preventDefault();
      event.stopPropagation();

      hideGpsPopover();
    }
  }, [isGpsPopoverOpen, hideGpsPopover]);

  const handleGpsInputKeydown = useCallback((event) => {
    if (event.key === 'Enter') {
      hideGpsPopover();
    }
  }, [hideGpsPopover]);

  const stopEventBubbling = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!!popoverContentRef.current && !popoverContentRef.current.contains(event.target)) {
        hideGpsPopover();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [hideGpsPopover]);

  return <label
    className={`${styles.locationSelectionLabel} ${className}`}
    onClick={stopEventBubbling}
    onKeyDown={handleEscapePress}
    ref={gpsInputLabelRef}
    >
    {!!label && <span data-testid="locationSelectorInput-label">{label}</span>}

    <div
      className={`${styles.locationAnchor} ${!!location ? '' : 'empty'}`}
      data-testid={'set-location-button'}
      onClick={onClickLocation}
      ref={gpsInputAnchorRef}
    >
      <LocationIcon className={styles.icon} />
      <span style={!location ? { marginRight: 'auto' } : {}}>{displayString}</span>
      {shouldShowCopyButton && <TextCopyBtn className={styles.locationCopyBtn} text={displayString} />}
    </div>

    <Overlay
      container={gpsInputLabelRef.current}
      onHide={hideGpsPopover}
      placement="bottom"
      rootClose
      shouldUpdatePosition={true}
      show={isGpsPopoverOpen}
      target={gpsInputAnchorRef.current}
    >
      {ENABLE_EVENT_GEOMETRY
        ? <Popover className={popoverClassString}>
          <Tabs className={styles.locationTabs} defaultActiveKey="area">
            <Tab eventKey="area" title="Area">
              <div className={styles.locationAreaContent}>
                <Button className={styles.createAreaButton} onClick={() => {}} type="button">
                  <PolygonIcon />
                  Create report area
                </Button>
              </div>
            </Tab>

            <Tab eventKey="point" title="Point">
              <GpsInput onValidChange={onLocationChange} lngLat={location} onKeyDown={handleGpsInputKeydown} />
              <div className={styles.locationButtons}>
                <MapLocationPicker
                  map={map}
                  onLocationSelectStart={onLocationSelectFromMapStart}
                  onLocationSelectCancel={onLocationSelectFromMapCancel}
                  onLocationSelect={onLocationSelectFromMap}
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
        {isGpsPopoverOpen && <div ref={popoverContentRef}>
          <GpsInput onValidChange={onLocationChange} lngLat={location} onKeyDown={handleGpsInputKeydown} />
          <div className={styles.locationButtons}>
            <MapLocationPicker
              map={map}
              onLocationSelectStart={onLocationSelectFromMapStart}
              onLocationSelectCancel={onLocationSelectFromMapCancel}
              onLocationSelect={onLocationSelectFromMap}
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
  location: PropTypes.arrayOf(PropTypes.string),
  map: PropTypes.object.isRequired,
  onLocationChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  popoverClassName: PropTypes.string,
};
