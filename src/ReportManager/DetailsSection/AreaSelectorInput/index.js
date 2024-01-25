import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import debounceRender from 'react-debounce-render';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PolygonIcon } from '../../../common/images/icons/polygon.svg';

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../../utils/analytics';
import { hideSideBar, showSideBar } from '../../../ducks/side-bar';
import { MapDrawingToolsContext } from '../../../MapDrawingTools/ContextProvider';
import { MAP_LOCATION_SELECTION_MODES, setIsPickingLocation } from '../../../ducks/map-ui';
import { setModalVisibilityState } from '../../../ducks/modals';
import { useEventGeoMeasurementDisplayStrings } from '../../../hooks/geometry';

import GeometryPreview from './GeometryPreview';
import TextCopyBtn from '../../../TextCopyBtn';

import styles from './styles.module.scss';

const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

const GEOMETRY_PROVENANCE_WEB = 'web';

const AreaSelectorInput = ({ event, onGeometryChange, originalEvent }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager' });

  const { mapDrawingData, setMapDrawingData } = useContext(MapDrawingToolsContext);

  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);
  const isDrawingEventGeometry = useSelector((state) => isPickingLocation
    && state.view.mapLocationSelection.mode === MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY);

  const locationInputAnchorRef = useRef(null);
  const locationInputLabelRef = useRef(null);
  const popoverContentRef = useRef(null);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [perimeterDisplayString, areaDisplayString] = useEventGeoMeasurementDisplayStrings(event, originalEvent);

  const displayString = event?.geometry
    ? t('detailsSection.areaSelectorInput.displayString', { areaDisplayString, perimeterDisplayString })
    : t('detailsSection.areaSelectorInput.inputPlaceholder');

  const shouldShowCopyButton = !!event?.geometry;

  const onAreaSelectStart = useCallback(() => {
    dispatch(setIsPickingLocation(true, MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY));

    if (!event?.geometry) {
      eventReportTracker.track('Click set area to add area to report');
    } else if (event?.geometry?.properties?.provenance) {
      eventReportTracker.track(`Edit an event geometry generated in ER ${event?.geometry?.properties?.provenance}`);
    } else {
      eventReportTracker.track('Edit an event geometry');
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
      setMapDrawingData(null);

      let geoJson;
      if (!event?.geometry) {
        geoJson = {
          ...mapDrawingData.fillPolygon,
          properties: { provenance: GEOMETRY_PROVENANCE_WEB },
        };

        eventReportTracker.track('New event area completed');
      } else {
        const eventPolygon = event.geometry.type === 'FeatureCollection'
          ? event.geometry.features.find((feature) => feature.geometry.type === 'Polygon')
          : event.geometry;

        geoJson = {
          ...mapDrawingData.fillPolygon,
          properties: { provenance: eventPolygon?.properties?.provenance },
        };

        eventReportTracker.track('Existing event area edited');
      }

      onGeometryChange(geoJson);
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
      flip={true}
      onHide={onHidePopover}
      placement="auto"
      rootClose
      shouldUpdatePosition={true}
      show={isPopoverOpen}
      target={locationInputAnchorRef.current}
    >
      <Popover className={styles.newGpsPopover} placement="bottom">
        {isPopoverOpen && <div className={styles.popoverContent} ref={popoverContentRef}>
          <GeometryPreview event={event} onAreaSelectStart={onAreaSelectStart} onDeleteArea={onDeleteArea} />
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
  event: PropTypes.object.isRequired,
  onGeometryChange: PropTypes.func.isRequired,
  originalEvent: PropTypes.object.isRequired,
};
