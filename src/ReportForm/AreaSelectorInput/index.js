import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import area from '@turf/area';
import { convertArea, convertLength } from '@turf/helpers';
import debounceRender from 'react-debounce-render';
import length from '@turf/length';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as PolygonIcon } from '../../common/images/icons/polygon.svg';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { MAP_LOCATION_SELECTION_MODES, setIsPickingLocation } from '../../ducks/map-ui';
import { setModalVisibilityState } from '../../ducks/modals';
import { truncateFloatingNumber } from '../../utils/math';

import { FormDataContext } from '../../EditableItem/context';

import GeometryPreview from '../GeometryPreview';
import TextCopyBtn from '../../TextCopyBtn';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const placeholder = 'Set report area';

const calculateAreaDisplayString = (eventGeo, originalEventGeo) => {
  if (eventGeo) {
    const geometryHasBeenEdited = !isEqual(eventGeo, originalEventGeo);

    const prefix = geometryHasBeenEdited ? '~' : '';

    const areaValue = geometryHasBeenEdited
      ? area(eventGeo)
      : eventGeo?.features?.[0]?.properties?.area ?? 0;

    const perimeterLengthValue = geometryHasBeenEdited
      ? length(eventGeo)
      : eventGeo?.features?.[0]?.properties?.perimeter ?? 0;


    const geometryAreaTruncated = truncateFloatingNumber(
      convertArea(
        areaValue,
        'meters',
        'kilometers'
      ),
      2
    );

    const geometryPerimeterTruncated = truncateFloatingNumber(
      convertLength(
        perimeterLengthValue,
        geometryHasBeenEdited ? 'kilometers' : 'meters',
        'kilometers'
      ),
      2
    );

    return `${prefix}${geometryAreaTruncated} km² area, ${prefix}${geometryPerimeterTruncated} km perimeter`;
  }

  return placeholder;

};

const AreaSelectorInput = ({
  onGeometryChange,
  originalEvent,
}) => {
  const dispatch = useDispatch();

  const event = useContext(FormDataContext);
  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);
  const { mapDrawingData, setMapDrawingData } = useContext(MapDrawingToolsContext);

  const locationInputAnchorRef = useRef(null);
  const locationInputLabelRef = useRef(null);
  const popoverContentRef = useRef(null);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const displayString = useMemo(() =>
    calculateAreaDisplayString(event?.geometry, originalEvent?.geometry)
  , [event?.geometry, originalEvent?.geometry]
  );

  const shouldShowCopyButton = displayString !== placeholder;

  const isDrawingEventGeometry = useSelector((state) => isPickingLocation
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
          <GeometryPreview onAreaSelectStart={onAreaSelectStart} onDeleteArea={onDeleteArea} />
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
  onGeometryChange: PropTypes.func,
  originalEvent: PropTypes.object,
};
