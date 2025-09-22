import React from 'react';
import { useTranslation } from 'react-i18next';

import { EVENT_FILTER_STORAGE_KEY } from '../../../../ducks/event-filter';
import { MAP_LAYER_FILTER_STORAGE_KEY } from '../../../../ducks/map-layer-filter';
import { MAP_POSITION_STORAGE_KEY } from '../../../../ducks/map-position';
import { PATROL_FILTER_STORAGE_KEY } from '../../../../ducks/patrol-filter';
import { SETTINGS_CATEGORY, trackEventFactory } from '../../../../utils/analytics';
import { useOptionalPersistence } from '../../../../reducers/storage-config';

import * as styles from '../../styles.module.scss';

const settingsTracker = trackEventFactory(SETTINGS_CATEGORY);

const AppRefreshFieldSet = () => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.settingsPane.generalTab.appRefreshFieldSet' });

  const { restorable: eventFilterRestorable, setRestorable: setEventFilterIsRestorable } = useOptionalPersistence(EVENT_FILTER_STORAGE_KEY, true);
  const { restorable: mapLayersRestorable, setRestorable: setMapLayerFiltersAreRestorable } = useOptionalPersistence(MAP_LAYER_FILTER_STORAGE_KEY, true);
  const { restorable: mapPositionRestorable, setRestorable: setMapPositionIsRestorable } = useOptionalPersistence(MAP_POSITION_STORAGE_KEY, true);
  const { restorable: patrolFilterRestorable, setRestorable: setPatrolFilterIsRestorable } = useOptionalPersistence(PATROL_FILTER_STORAGE_KEY, true);

  const onMapPositionAndZoomLevelCheckboxChange = (event) => {
    setMapPositionIsRestorable(event.target.checked);

    settingsTracker.track(
      `${event.target.checked ? 'Check' : 'Uncheck'} 'App refresh: map position & zoom level' checkbox`
    );
  };

  const onEventFiltersCheckboxChange = (event) => {
    setEventFilterIsRestorable(event.target.checked);

    settingsTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'App refresh: event filters' checkbox`);
  };

  const onPatrolFiltersCheckboxChange = (event) => {
    setPatrolFilterIsRestorable(event.target.checked);

    settingsTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'App refresh: patrol filters' checkbox`);
  };

  const onMapLayersCheckboxChange = (event) => {
    setMapLayerFiltersAreRestorable(event.target.checked);

    settingsTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'App refresh: map layers' checkbox`);
  };

  return <fieldset aria-describedby="app-refresh-settings-description" className={styles.section}>
    <legend className={styles.title}>{t('legend')}</legend>

    <div className={styles.sectionWrapper}>
      <p className={styles.sectionDescription} id="app-refresh-settings-description">
        {t('description')}
      </p>

      <div className={styles.checkboxWrapper}>
        <input
          checked={mapPositionRestorable}
          className={styles.checkbox}
          id="general-app-refresh-map-position-and-zoom-level-checkbox"
          onChange={onMapPositionAndZoomLevelCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="general-app-refresh-map-position-and-zoom-level-checkbox">
          {t('mapPositionAndZoomLevelCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <div className={styles.checkboxWrapper}>
        <input
          checked={eventFilterRestorable}
          className={styles.checkbox}
          id="general-app-refresh-event-filters-checkbox"
          onChange={onEventFiltersCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="general-app-refresh-event-filters-checkbox">
          {t('eventFiltersCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <div className={styles.checkboxWrapper}>
        <input
          checked={patrolFilterRestorable}
          className={styles.checkbox}
          id="general-app-refresh-patrol-filters-checkbox"
          onChange={onPatrolFiltersCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="general-app-refresh-patrol-filters-checkbox">
          {t('patrolFiltersCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <div className={styles.checkboxWrapper}>
        <input
          checked={mapLayersRestorable}
          className={styles.checkbox}
          id="general-app-refresh-map-layers-checkbox"
          onChange={onMapLayersCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="general-app-refresh-map-layers-checkbox">
          {t('mapLayersCheckboxLabel')}
        </label>
      </div>
    </div>
  </fieldset>;
};

export default AppRefreshFieldSet;
