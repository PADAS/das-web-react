import React, { memo, Fragment, useMemo } from 'react';
import { Popup, Source, Layer } from '../PatrolStartStopLayer/node_modules/react-mapbox-gl';
import { lineString } from '@turf/helpers';
import length from '@turf/length';
import lineSegment from '@turf/line-segment';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';

import { calcPositiveBearing } from '../utils/location';
import { withMap } from '../EarthRangerMap';

import { DEFAULT_SYMBOL_PAINT } from '../constants';

import styles from './styles.module.scss';

export const RULER_POINTS_LAYER_ID = 'RULER_POINTS_LAYER_ID';


const linePaint = {
  'line-color': 'orange',
  'line-dasharray': [2, 4],
  'line-width': 2,
};

const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const symbolLayout = {
  'text-allow-overlap': true,
  'icon-allow-overlap': true,
  'symbol-placement': 'line-center',
  'text-font': ['Open Sans Regular'],
  'text-field': ['get', 'lengthLabel'],
};

const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-halo-width': 2,
};

const circlePaint = {
  'circle-radius': 5,
  'circle-color': 'orange',
};

const MapRulerLayer = (props) => {
  const { drawing, map, onPointClick, pointerLocation, points } = props;
  const showLayer = pointerLocation || points.length;
  const cursorPopupCoords = pointerLocation ? [pointerLocation.lng, pointerLocation.lat] : points[points.length - 1];

  const onCircleMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onCircleMouseLeave = () => map.getCanvas().style.cursor = '';

  const geoJsonLayerData = useMemo(() => {
    let pointArray = drawing ? [...points, cursorPopupCoords] : points;

    if (pointArray.length < 2) return null;

    const lineSegments = lineSegment(lineString(pointArray));
    lineSegments.features = lineSegments.features.map(feature => {
      const lineLength = length(feature);
      const lengthLabel = `${lineLength.toFixed(2)}km`;

      return {
        ...feature,
        properties: {
          ...feature.properties,
          length: lineLength,
          lengthLabel,
        }
      };
    });

    return lineSegments;
  }, [cursorPopupCoords, points, drawing]);

  const sourceData = {
    type: 'geojson',
    data: geoJsonLayerData,
  };

  if (!showLayer) return null;


  return <Fragment>
    {drawing && <MemoizedCursorPopup coords={cursorPopupCoords} points={points} />}
    {!!points.length && <Fragment>
      <Source id='map-ruler-source' geoJsonSource={sourceData} />
      <Layer sourceId='map-ruler-source' id={RULER_POINTS_LAYER_ID} type='circle' onMouseEnter={onCircleMouseEnter} onMouseLeave={onCircleMouseLeave} paint={circlePaint} onClick={onPointClick} />
      <Layer sourceId='map-ruler-source' type='line' paint={linePaint} layout={lineLayout} />
      <Layer sourceId='map-ruler-source' type='symbol' paint={symbolPaint} layout={symbolLayout} />
    </Fragment>}
  </Fragment>;
};

export default memo(withMap(MapRulerLayer));

PropTypes.propTypes = {
  pointerLocation: PropTypes.object,
  points: PropTypes.array,
};

const CursorPopup = (props) => {
  const { coords, points } = props;

  const popupClassName = `${styles.popup} ${styles.notDone}`;
  const popupOffset = [-8, 0];
  const popupAnchorPosition = 'right';

  const popupLocationAndPreviousPointAreIdentical = isEqual(coords, points[points.length - 1]);
  const showPromptForSecondPoint = popupLocationAndPreviousPointAreIdentical && points.length === 1;

  const lineLength = useMemo(() => [...points, coords].length > 1 ? `${length(lineString([...points, coords])).toFixed(2)}km` : null, [coords, points]);

  return <Popup className={popupClassName} offset={popupOffset} coordinates={coords} anchor={popupAnchorPosition}>
    {points.length === 0 && <p>Click to start measurement</p>}
    {!!points.length && <Fragment>
      {showPromptForSecondPoint && <div>
        <p>Select another point</p>
      </div>}
      {!showPromptForSecondPoint && <Fragment>
        <p>Bearing: {calcPositiveBearing(points[points.length - 1], coords).toFixed(2)}&deg;</p>
        <p>Distance: {lineLength}</p>
        {!!points.length && <small>(click to add point)</small>}
      </Fragment>}
    </Fragment>}
  </Popup>;
};

const MemoizedCursorPopup = memo(CursorPopup);
