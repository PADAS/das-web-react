import React, { useCallback } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { DAS_HOST, SUPPORTED_LANGUAGES } from '../../constants';
import { EVENT_FILTER_STORAGE_KEY } from '../../ducks/event-filter';
import { MAP_LAYER_FILTER_STORAGE_KEY } from '../../ducks/map-layer-filter';
import { MAP_POSITION_STORAGE_KEY } from '../../ducks/map-position';
import { PATROL_FILTER_STORAGE_KEY } from '../../ducks/patrol-filter';
import { useOptionalPersistence } from '../../reducers/storage-config';

import BetaToggles from '../../GlobalMenuDrawer/BetaToggles';
import MapTab from './MapTab';
import Select from '../../Select';

import * as styles from './styles.module.scss';

const ALERTS_URL = `${DAS_HOST}/alerts`;

const TAB_KEYS = {
  GENERAL: 'general',
  MAP: 'map',
  ALERTS: 'alerts',
};

const SettingsPane = () => {
  const { i18n, t } = useTranslation('components', { keyPrefix: 'sideBar.settingsPane' });

  const alertsEnabled = useSelector((state) => state.view.systemConfig.alerts_enabled);

  const { restorable: eventFilterRestorable, setRestorable: setEventFilterIsRestorable } = useOptionalPersistence(EVENT_FILTER_STORAGE_KEY, true);
  const { restorable: patrolFilterRestorable, setRestorable: setPatrolFilterIsRestorable } = useOptionalPersistence(PATROL_FILTER_STORAGE_KEY, true);
  const { restorable: mapPositionRestorable, setRestorable: setMapPositionIsRestorable } = useOptionalPersistence(MAP_POSITION_STORAGE_KEY, true);
  const { restorable: mapLayersRestorable, setRestorable: setMapLayerFiltersAreRestorable } = useOptionalPersistence(MAP_LAYER_FILTER_STORAGE_KEY, true);

  const languageOptions = Object.entries(SUPPORTED_LANGUAGES)
    .reduce((accumulator, [value, label]) => [...accumulator, { label, value }], []);
  const languageValue = languageOptions.find((option) => option.value === i18n.language);

  const onEventFilterPersistToggle = useCallback(() => {
    setEventFilterIsRestorable(!eventFilterRestorable);
  }, [eventFilterRestorable, setEventFilterIsRestorable]);

  const onPatrolFilterPersistToggle = useCallback(() => {
    setPatrolFilterIsRestorable(!patrolFilterRestorable);
  }, [patrolFilterRestorable, setPatrolFilterIsRestorable]);

  const onMapPositionPersistToggle = useCallback(() => {
    setMapPositionIsRestorable(!mapPositionRestorable);
  }, [mapPositionRestorable, setMapPositionIsRestorable]);

  const onMapLayersPersistToggle = useCallback(() => {
    setMapLayerFiltersAreRestorable(!mapLayersRestorable);
  }, [mapLayersRestorable, setMapLayerFiltersAreRestorable]);

  const onChangeLanguage = useCallback((language) => {
    i18n?.changeLanguage?.(language?.value);
  }, [i18n]);

  return <Tabs
      aria-labelledby="side-bar-tab-header"
      className={styles.tabs}
      defaultActiveKey={TAB_KEYS.GENERAL}
      variant="underline"
    >
    <Tab
      className={styles.tab}
      data-testid="settings-generalTab"
      eventKey={TAB_KEYS.GENERAL}
      title={t('generalTabTitle')}
    >
      <section>
        <h3>{t('appRefreshHeader')}</h3>

        <h6>{t('appRefreshDescription')}</h6>

        <ul>
          <li>
            <label htmlFor={MAP_POSITION_STORAGE_KEY}>
              <input type='checkbox' id={MAP_POSITION_STORAGE_KEY} onChange={onMapPositionPersistToggle} name={MAP_POSITION_STORAGE_KEY} checked={mapPositionRestorable} />

              <span>{t('appRefreshMapPositionAndZoomLevelLabel')}</span>
            </label>
          </li>

          <li>
            <label htmlFor={EVENT_FILTER_STORAGE_KEY}>
              <input type='checkbox' id={EVENT_FILTER_STORAGE_KEY} onChange={onEventFilterPersistToggle} name={EVENT_FILTER_STORAGE_KEY} checked={eventFilterRestorable} />

              <span>{t('appRefreshReportFiltersLabel')}</span>
            </label>
          </li>

          <li>
            <label htmlFor={PATROL_FILTER_STORAGE_KEY}>
              <input type='checkbox' id={PATROL_FILTER_STORAGE_KEY} onChange={onPatrolFilterPersistToggle} name={PATROL_FILTER_STORAGE_KEY} checked={patrolFilterRestorable} />

              <span>{t('appRefreshPatrolFiltersLabel')}</span>
            </label>
          </li>

          <li>
            <label htmlFor={MAP_LAYER_FILTER_STORAGE_KEY}>
              <input type='checkbox' id={MAP_LAYER_FILTER_STORAGE_KEY} onChange={onMapLayersPersistToggle} name={MAP_LAYER_FILTER_STORAGE_KEY} checked={mapLayersRestorable} />

              <span>{t('appRefreshMapLayersLabel')}</span>
            </label>
          </li>
        </ul>
      </section>

      <section>
        <h3>{t('languagesHeader')}</h3>

        <Select
          className={styles.languageSelect}
          onChange={onChangeLanguage}
          options={languageOptions}
          value={languageValue}
        />
      </section>

      <section>
        <h3>{t('experimentalFeaturesHeader')}</h3>

        <BetaToggles />
      </section>
    </Tab>

    <Tab
      as="section"
      className={styles.tab}
      data-testid="settings-mapTab"
      eventKey={TAB_KEYS.MAP}
      title={t('mapTabTitle')}
    >
      <MapTab />
    </Tab>

    {alertsEnabled && <Tab
      className={`${styles.tab} ${styles.alertsTab}`}
      data-testid="settings-alertsTab"
      eventKey={TAB_KEYS.ALERTS}
      title={t('alertsTabTitle')}
    >
      <iframe
        data-testid="settings-alertsIframe"
        src={ALERTS_URL}
        style={{ width: '100%', height: '100vh' }}
        title={t('alertsFrameTitle')}
      />
    </Tab>}
  </Tabs>;

};

export default SettingsPane;