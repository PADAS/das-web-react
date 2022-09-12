import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Popup } from 'react-mapbox-gl';
import debounce from 'lodash/debounce';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';

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
  drawing = true,
  drawingMode = DRAWING_MODES.POLYGON,
  onChange = noop,
  onClickFill = noop,
  onClickLabel = noop,
  onClickLine = noop,
  onClickPoint = noop,
  onCompleteDrawing = noop,
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

  const showLayer = pointerLocation || points.length;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMapClick = useCallback(debounce((event) => {
    if (drawing) {
      event.preventDefault();
      event.originalEvent.stopPropagation();

      const { lngLat } = event;
      onChange([...points, [lngLat.lng, lngLat.lat]], dataContainer.current);
    } else {
      map.removeFeatureState({ source: SOURCE_IDS.POINT_SOURCE });

      const selectedPoint = map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
        .find((point) => !point.properties.pointHover);
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
      .find((point) => !point.properties.pointHover);
    if (clickedPoint) {
      event.preventDefault();

      map.getCanvas().style.cursor = 'grab';
      map.removeFeatureState({ source: SOURCE_IDS.POINT_SOURCE });

      setDraggedPoint(clickedPoint);
    }
  }, [map]);

  const onMouseUp = useCallback(() => {
    if (draggedPoint) {
      const newPoints = [...points];
      if (draggedPoint.properties.point) {
        newPoints[draggedPoint.properties.pointIndex] = cursorPopupCoords;
      } else {
        newPoints.splice(draggedPoint.properties.midpointIndex + 1, 0, cursorPopupCoords);
      }

      onChange(newPoints, dataContainer.current);
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
      if (event.key === 'Backspace') {
        if (drawing && points.length) {
          return onChange(points.slice(0, -1));
        }

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

  useEffect(() => {
    dataContainer.current = data;
  }, [data]);

  useEffect(() => {
    if (!drawing) {
      onCompleteDrawing(points, dataContainer.current);
    }
  }, [drawing, onCompleteDrawing, points]);

  if (!showLayer) return null;

  return <>
    {drawing && <CursorPopup
      coords={cursorPopupCoords}
      lineLength={data?.drawnLineSegments?.properties?.length}
      points={points}
      render={renderCursorPopup}
    />}
    <MapLayers
      draggedPoint={draggedPoint}
      drawing={drawing}
      drawnLinePoints={data?.drawnLinePoints}
      drawnLineSegments={data?.drawnLineSegments}
      fillLabelPoint={data?.fillLabelPoint}
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
    anchor="left"
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
