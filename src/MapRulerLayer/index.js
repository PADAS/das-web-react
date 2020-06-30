import React, { memo, Fragment, useMemo } from 'react';
import { Popup, Source, Layer } from 'react-mapbox-gl';
import length from '@turf/length';
import { lineString } from '@turf/helpers';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';

import { calcPositiveBearing } from '../utils/location';
import { withMap } from '../EarthRangerMap';

import styles from './styles.module.scss';

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
  // 'text-field': 'neat0',
  // 'text-size': 16,
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
    if (drawing) {
      const pointArray = [...points, cursorPopupCoords];

      if (pointArray.length > 1) {
        return lineString([...points, cursorPopupCoords]);
      }

      return null;
    }
    if (points.length > 1) {
      return lineString(points);
    }
    return null;
  }, [cursorPopupCoords, points, drawing]);

  const sourceData = {
    type: 'geojson',
    data: geoJsonLayerData,
  };

  if (!showLayer) return null;

  const lineLabelLayout = {
    ...symbolLayout,
    'text-field': [...points, cursorPopupCoords].length > 1 ? `${length(lineString([...points, cursorPopupCoords])).toFixed(2)}km` : '',
  };


  return <Fragment>
    {drawing && <MemoizedCursorPopup coords={cursorPopupCoords} points={points} />}
    {/*     {drawing && points.length > 1 && <MemoizedPointPopup points={points} point={points[points.length - 1]} drawing={drawing} />}
    {!drawing && !!selectedPoint && <MemoizedPointPopup points={points} point={selectedPoint} drawing={drawing} />} */}
    {!!points.length && <Fragment>
      <Source id='map-ruler-source' geoJsonSource={sourceData} />
      <Layer sourceId='map-ruler-source' type='circle' onMouseEnter={onCircleMouseEnter} onMouseLeave={onCircleMouseLeave} paint={circlePaint} onClick={onPointClick} />
      <Layer sourceId='map-ruler-source' type='line' paint={linePaint} layout={lineLayout} />
      <Layer sourceId='map-ruler-source' type='symbol' layout={lineLabelLayout} />
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

  return <Popup className={popupClassName} offset={popupOffset} coordinates={coords} anchor={popupAnchorPosition}>
    {points.length === 0 && <p>Click to start measurement</p>}
    {!!points.length && <Fragment>
      {showPromptForSecondPoint && <div>
        <p>Select another point</p>
      </div>}
      {!showPromptForSecondPoint && <Fragment>
        <p>Bearing: {calcPositiveBearing(points[points.length - 1], coords).toFixed(2)}&deg;</p>
        {!!points.length && <small>(click to add point)</small>}
      </Fragment>}
    </Fragment>}
  </Popup>;
};

const MemoizedCursorPopup = memo(CursorPopup);


/* separate point popup from cursor popup
  add to point popup:  <AddReport reportData={{
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      }
    }} onSaveSuccess={onComplete} onSaveError={onComplete} />
  enable multiple points
  - design interaction pattern for closing ruler


  
  
 */