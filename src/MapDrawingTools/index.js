import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import debounce from 'lodash/debounce';
import noop from 'lodash/noop';
import isEqual from 'react-fast-compare';

import { BREAKPOINTS } from '../constants';
import { calcPositiveBearing } from '../utils/location';
import { childrenPropType, mapDrawToolsDisplayConfigPropType } from '../proptypes';
import { LAYER_IDS, SOURCE_IDS } from './MapLayers';
import { MapContext } from '../App';
import { useDrawToolGeoJson } from '../MapDrawingTools/hooks';
import { useMapEventBinding, useMatchMedia } from '../hooks';

import MapLayers from './MapLayers';

import styles from './styles.module.scss';

export const RULER_POINTS_LAYER_ID = 'RULER_POINTS_LAYER_ID';

export const DRAWING_MODES = {
  POLYGON: 'polygon',
  LINE: 'line',
};

const MAP_CLICK_DEBOUNCE_TIME = 100;

const MapDrawingTools = ({
  children,
  displayConfig,
  drawing = true,
  drawingMode = DRAWING_MODES.POLYGON,
  onChange = noop,
  onClickFill = noop,
  onClickLabel = noop,
  onClickLine = noop,
  onClickPoint = noop,
  points,
  renderCursorPopup = defaultCursorPopupRenderFn,
}) => {
  const map = useContext(MapContext);

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const [draggedPoint, setDraggedPoint] = useState(null);
  const [isHoveringGeometry, setIsHoveringGeometry] = useState(false);
  const [isHoveringMidpoint, setIsHoveringMidpoint] = useState(false);
  const [pointerLocation, setPointerLocation] = useState(null);

  const cursorPopupCoords = useMemo(() => pointerLocation ? [pointerLocation.lng, pointerLocation.lat] : points[points.length - 1], [pointerLocation, points]);
  const data = useDrawToolGeoJson(points, drawing, cursorPopupCoords, drawingMode, isHoveringGeometry, draggedPoint);

  const showLayer = pointerLocation || points.length;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMapClick = useCallback(debounce((event) => {
    event.preventDefault();
    event.originalEvent.stopPropagation();

    const clickedPoint = map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
      .find((point) => !point.properties.pointHover && !point.properties.midpointHover);
    if (drawing && !clickedPoint) {
      onChange([...points, [event.lngLat.lng, event.lngLat.lat]]);
    } else if (!drawing) {
      map.removeFeatureState({ source: SOURCE_IDS.POINT_SOURCE });

      if (clickedPoint) {
        map.setFeatureState({ source: SOURCE_IDS.POINT_SOURCE, id: clickedPoint.id }, { selected: true });
      }
    }
  }, MAP_CLICK_DEBOUNCE_TIME), [drawing, map, onChange, points]);

  const onMapDblClick = useCallback((e) => {
    onMapClick(e);

    e.preventDefault();
    e.originalEvent.stopPropagation();
    onMapClick.cancel();
  }, [onMapClick]);

  const onMouseMove = useCallback((event) => {
    setPointerLocation(event.lngLat);
  }, []);

  const onMouseDownPoint = useCallback((event) => {
    const clickedPoint = map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
      .find((point) => !point.properties.pointHover && !point.properties.midpointHover);
    if (clickedPoint) {
      event.preventDefault();

      map.getCanvas().style.cursor = 'grab';
      map.removeFeatureState({ source: SOURCE_IDS.POINT_SOURCE });

      setDraggedPoint(clickedPoint);
    }
  }, [map]);

  const onTouchStartPoint = useCallback((event) => {
    setPointerLocation(event.lngLat);
    onMouseDownPoint(event);
  }, [onMouseDownPoint]);

  const onMouseUp = useCallback((event) => {
    if (draggedPoint) {
      const newPoints = [...points];
      if (draggedPoint.properties.point) {
        newPoints[draggedPoint.properties.pointIndex] = [event.lngLat.lng, event.lngLat.lat];
      } else {
        newPoints.splice(draggedPoint.properties.midpointIndex + 1, 0, [event.lngLat.lng, event.lngLat.lat]);
      }

      onChange(newPoints);
      setDraggedPoint(null);
    }
  }, [draggedPoint, onChange, points]);

  const onTouchEndPoint = useCallback((event) => {
    setPointerLocation(null);

    if (!drawing) {
      onMouseUp(event);
    }
  }, [drawing, onMouseUp]);

  useMapEventBinding('click', onClickLine, LAYER_IDS.LINES);
  useMapEventBinding('click', onClickPoint, LAYER_IDS.POINTS);
  useMapEventBinding('click', onClickLabel, LAYER_IDS.LINE_LABELS);
  useMapEventBinding('click', onClickFill, LAYER_IDS.FILL);

  useMapEventBinding('mousedown', onMouseDownPoint, LAYER_IDS.POINTS, !drawing);
  useMapEventBinding('touchstart', onTouchStartPoint, LAYER_IDS.POINTS, !drawing);
  useMapEventBinding('mouseup', onMouseUp, null, !drawing);
  useMapEventBinding('touchend', onTouchEndPoint, null);

  useMapEventBinding('mousemove', onMouseMove, null);
  useMapEventBinding('touchmove', onMouseMove, null, !drawing);
  useMapEventBinding('dblclick', onMapDblClick, null, drawing);
  useMapEventBinding('click', onMapClick, null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        const selectedPoint = map.queryRenderedFeatures({ layers: [LAYER_IDS.POINTS] })
          .find((point) => !!point.state?.selected);
        if (!drawing && selectedPoint) {
          map.removeFeatureState({ source: SOURCE_IDS.POINT_SOURCE });
          return onChange(points.filter((_, index) => index !== selectedPoint.properties.pointIndex));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawing, map, onChange, points]);

  if (!showLayer) return null;

  return <>
    {isMediumLayoutOrLarger && renderCursorPopup({
      coords: cursorPopupCoords,
      drawing,
      isHoveringMidpoint,
      lineLength: data?.drawnLineSegments?.properties?.lengthLabel,
      points,
    })}
    <MapLayers
      displayConfig={displayConfig}
      draggedPoint={draggedPoint}
      drawing={drawing}
      drawnLinePoints={data?.drawnLinePoints}
      drawnLineSegments={data?.drawnLineSegments}
      fillLabelPoint={data?.fillLabelPoint}
      fillPolygon={data?.fillPolygon}
      isHoveringGeometry={isHoveringGeometry}
      setIsHoveringGeometry={setIsHoveringGeometry}
      setIsHoveringMidpoint={setIsHoveringMidpoint}
    />
    {children}
  </>;
};

