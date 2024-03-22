import React, { useMemo, memo } from 'react';
import length from '@turf/length';
import { lineString } from '@turf/helpers';
import { useTranslation } from 'react-i18next';

import GpsFormatToggle from '../GpsFormatToggle';
import AddItemButton from '../AddItemButton';
import Popup from '../Popup';
import { calcPositiveBearing } from '../utils/location';

import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import { ReactComponent as RulerIcon } from '../common/images/icons/ruler-icon.svg';

import styles from './styles.module.scss';

const PointPopup = (props) => {
  const { drawing, onClickFinish, pointIndex, points } = props;
  const isFirstPoint = pointIndex === 0;
  const point = points[pointIndex];
  const popupOffset = [0, -4];
  const popupAnchorPosition = 'bottom';
  const { t } = useTranslation('map-controls', { keyPrefix: 'pointPopup' });

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

  if (!point) return null;

  return <Popup className={`${styles.popup} ${drawing ? styles.unfinished : ''}`} offset={popupOffset} coordinates={point} anchor={popupAnchorPosition}>

    {!drawing && <>
      <GpsFormatToggle lng={point[0]} lat={point[1]} />
      {points.length > 1 && !isFirstPoint && <>
        <p>
          <strong>{t('bearingLabel')}</strong> {bearingFromPrev}&deg; <br />
          <strong>{t('distanceLabel')}</strong> {distanceFromStart}
        </p>
      </>}
      <AddItemButton
        analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'map ruler popup' }}
        reportData={{
          location: {
            latitude: point[1],
            longitude: point[0],
          }
        }}
      />
    </>}
    {
      drawing && <p onClick={onClickFinish} className={styles.finishButton}>
        <RulerIcon />
        {t('finishButton')}
      </p>}
  </Popup>;
};
export default memo(PointPopup);