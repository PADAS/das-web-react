import React, { useCallback, useState } from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { DAS_HOST, DEVELOPMENT_FEATURE_FLAGS, SUPPORTED_LANGUAGES } from '../../constants';
import { EVENT_FILTER_STORAGE_KEY } from '../../ducks/event-filter';
import { MAP_LAYER_FILTER_STORAGE_KEY } from '../../ducks/map-layer-filter';
import { MAP_POSITION_STORAGE_KEY } from '../../ducks/map-position';
import { PATROL_FILTER_STORAGE_KEY } from '../../ducks/patrol-filter';
import { useOptionalPersistence } from '../../reducers/storage-config';

import BetaToggles from '../../GlobalMenuDrawer/BetaToggles';
import ClusterMemberControl from '../../MapSettingsControl/ClusterMemberControl';
import InactiveRadioControl from '../../InactiveRadioControl';
import Map3DToggleControl from '../../MapSettingsControl/Map3DToggleControl';
import MapDataZoomSimplificationControl from '../../MapDataZoomSimplificationControl';
import MapLockControl from '../../MapLockControl';
import MapNamesControl from '../../MapNamesControl';
import MapTrackTimepointsControl from '../../MapTrackTimepointsControl';
import UserLocationMapControl from '../../UserLocationMapControl';

import styles from './styles.module.scss';

const ALERTS_URL = `${DAS_HOST}/alerts`;

const TAB_KEYS = {
  GENERAL: 'general',
  MAP: 'map',
  ALERTS: 'alerts',
};

const SettingsPane = () => {
  const { i18n } = useTranslation();

  const alertsEnabled = useSelector((state) => state.view.systemConfig.alerts_enabled);
  const hasUserLocation = useSelector((state) => !!state.view.userLocation);

  const [activeTabKey, setActiveTabKey] = useState(TAB_KEYS.GENERAL);

  const { restorable: eventFilterRestorable, setRestorable: setEventFilterIsRestorable } = useOptionalPersistence(EVENT_FILTER_STORAGE_KEY);
  const { restorable: patrolFilterRestorable, setRestorable: setPatrolFilterIsRestorable } = useOptionalPersistence(PATROL_FILTER_STORAGE_KEY);
  const { restorable: mapPositionRestorable, setRestorable: setMapPositionIsRestorable } = useOptionalPersistence(MAP_POSITION_STORAGE_KEY);
  const { restorable: mapLayersRestorable, setRestorable: setMapLayerFiltersAreRestorable } = useOptionalPersistence(MAP_LAYER_FILTER_STORAGE_KEY);

  const isI18nActive = DEVELOPMENT_FEATURE_FLAGS.I18N;

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

  const onSelectLanguage = useCallback((language) => {
    i18n.changeLanguage(language);
  }, [i18n]);

  return <Tabs
      defaultActiveKey={activeTabKey}
      fill
      onSelect={setActiveTabKey}
    >
    <Tab
      className={styles.tab}
      data-testid="settings-generalTab"
      eventKey={TAB_KEYS.GENERAL}
      title="General"
    >
      <section>
        <h3>App Refresh</h3>

        <h6>Preserve my settings on page refresh for</h6>

        <ul>
          <li>
            <label htmlFor={MAP_POSITION_STORAGE_KEY}>
              <input type='checkbox' id={MAP_POSITION_STORAGE_KEY} onChange={onMapPositionPersistToggle} name={MAP_POSITION_STORAGE_KEY} checked={mapPositionRestorable} />

              <span>Map Position &amp; Zoom Level</span>
            </label>
          </li>

          <li>
            <label htmlFor={EVENT_FILTER_STORAGE_KEY}>
              <input type='checkbox' id={EVENT_FILTER_STORAGE_KEY} onChange={onEventFilterPersistToggle} name={EVENT_FILTER_STORAGE_KEY} checked={eventFilterRestorable} />

              <span>Report Filters</span>
            </label>
          </li>

          <li>
            <label htmlFor={PATROL_FILTER_STORAGE_KEY}>
              <input type='checkbox' id={PATROL_FILTER_STORAGE_KEY} onChange={onPatrolFilterPersistToggle} name={PATROL_FILTER_STORAGE_KEY} checked={patrolFilterRestorable} />

              <span>Patrol Filters</span>
            </label>
          </li>

          <li>
            <label htmlFor={MAP_LAYER_FILTER_STORAGE_KEY}>
              <input type='checkbox' id={MAP_LAYER_FILTER_STORAGE_KEY} onChange={onMapLayersPersistToggle} name={MAP_LAYER_FILTER_STORAGE_KEY} checked={mapLayersRestorable} />

              <span>Map Layers</span>
            </label>
          </li>
        </ul>
      </section>

      <section>
        <h3>Experimental Features</h3>

        <BetaToggles />
      </section>

      {isI18nActive ? <section>
        <h3>Language</h3>

        <DropdownButton
          as={ButtonGroup}
          id="settings-language-dropdown"
          onSelect={onSelectLanguage}
          title={SUPPORTED_LANGUAGES[i18n.language]}
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([languageValue, languageDisplay]) => <Dropdown.Item
            as="button"
            eventKey={languageValue}
            key={languageValue}
          >
            {languageDisplay}
          </Dropdown.Item>)}
        </DropdownButton>
      </section> : null}
    </Tab>

    <Tab
      className={styles.tab}
      data-testid="settings-mapTab"
      eventKey={TAB_KEYS.MAP}
      title="Map"
    >
      <section>
        <h3>General</h3>

        <ul>
          <li><MapLockControl /></li>

          <li><Map3DToggleControl /></li>

          <li><MapDataZoomSimplificationControl /></li>
        </ul>
      </section>

      <section>
        <h3>Display</h3>

        <ul>
          <li><MapTrackTimepointsControl /></li>

          <li><InactiveRadioControl /></li>
        </ul>

        <h6>Cluster data when there is overlap for</h6>

        <ul>
          <li><ClusterMemberControl /></li>
        </ul>
      </section>

      <section>
        <h3>Map Markers</h3>

        <h6>Show names on map markers for</h6>

        <ul>
          <li><MapNamesControl /></li>
        </ul>
      </section>

      <ul className={styles.mapSettingsList}>
        {hasUserLocation && <li><UserLocationMapControl /></li>}
      </ul>
    </Tab>

    {alertsEnabled && <Tab
      className={`${styles.tab} ${styles.alertsTab}`}
      data-testid="settings-alertsTab"
      eventKey={TAB_KEYS.ALERTS}
      title="Alerts"
    >
      <iframe
        className={styles.alerts}
        data-testid="settings-alertsIframe"
        src={ALERTS_URL}
        style={{ width: '100%', height: '100vh' }}
        title='Configure your EarthRanger alerts'
      />
    </Tab>}
  </Tabs>;

};

export default SettingsPane;