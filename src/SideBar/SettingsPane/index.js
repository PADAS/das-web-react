import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import ClusterMemberControl from '../../MapSettingsControl/ClusterMemberControl';
import InactiveRadioControl from '../../InactiveRadioControl';
import Map3DToggleControl from '../../MapSettingsControl/Map3DToggleControl';
import MapDataZoomSimplificationControl from '../../MapDataZoomSimplificationControl';
import MapLockControl from '../../MapLockControl';
import MapNamesControl from '../../MapNamesControl';
import MapTrackTimepointsControl from '../../MapTrackTimepointsControl';
import UserLocationMapControl from '../../UserLocationMapControl';

import BetaToggles from '../../GlobalMenuDrawer/BetaToggles';

import styles from './styles.module.scss';

import { DAS_HOST } from '../../constants';

const ALERTS_URL = `${DAS_HOST}/alerts`;


const TAB_KEYS = {
  GENERAL: 'general',
  MAP: 'map',
  ALERTS: 'alerts',
};

const SettingsPane = () => {
  const [activeTabKey, setActiveTabKey] = useState(TAB_KEYS.GENERAL);
  const hasUserLocation = useSelector((state) => !!state.view.userLocation);
  const alertsEnabled = useSelector((state) => state.view.systemConfig.alerts_enabled);

  const onTabSelect = useCallback((tab) => {
    setActiveTabKey(tab);
  }, []);


  return <Tabs
  defaultActiveKey={activeTabKey}
  fill
  onSelect={onTabSelect}
    >
    <Tab
    data-testid="settings-generalTab"
    className={styles.tab}
    eventKey={TAB_KEYS.GENERAL}
    title="General">
      <section>
        <h3>App Refresh</h3>
        <h6>Preserve my settings on refresh for</h6>
        <ul>
          <li>
            <label>
              <input type='checkbox' />
              <span>Map Position & Zoom Level</span>
            </label>
          </li>
          <li>
            <label>
              <input type='checkbox' />
              <span>Map Layer Selections</span>
            </label>
          </li>
          <li>
            <label>
              <input type='checkbox' />
              <span>Report Filters</span>
            </label>
          </li>
          <li>
            <label>
              <input type='checkbox' />
              <span>Patrol Filters</span>
            </label>
          </li>
        </ul>
      </section>
      {/* <section>
        <h3>Sound</h3>
        <h6>Play a sound for new activity for</h6>
        <ul>
          <li>
            <label>
              <input type='checkbox' />
              <span>Reports</span>
            </label>
          </li>
        </ul>
      </section> */}
      <section>
        <h3>Experimental Features</h3>
        <BetaToggles />
      </section>
    </Tab>

    <Tab
      data-testid="settings-mapTab"
      className={styles.tab}
      eventKey={TAB_KEYS.MAP}
      title="Map">
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
      data-testid="settings-alertsTab"
      className={`${styles.tab} ${styles.alertsTab}`}
      eventKey={TAB_KEYS.ALERTS}
      title="Alerts">
      <iframe
        className={styles.alerts}
        style={{ width: '100%', height: '100vh' }}
        src={ALERTS_URL}
        title='Configure your EarthRanger alerts'
      />
    </Tab>}
  </Tabs>;

};

export default SettingsPane;