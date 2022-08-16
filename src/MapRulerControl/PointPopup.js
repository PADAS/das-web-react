import React, { useEffect, useMemo, useState, memo } from 'react';

import { Popup } from 'react-mapbox-gl';
import length from '@turf/length';
import { lineString } from '@turf/helpers';
import { calculatePopoverPlacement } from '../utils/map';
import GpsFormatToggle from '../GpsFormatToggle';
import AddReport from '../AddReport';
import { calcPositiveBearing } from '../utils/location';

import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import { ReactComponent as RulerIcon } from '../common/images/icons/ruler-icon.svg';

import styles from './styles.module.scss';

const PointPopup = (props) => {
  const { drawing, map, onClickFinish, pointIndex, points } = props;
  const isFirstPoint = pointIndex === 0;
  const point = points[pointIndex];
  const popupOffset = [0, -4];
  const popupAnchorPosition = 'bottom';

  const distanceFromStart = useMemo(() => {
    if (isFirstPoint) return null;

    const clonedPoints = [...points];
    clonedPoints.length = (pointIndex + 1);

    if (!clonedPoints.length) return null;

    return `${length(lineString(clonedPoints)).toFixed(2)}km`;

  }, [isFirstPoint, pointIndex, points]);

  const bearingFromPrev = useMemo(() => {
    if (isFirstPoint) return null;

    const prevPoint = points[pointIndex - 1];

    if (!prevPoint || !point) return null;

    return calcPositiveBearing(prevPoint, point).toFixed(2);
  }, [isFirstPoint, point, pointIndex, points]);

  const [popoverPlacement, setPopoverPlacement] = useState('auto');

  useEffect(() => {
    const updatePopoverPlacement = async () => {
      const updatedPopoverPlacement = await calculatePopoverPlacement(map, { lat: point[1], lng: point[0] });
      setPopoverPlacement(updatedPopoverPlacement);
    };

    updatePopoverPlacement();
  }, [map, point]);

  if (!point) return null;

  return <Popup className={`${styles.popup} ${drawing ? styles.unfinished : ''}`} offset={popupOffset} coordinates={point} anchor={popupAnchorPosition}>

    {!drawing && <>
      <GpsFormatToggle lng={point[0]} lat={point[1]} />
      {points.length > 1 && !isFirstPoint && <>
        <p>
          <strong>Bearing:</strong> {bearingFromPrev}&deg; <br />
          <strong>Distance from start:</strong> {distanceFromStart}
        </p>
      </>}
      <AddReport
        analyticsMetadata={{
          category: MAP_INTERACTION_CATEGORY,
          location: 'map ruler popup',
        }}
        reportData={{
          location: {
            latitude: point[1],
            longitude: point[0],
          }
        }}
        popoverPlacement={popoverPlacement}
      />
    </>}
    {
      drawing && <p onClick={onClickFinish} className={styles.finishButton}>
        <RulerIcon />
        click here to finish
      </p>}
  </Popup>;
};
export default memo(PointPopup);