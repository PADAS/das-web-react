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

const MapDrawingTools = (props) => {
  const {
    children,
    drawing = true,
    drawingMode = DRAWING_MODES.POLYGON,
    onChange = noop,
    onClickPoint = noop,
    onClickFill = noop,
    points,
    onClickLine = noop,
    onClickLabel = noop,
    renderPopupInstructions = noop,
  } = props;

  const [pointerLocation, setPointerLocation] = useState(null);

  const cursorPopupCoords = useMemo(() => pointerLocation ? [pointerLocation.lng, pointerLocation.lat] : points[points.length - 1], [pointerLocation, points]);
  const data = useDrawToolGeoJson(points, (drawing && cursorPopupCoords), drawingMode);
  const dataContainer = useRef(data);

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

  useMapEventBinding('click', onClickLine, LAYER_IDS.LINES);
  useMapEventBinding('click', onClickPoint, LAYER_IDS.POINTS);
  useMapEventBinding('click', onClickLabel, LAYER_IDS.LABELS);
  useMapEventBinding('click', onClickFill, LAYER_IDS.FILL);

  useMapEventBinding('mousemove', onMouseMove, null, drawing);
  useMapEventBinding('dblclick', onMapDblClick, null, drawing);
  useMapEventBinding('click', onMapClick, null, drawing);

  useEffect(() => {
    dataContainer.current = data;
  }, [dataContainer, data]);

  if (!showLayer) return null;

  return <>
    {drawing && <CursorPopup
      coords={cursorPopupCoords}
      lineLength={lineLength}
      points={points}
      render={renderPopupInstructions}
    />}
    <MapLayers drawnLineSegments={data?.drawnLineSegments} fillPolygon={data?.fillPolygon} />
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
