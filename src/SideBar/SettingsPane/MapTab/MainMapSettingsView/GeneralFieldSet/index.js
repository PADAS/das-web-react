import React, { useContext }  from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChevronRight } from '../../../../../common/images/icons/chevron-right.svg';

import { FEATURE_FLAG_LABELS } from '../../../../../constants';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../../../../utils/analytics';
import { MapContext } from '../../../../../App';
import { toggleMapDataSimplificationOnZoom, toggleMapLockState } from '../../../../../ducks/map-ui';
import { updateUserPreferences } from '../../../../../ducks/user-preferences';
import { useFeatureFlag } from '../../../../../hooks';

import * as styles from '../../../styles.module.scss';

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

const GeneralFieldSet = ({ onOpenCoordinateSystemSettingsView }) => {
  const customCoordinateSystemsEnabled = useFeatureFlag(FEATURE_FLAG_LABELS.CUSTOM_COORDINATE_SYSTEMS_ENABLED);

  const dispatch = useDispatch();
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.mainMapSettingsView.generalFieldSet',
  });

  const enable3D = useSelector((state) => state.view.userPreferences.enable3D);
  const mapIsLocked = useSelector((state) => state.view.mapIsLocked);
  const selectedCoordinateRepresentations = useSelector(
    (state) => state.view.coordinateReferenceSystems.selectedCoordinateRepresentations
  );
  const simplifyMapDataOnZoom = useSelector((state) => state.view.simplifyMapDataOnZoom.enabled);

  const map = useContext(MapContext);

  const onLockMapCheckboxChange = () => {
    dispatch(toggleMapLockState());

    LOCKABLE_MAP_CONTROLS.forEach((mapControl) => mapIsLocked
      ? map[mapControl].enable()
      : map[mapControl].disable());

    mapInteractionTracker.track(`${mapIsLocked ? 'Uncheck' : 'Check'} 'Lock Map' checkbox`);
  };

  const on3DMapTerrainCheckboxChange = () => {
    dispatch(updateUserPreferences({ enable3D: !enable3D }));

    mapInteractionTracker.track(`${enable3D ? 'Uncheck' : 'Check'} '3D map terrain' checkbox`);
  };

  const onSimplifyMapDataOnZoomCheckboxChange = () => {
    dispatch(toggleMapDataSimplificationOnZoom());

    mapInteractionTracker.track(`${simplifyMapDataOnZoom.enabled ? 'Uncheck' : 'Check'} 'Simplify Map Data on Zoom' checkbox`);
  };

  return <fieldset className={styles.section}>
    <legend className={styles.title}>{t('legend')}</legend>

    <div className={styles.sectionWrapper}>
      <div className={styles.checkboxWrapper}>
        <input
          checked={mapIsLocked}
          className={styles.checkbox}
          id="map-general-lock-map-checkbox"
          onChange={onLockMapCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="map-general-lock-map-checkbox">
          {t('lockMapCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <div className={styles.checkboxWrapper}>
        <input
          checked={enable3D}
          className={styles.checkbox}
          id="map-general-3d-map-terrain-checkbox"
          onChange={on3DMapTerrainCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="map-general-3d-map-terrain-checkbox">
          {t('3DMapTerrainCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <div className={styles.checkboxWrapper}>
        <input
          checked={simplifyMapDataOnZoom}
          className={styles.checkbox}
          id="map-general-simplify-map-data-on-zoom-checkbox"
          onChange={onSimplifyMapDataOnZoomCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="map-general-simplify-map-data-on-zoom-checkbox">
          {t('simplifyMapDataOnZoomCheckboxLabel')}
        </label>
      </div>

      {customCoordinateSystemsEnabled && <>
        <hr className={styles.separator} />

        <button
          aria-label={t('openCoordinateSystemSettingsButtonLabel')}
          className={styles.button}
          onClick={() => onOpenCoordinateSystemSettingsView()}
          title={t('openCoordinateSystemSettingsButtonLabel')}
          type="button"
        >
          <span className={styles.text}>
            {t('openCoordinateSystemSettingsButton')}
          </span>

          <span className={styles.details}>
            {t('openCoordinateSystemSettingsButtonDetails', {
              selectedCoordinateRepresentationsCount: selectedCoordinateRepresentations.length,
            })}
          </span>

          <ChevronRight aria-hidden="true" className={styles.icon} />
        </button>
      </>}
    </div>
  </fieldset>;
};

export default GeneralFieldSet;
