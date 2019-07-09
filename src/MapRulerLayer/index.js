import React, { memo, Fragment } from 'react';
import { Popup, GeoJSONLayer } from 'react-mapbox-gl';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import { lineString } from '@turf/helpers';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';

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

const circlePaint = {
  'circle-radius': 4,
  'circle-color': 'orange',
};

const MapRulerLayer = (props) => {
  const { pointerLocation, points } = props;
  const pointerCoords = pointerLocation ? [pointerLocation.lng, pointerLocation.lat] : null;
  const showPopup = pointerLocation || points.length;
  const rulerComplete = points.length === 2;
  const popupCoords = pointerLocation ? [pointerLocation.lng, pointerLocation.lat] : points[1];

  const popupClassName = `${styles.popup} ${rulerComplete ? '' : styles.notDone}`;
  const popupOffset = rulerComplete ? [0, -4] : [-8, 0];
  const popupAnchorPosition = rulerComplete ? 'bottom' : 'right';

  const popupLocationAndFirstPointAreIdentical = isEqual(popupCoords, points[0]);

  const calcDataForGeoJsonLayer = () => {
    if (rulerComplete) {
      return lineString(points);
    }
    if (points.length === 1) {
      return lineString([points[0], popupCoords]);
    }
  };

  return <Fragment>
    {showPopup && <Popup className={popupClassName} offset={popupOffset} coordinates={popupCoords} anchor={popupAnchorPosition}>
      {points.length === 0 && <p>Click to start measurement</p>}
      {points.length >= 1 && <Fragment>
        {popupLocationAndFirstPointAreIdentical && <p>Select a second point</p>}
        {!popupLocationAndFirstPointAreIdentical && <Fragment>
          <p>Distance: {distance(points[0], popupCoords).toFixed(2)}km</p>
          <p>Bearing: {bearing(points[0], popupCoords).toFixed(2)}&deg;</p>
          {points.length === 1 && <small>(Click map to finish)</small>}
        </Fragment>}
      </Fragment>}
    </Popup>}
    {points.length && <GeoJSONLayer circlePaint={circlePaint} linePaint={linePaint} lineLayout={lineLayout} data={calcDataForGeoJsonLayer()} />}
  </Fragment>;
};

export default memo(MapRulerLayer);