export default memo(MapDrawingTools);

PropTypes.propTypes = {
  displayConfig: mapDrawToolsDisplayConfigPropType,
  children: childrenPropType,
  drawing: PropTypes.bool,
  drawingMode: PropTypes.oneOf(Object.values(DRAWING_MODES)),
  onChange: PropTypes.func,
  onClickFill: PropTypes.func,
  onClickLabel: PropTypes.func,
  onClickLine: PropTypes.func,
  onClickPoint: PropTypes.func,
  points: PropTypes.array,
  renderCursorPopup: PropTypes.func,
};

const DefaultCursorPopup = ({ coords, drawing, isHoveringMidpoint, lineLength, points }) => {
  const map = useContext(MapContext);

  const popupLocationAndPreviousPointAreIdentical = isEqual(coords, points[points.length - 1]);
  const showPromptForSecondPoint = popupLocationAndPreviousPointAreIdentical && points.length === 1;

  return drawing || isHoveringMidpoint ? <Popup
    className={`${styles.popup} ${styles.notDone}`}
    data-testid='drawing-tools-popup'
    map={map}
    offset={[-8, 0]}
    coordinates={coords}
    anchor="left"
    >
    {drawing ? <>
      {points.length === 0 && <p>Click to add a point</p>}

      {!!points.length && <>
        {!showPromptForSecondPoint && <>
          <p>Bearing: {calcPositiveBearing(points[points.length - 1], coords).toFixed(2)}&deg;</p>

          <p>Distance: {lineLength}</p>
        </>}
        <small>Click to add a point.<br />Hit &quot;enter&quot; or &quot;return&quot; to complete.</small>
      </>}
    </> : <span>Click &amp; drag to add a point</span>
    }
  </Popup> : null;
};

const defaultCursorPopupRenderFn = ({ coords, drawing, isHoveringMidpoint, lineLength, points }) => <DefaultCursorPopup
  coords={coords}
  drawing={drawing}
  isHoveringMidpoint={isHoveringMidpoint}
  lineLength={lineLength}
  points={points}
/>;
