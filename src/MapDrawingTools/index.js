import React, { memo, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Popup } from 'react-mapbox-gl';
import debounce from 'lodash/debounce';
import noop from 'lodash/noop';
import length from '@turf/length';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';

import { calcPositiveBearing } from '../utils/location';
import { withMap } from '../EarthRangerMap';

import { useDrawToolGeoJson } from '../MapDrawingTools/hooks';
import { useMapEventBinding } from '../hooks';

import styles from './styles.module.scss';
import MapLayers from './MapLayers';

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
    {drawing && <CursorPopup coords={cursorPopupCoords} lineLength={lineLength} points={points} />}
    <MapLayers data={data} />
    {children}
  </>;
};

export default memo(withMap(MapDrawingTools));

PropTypes.propTypes = {
  points: PropTypes.array,
};

const CursorPopup = (props) => {
  const { coords, points, lineLength } = props;

  const popupClassName = `${styles.popup} ${styles.notDone}`;
  const popupOffset = [-8, 0];
  const popupAnchorPosition = 'right';

  const popupLocationAndPreviousPointAreIdentical = isEqual(coords, points[points.length - 1]);
  const showPromptForSecondPoint = popupLocationAndPreviousPointAreIdentical && points.length === 1;
  return <Popup className={popupClassName} offset={popupOffset} coordinates={coords} anchor={popupAnchorPosition}>
    {points.length === 0 && <p>Click to start</p>}
    {!!points.length && <Fragment>
      {showPromptForSecondPoint && <div>
        <p>Select another point</p>
      </div>}
      {!showPromptForSecondPoint && <Fragment>
        <p>Bearing: {calcPositiveBearing(points[points.length - 1], coords).toFixed(2)}&deg;</p>
        <p>Distance: {lineLength}</p>
        {!!points.length && <>
          <small>Click to add a point.<br />Hit &quot;enter&quot; or &quot;return&quot; to complete.</small>
        </>}
      </Fragment>}
    </Fragment>}
  </Popup>;
};

/*
  points,
  drawing,
  drawingMode,
  onChange
  onComplete
  onClickPoint
  onClickFill
  onClickLine
  onClickLabel
*/


/* how to show popup when completed
  how to show popup when clicking individual point
*/