import React, { useContext }  from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../../../utils/analytics';
import { MapContext } from '../../../../App';
import { toggleMapDataSimplificationOnZoom, toggleMapLockState } from '../../../../ducks/map-ui';
import { updateUserPreferences } from '../../../../ducks/user-preferences';

import * as styles from '../styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const LOCKABLE_MAP_CONTROLS = [
  'boxZoom',
  'doubleClickZoom',
  'dragPan',
  'dragRotate',
  'keyboard',
  'scrollZoom',
  'touchZoomRotate',
];

const GeneralFieldSet = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.settingsPane.mapTab.generalFieldSet' });

  const enable3D = useSelector((state) => state.view.userPreferences.enable3D);
  const mapIsLocked = useSelector((state) => state.view.mapIsLocked);
  const simplifyMapDataOnZoom = useSelector((state) => state.view.simplifyMapDataOnZoom.enabled);

  const map = useContext(MapContext);

  const onLockMapCheckboxChange = () => {
    dispatch(toggleMapLockState(!mapIsLocked));

    LOCKABLE_MAP_CONTROLS.forEach((mapControl) => mapIsLocked
      ? map[mapControl].enable()
      : map[mapControl].disable());

    mapInteractionTracker.track(`${mapIsLocked? 'Uncheck' : 'Check'} 'Lock Map' checkbox`);
  };

  const onSimplifyMapDataOnZoomCheckboxChange = () => {
    dispatch(toggleMapDataSimplificationOnZoom());

    mapInteractionTracker.track(`${simplifyMapDataOnZoom.enabled? 'Uncheck' : 'Check'} 'Simplify Map Data on Zoom' checkbox`);
  };

  return <fieldset className={styles.section}>
    <legend className={styles.title}>{t('legend')}</legend>

    <div className={styles.checkboxWrapper}>
      <input
        checked={mapIsLocked}
        className={styles.checkbox}
        id="lock-map-checkbox"
        onChange={onLockMapCheckboxChange}
        type="checkbox"
      />

      <label className={styles.label} htmlFor="lock-map-checkbox">
        {t('lockMapCheckboxLabel')}
      </label>
    </div>

    <div className={styles.checkboxWrapper}>
      <input
        checked={enable3D}
        className={styles.checkbox}
        id="3d-map-terrain-checkbox"
        onChange={() => dispatch(updateUserPreferences({ enable3D: !enable3D }))}
        type="checkbox"
      />

      <label className={styles.label} htmlFor="3d-map-terrain-checkbox">
        {t('3DMapTerrainCheckboxLabel')}
      </label>
    </div>

    <div className={styles.checkboxWrapper}>
      <input
        checked={simplifyMapDataOnZoom}
        className={styles.checkbox}
        id="simplify-map-data-on-zoom-checkbox"
        onChange={onSimplifyMapDataOnZoomCheckboxChange}
        type="checkbox"
      />

      <label className={styles.label} htmlFor="simplify-map-data-on-zoom-checkbox">
        {t('simplifyMapDataOnZoomCheckboxLabel')}
      </label>
    </div>
  </fieldset>;
};

export default GeneralFieldSet;
