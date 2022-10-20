import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';

import debounceRender from 'react-debounce-render';

import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as PolygonIcon } from '../../common/images/icons/polygon.svg';

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { MAP_LOCATION_SELECTION_MODES, setIsPickingLocation } from '../../ducks/map-ui';
import { setModalVisibilityState } from '../../ducks/modals';
import { useEventGeoMeasurementDisplayStrings } from '../../hooks/geometry';

import GeometryPreview from '../GeometryPreview';
import TextCopyBtn from '../../TextCopyBtn';

import styles from './styles.module.scss';

const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

const INPUT_PLACEHOLDER = 'Set report area';

const AreaSelectorInput = ({
  onGeometryChange,
  event,
  originalEvent,
}) => {
  const dispatch = useDispatch();

  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);
  const { mapDrawingData, setMapDrawingData } = useContext(MapDrawingToolsContext);

  const locationInputAnchorRef = useRef(null);
  const locationInputLabelRef = useRef(null);
  const popoverContentRef = useRef(null);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [perimeterDisplayString, areaDisplayString] = useEventGeoMeasurementDisplayStrings(event, originalEvent);

  const displayString = event?.geometry
    ? `${areaDisplayString} area, ${perimeterDisplayString} perimeter`
    : INPUT_PLACEHOLDER;

  const shouldShowCopyButton = displayString !== INPUT_PLACEHOLDER;

  const isDrawingEventGeometry = useSelector((state) => isPickingLocation
    && state.view.mapLocationSelection.mode === MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY);

  const onAreaSelectStart = useCallback(() => {
    dispatch(setIsPickingLocation(true, MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY));

    if (!event?.geometry) {
      eventReportTracker.track('Click set area to add area to report');
    } else if (event?.geometry?.properties?.provenance === 'desktop') {
      eventReportTracker.track('Edit an event geometry generated in ER Web');
    } else if (event?.geometry?.properties?.provenance === 'mobile') {
      eventReportTracker.track('Edit an event geometry generated in ER Mobile');
    }
  }, [dispatch, event?.geometry]);

  const onDeleteArea = useCallback(() => {
    setMapDrawingData(null);
    onGeometryChange(null);
    setIsPopoverOpen(false);

    eventReportTracker.track('Area deleted');
  }, [onGeometryChange, setMapDrawingData]);

  useEffect(() => {
    dispatch(setModalVisibilityState(!isDrawingEventGeometry));
    dispatch(isDrawingEventGeometry ? hideSideBar() : showSideBar());
  }, [dispatch, isDrawingEventGeometry]);

  useEffect(() => {
    if (!isPickingLocation && mapDrawingData) {
      onGeometryChange(mapDrawingData.fillPolygon);
      setMapDrawingData(null);

      if (!event?.geometry) {
        eventReportTracker.track('New event area completed');
      } else {
        eventReportTracker.track('Existing event area edited');
      }
    }
  }, [event?.geometry, isPickingLocation, mapDrawingData, onGeometryChange, setMapDrawingData]);

  const onClickAreaControl = useCallback(() => {
    if (!event?.geometry) {
      onAreaSelectStart();
    } else {
      setIsPopoverOpen(!isPopoverOpen);
    }
  }, [event?.geometry, isPopoverOpen, onAreaSelectStart]);

  const onHidePopover = useCallback(() => {
    if (!isPickingLocation && !mapDrawingData) {
      setIsPopoverOpen(false);
    }
  }, [isPickingLocation, mapDrawingData]);

  const stopEventBubbling = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onLabelKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && isPopoverOpen) {
      stopEventBubbling(event);
      setIsPopoverOpen(false);
    }
  }, [isPopoverOpen, stopEventBubbling]);

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
    className={styles.locationSelectionLabel}
    onClick={stopEventBubbling}
    onKeyDown={onLabelKeyDown}
    ref={locationInputLabelRef}
    >
    <div
      className={styles.locationAnchor}
      data-testid="set-geometry-button"
      onClick={onClickAreaControl}
      ref={locationInputAnchorRef}
    >
      <PolygonIcon className={styles.icon} />
      <span className={styles.displayString}>{displayString}</span>
      {shouldShowCopyButton && <TextCopyBtn className={styles.locationCopyBtn} text={displayString} />}
    </div>

    <Overlay
      container={locationInputLabelRef.current}
      onHide={onHidePopover}
      flip={true}
      placement='auto'
      rootClose
      shouldUpdatePosition={true}
      show={isPopoverOpen}
      target={locationInputAnchorRef.current}
    >
      <Popover placement='bottom' className={styles.newGpsPopover}>
        {isPopoverOpen && <div className={styles.popoverContent} ref={popoverContentRef}>
          <GeometryPreview onAreaSelectStart={onAreaSelectStart} event={event} onDeleteArea={onDeleteArea} />
        </div>}
      </Popover>
    </Overlay>
  </label>;
};

export default debounceRender(memo(AreaSelectorInput));

AreaSelectorInput.defaultProps = {
  onGeometryChange: null,
  originalEvent: null,
};

AreaSelectorInput.propTypes = {
  onGeometryChange: PropTypes.func.isRequired,
  originalEvent: PropTypes.object.isRequired,
  event: PropTypes.object.isRequired,
};
