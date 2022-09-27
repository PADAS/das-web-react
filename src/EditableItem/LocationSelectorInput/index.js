import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import area from '@turf/area';
import { convertArea } from '@turf/helpers';
import debounceRender from 'react-debounce-render';
import length from '@turf/length';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as LocationIcon } from '../../common/images/icons/marker-feed.svg';
import { ReactComponent as PolygonIcon } from '../../common/images/icons/polygon.svg';

import { calcGpsDisplayString } from '../../utils/location';
import { DEVELOPMENT_FEATURE_FLAGS, VALID_EVENT_GEOMETRY_TYPES } from '../../constants';
import { EVENT_REPORT_CATEGORY, MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import { MapContext } from '../../App';
import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { MAP_LOCATION_SELECTION_MODES, setIsPickingLocation } from '../../ducks/map-ui';
import { setModalVisibilityState } from '../../ducks/modals';
import { truncateFloatingNumber } from '../../utils/math';

import GeometryPreview from './GeometryPreview';
import GpsInput from '../../GpsInput';
import MapLocationPicker from '../../MapLocationPicker';
import GeoLocator from '../../GeoLocator';
import TextCopyBtn from '../../TextCopyBtn';

import styles from './styles.module.scss';

const { ENABLE_EVENT_GEOMETRY } = DEVELOPMENT_FEATURE_FLAGS;

const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);
const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const calculateInputDisplayString = (event, gpsFormat, location, placeholder, geometryType) => {
  if (!!event?.geometry) {
    const geometryArea = convertArea(area(event.geometry), 'meters', 'kilometers');
    const geometryAreaTruncated = truncateFloatingNumber(geometryArea, 2);
    const geometryPerimeterTruncated = truncateFloatingNumber(length(event.geometry), 2);
    return `${geometryAreaTruncated} km² area, ${geometryPerimeterTruncated} km perimeter`;
  } else if (location) {
    return calcGpsDisplayString(location[1], location[0], gpsFormat);
  } else if (!placeholder && geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON) {
    return 'Set report area';
  } else if (!placeholder) {
    return 'Click here to set location';
  }
  return placeholder;
};

const LocationSelectorInput = ({
  className,
  copyable = true,
  geometryType,
  label,
  location,
  onGeometryChange,
  onLocationChange,
  placeholder,
  popoverClassName,
}) => {
  const dispatch = useDispatch();

  const event = useSelector((state) => state.view.mapLocationSelection.event);
  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);
  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);

  const map = useContext(MapContext);
  const { mapDrawingData, setMapDrawingData } = useContext(MapDrawingToolsContext);

  const locationInputAnchorRef = useRef(null);
  const locationInputLabelRef = useRef(null);
  const popoverContentRef = useRef(null);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const displayString = calculateInputDisplayString(event, gpsFormat, location, placeholder, geometryType);

  const popoverClassString = ENABLE_EVENT_GEOMETRY
    ? popoverClassName ? `${styles.newGpsPopover} ${popoverClassName}` : styles.newGpsPopover
    : popoverClassName ? `${styles.gpsPopover} ${popoverClassName}` : styles.gpsPopover;
  const shouldShowCopyButton = copyable && (displayString !== placeholder);

  // Geometries
  const isDrawingEventGeometry = useSelector((state) => state.view.mapLocationSelection.isPickingLocation
    && state.view.mapLocationSelection.mode === MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY);

  const onAreaSelectStart = useCallback(() => {
    dispatch(setIsPickingLocation(true, MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY));

    mapInteractionTracker.track('Geometry selection on map started');
  }, [dispatch]);

  const onDeleteArea = useCallback(() => {
    setMapDrawingData(null);
    onGeometryChange?.(null);
    setIsPopoverOpen(false);
  }, [onGeometryChange, setMapDrawingData]);

  useEffect(() => {
    dispatch(setModalVisibilityState(!isDrawingEventGeometry));
    dispatch(isDrawingEventGeometry ? hideSideBar() : showSideBar());
  }, [dispatch, isDrawingEventGeometry]);

  useEffect(() => {
    if (!isPickingLocation && mapDrawingData) {
      onGeometryChange?.(mapDrawingData.fillPolygon);
      setMapDrawingData(null);
    }
  }, [isPickingLocation, mapDrawingData, onGeometryChange, setMapDrawingData]);

  // Point locations
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

  // Global
  const onClickLocationControl = useCallback(() => {
    if (geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON && !event?.geometry) {
      onAreaSelectStart();
    } else {
      setIsPopoverOpen(!isPopoverOpen);
    }
  }, [event?.geometry, geometryType, isPopoverOpen, onAreaSelectStart]);

  const onHidePopover = useCallback(() => {
    if (!isPickingLocation && !mapDrawingData) {
      setIsPopoverOpen(false);
    }
  }, [isPickingLocation, mapDrawingData]);

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
      {geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON
        ? <PolygonIcon className={styles.icon} />
        : <LocationIcon className={styles.icon} />}
      <span className={styles.displayString}>{displayString}</span>
      {shouldShowCopyButton && <TextCopyBtn className={styles.locationCopyBtn} text={displayString} />}
    </div>

    <Overlay
      container={locationInputLabelRef.current}
      onHide={onHidePopover}
      placement={ENABLE_EVENT_GEOMETRY ? 'auto' : 'bottom'}
      rootClose
      shouldUpdatePosition={true}
      show={isPopoverOpen}
      target={locationInputAnchorRef.current}
    >
      <Popover placement='bottom' className={popoverClassString}>
        {isPopoverOpen && <div className={styles.popoverContent} ref={popoverContentRef}>
          {geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON ?
            <GeometryPreview onAreaSelectStart={onAreaSelectStart} onDeleteArea={onDeleteArea} />
            : <>
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
          }
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
  onGeometryChange: null,
  placeholder: null,
  popoverClassName: '',
};

LocationSelectorInput.propTypes = {
  className: PropTypes.string,
  copyable: PropTypes.bool,
  label: PropTypes.string,
  location: PropTypes.arrayOf(PropTypes.number),
  onGeometryChange: PropTypes.func,
  onLocationChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  popoverClassName: PropTypes.string,
};
