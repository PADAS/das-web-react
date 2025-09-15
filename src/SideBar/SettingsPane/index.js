import React from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { DAS_HOST } from '../../constants';

import GeneralTab from './GeneralTab';
import MapTab from './MapTab';

import * as styles from './styles.module.scss';

const ALERTS_URL = `${DAS_HOST}/alerts`;

const TAB_KEYS = { ALERTS: 'alerts', GENERAL: 'general', MAP: 'map' };

const SettingsPane = () => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.settingsPane' });

  const alertsEnabled = useSelector((state) => state.view.systemConfig.alerts_enabled);

  return <Tabs
      aria-labelledby="side-bar-tab-header"
      className={styles.tabs}
      defaultActiveKey={TAB_KEYS.GENERAL}
      variant="underline"
    >
    <Tab
      as="section"
      className={styles.tab}
      data-testid="settings-generalTab"
      eventKey={TAB_KEYS.GENERAL}
      title={t('generalTabTitle')}
    >
      <GeneralTab />
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
      as="section"
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