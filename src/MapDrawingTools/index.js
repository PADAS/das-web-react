import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Popup } from 'react-mapbox-gl';
import debounce from 'lodash/debounce';
import noop from 'lodash/noop';
import length from '@turf/length';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';

import { calcPositiveBearing } from '../utils/location';

import { useDrawToolGeoJson } from '../MapDrawingTools/hooks';
import { useMapEventBinding } from '../hooks';

import styles from './styles.module.scss';
import MapLayers from './MapLayers';

import { MapContext } from '../App';
import { LAYER_IDS } from './MapLayers';

export const RULER_POINTS_LAYER_ID = 'RULER_POINTS_LAYER_ID';

export const DRAWING_MODES = {
  POLYGON: 'polygon',
  LINE: 'line',
};

const MapDrawingTools = ({
  children,
  drawing = true,
  drawingMode = DRAWING_MODES.POLYGON,
  onChange = noop,
  onClickFill = noop,
  onClickLabel = noop,
  onClickLine = noop,
  onClickPoint = noop,
  points,
  renderCursorPopup = noop,
}) => {
  const map = useContext(MapContext);

  const dataContainer = useRef();

  const [draggedPoint, setDraggedPoint] = useState(null);
  const [isHoveringGeometry, setIsHoveringGeometry] = useState(null);
  const [pointerLocation, setPointerLocation] = useState(null);

  const cursorPopupCoords = useMemo(() => pointerLocation ? [pointerLocation.lng, pointerLocation.lat] : points[points.length - 1], [pointerLocation, points]);
  const data = useDrawToolGeoJson(points, drawing, cursorPopupCoords, drawingMode, isHoveringGeometry, draggedPoint);

  const lineLength = useMemo(() => {
    if (!data?.drawnLineSegments) return null;

    return `${length(data.drawnLineSegments).toFixed(2)}km`;
  }, [data?.drawnLineSegments]);

  const showLayer = pointerLocation || points.length;

  const onMapClick = useCallback(debounce((e) => {
    const { lngLat } = e;
    e.preventDefault();
    e.originalEvent.stopPropagation();
    onChange([...points, [lngLat.lng, lngLat.lat]], dataContainer.current);
  }, 100), [onChange, points]);

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
      .find((point) => !point.properties.midpointCenter);
    if (clickedPoint) {
      event.preventDefault();

      map.getCanvas().style.cursor = 'grab';
      setDraggedPoint(clickedPoint);
    }
  }, [map]);

  const onMouseUp = useCallback(() => {
    if (draggedPoint) {
      const newPoints = [...points];
      if (draggedPoint.properties.midpoint) {
        newPoints.splice(draggedPoint.properties.midpointIndex + 1, 0, cursorPopupCoords);
      } else {
        newPoints[draggedPoint.properties.pointIndex] = cursorPopupCoords;
      }

      onChange(newPoints, dataContainer.current);
      setDraggedPoint(null);
    }
  }, [cursorPopupCoords, draggedPoint, onChange, points]);

  useMapEventBinding('click', onClickLine, LAYER_IDS.LINES);
  useMapEventBinding('click', onClickPoint, LAYER_IDS.POINTS);
  useMapEventBinding('click', onClickLabel, LAYER_IDS.LABELS);
  useMapEventBinding('click', onClickFill, LAYER_IDS.FILL);

  useMapEventBinding('mousedown', onMouseDownPoint, LAYER_IDS.POINTS, !drawing);
  useMapEventBinding('mouseup', onMouseUp, null, !drawing);

  useMapEventBinding('mousemove', onMouseMove, null);
  useMapEventBinding('dblclick', onMapDblClick, null, drawing);
  useMapEventBinding('click', onMapClick, null, drawing);

  useEffect(() => {
    dataContainer.current = data;
  }, [data]);

  if (!showLayer) return null;

  return <>
    {drawing && <CursorPopup
      coords={cursorPopupCoords}
      lineLength={lineLength}
      points={points}
      render={renderCursorPopup}
    />}
    <MapLayers
      draggedPoint={draggedPoint}
      drawing={drawing}
      drawnLinePoints={data?.drawnLinePoints}
      drawnLineSegments={data?.drawnLineSegments}
      fillPolygon={data?.fillPolygon}
      isHoveringGeometry={isHoveringGeometry}
      setIsHoveringGeometry={setIsHoveringGeometry}
    />
    {children}
  </>;
};

export default memo(MapDrawingTools);

PropTypes.propTypes = {
  points: PropTypes.array,
};

const CursorPopup = ({ coords, lineLength, points, render }) => {
  const map = useContext(MapContext);

  const popupLocationAndPreviousPointAreIdentical = isEqual(coords, points[points.length - 1]);
  const showPromptForSecondPoint = popupLocationAndPreviousPointAreIdentical && points.length === 1;

  return <Popup
    className={`${styles.popup} ${styles.notDone}`}
    data-testid='drawing-tools-popup'
    map={map}
    offset={[-8, 0]}
    coordinates={coords}
    anchor="right"
    >
    {points.length === 0 && <p>Click to add a point</p>}

    {!!points.length && <>
      {!showPromptForSecondPoint && <>
        <p>Bearing: {calcPositiveBearing(points[points.length - 1], coords).toFixed(2)}&deg;</p>

        <p>Distance: {lineLength}</p>

        {render()}
      </>}
    </>}
  </Popup>;
};
