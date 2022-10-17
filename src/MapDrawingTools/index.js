import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import debounce from 'lodash/debounce';
import noop from 'lodash/noop';
import isEqual from 'react-fast-compare';

import { childrenPropType, mapDrawToolsDisplayConfigPropType } from '../proptypes';

import { calcPositiveBearing } from '../utils/location';

import { useDrawToolGeoJson } from '../MapDrawingTools/hooks';
import { useMapEventBinding } from '../hooks';

import styles from './styles.module.scss';
import MapLayers from './MapLayers';

import { MapContext } from '../App';
import { LAYER_IDS, SOURCE_IDS } from './MapLayers';

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

  const [draggedPoint, setDraggedPoint] = useState(null);
  const [isHoveringGeometry, setIsHoveringGeometry] = useState(false);
  const [isHoveringMidpoint, setIsHoveringMidpoint] = useState(false);
  const [pointerLocation, setPointerLocation] = useState(null);

  const setDraggedPointDebouncedRef = useRef(debounce((clickedPoint) => {
    setDraggedPoint(clickedPoint);
  }, MAP_CLICK_DEBOUNCE_TIME));

  const cursorPopupCoords = useMemo(() => pointerLocation ? [pointerLocation.lng, pointerLocation.lat] : points[points.length - 1], [pointerLocation, points]);
  const data = useDrawToolGeoJson(points, drawing, cursorPopupCoords, drawingMode, isHoveringGeometry, draggedPoint);

  const showLayer = pointerLocation || points.length;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMapClick = useCallback(debounce((event) => {
    if (drawing) {
      event.preventDefault();
      event.originalEvent.stopPropagation();

      const { lngLat } = event;
      onChange([...points, [lngLat.lng, lngLat.lat]]);
    } else {
      map.removeFeatureState({ source: SOURCE_IDS.POINT_SOURCE });

      const selectedPoint = map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
        .find((point) => !point.properties.pointHover && !point.properties.midpointHover);
      if (selectedPoint) {
        map.setFeatureState({ source: SOURCE_IDS.POINT_SOURCE, id: selectedPoint.id }, { selected: true });
      }
    }
  }, MAP_CLICK_DEBOUNCE_TIME), [drawing, map, onChange, points]);

  const onMapDblClick = useCallback((e) => {
    onMapClick(e);

    e.preventDefault();
    e.originalEvent.stopPropagation();
    onMapClick.cancel();
  }, [onMapClick]);

  const onMouseMove = useCallback((e) => {
    setPointerLocation(e.lngLat);
  }, []);

  const onMouseDownPoint = useCallback((event) => {
    const clickedPoint = map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
      .find((point) => !point.properties.pointHover && !point.properties.midpointHover);
    if (clickedPoint) {
      event.preventDefault();

      map.getCanvas().style.cursor = 'grab';
      map.removeFeatureState({ source: SOURCE_IDS.POINT_SOURCE });

      setDraggedPointDebouncedRef.current(clickedPoint);
    }
  }, [map]);

  const onMouseUp = useCallback(() => {
    setDraggedPointDebouncedRef.current.cancel();

    if (draggedPoint) {
      const newPoints = [...points];
      if (draggedPoint.properties.point) {
        newPoints[draggedPoint.properties.pointIndex] = cursorPopupCoords;
      } else {
        newPoints.splice(draggedPoint.properties.midpointIndex + 1, 0, cursorPopupCoords);
      }

      onChange(newPoints);
      setDraggedPoint(null);
    }
  }, [cursorPopupCoords, draggedPoint, onChange, points]);

  useMapEventBinding('click', onClickLine, LAYER_IDS.LINES);
  useMapEventBinding('click', onClickPoint, LAYER_IDS.POINTS);
  useMapEventBinding('click', onClickLabel, LAYER_IDS.LINE_LABELS);
  useMapEventBinding('click', onClickFill, LAYER_IDS.FILL);

  useMapEventBinding('mousedown', onMouseDownPoint, LAYER_IDS.POINTS, !drawing);
  useMapEventBinding('mouseup', onMouseUp, null, !drawing);

  useMapEventBinding('mousemove', onMouseMove, null);
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
    {renderCursorPopup({
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
