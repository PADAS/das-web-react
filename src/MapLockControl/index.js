import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { lockMap } from '../utils/map';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { MapContext } from '../App';
import { toggleMapLockState } from '../ducks/map-ui';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapLockControl = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('settings', { keyPrefix: 'mapLockControl' });

  const map = useContext(MapContext);

  const mapIsLocked = useSelector((state) => state.view.mapIsLocked);

  const onCheckboxChange = () => {
    dispatch(toggleMapLockState(!mapIsLocked));

    mapInteractionTracker.track(`${mapIsLocked? 'Uncheck' : 'Check'} 'Lock Map' checkbox`);
  };

  useEffect(() => {
    lockMap(map, mapIsLocked);
  }, [map, mapIsLocked]);

  return <label>
    <input checked={mapIsLocked} name="maplock" onChange={onCheckboxChange} type="checkbox" />

    <span className={styles.cbxlabel}>{t('label')}</span>
  </label>;
};

export default MapLockControl;
