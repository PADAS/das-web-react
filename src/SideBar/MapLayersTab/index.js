import React from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useTranslation } from 'react-i18next';

import { TAB_KEYS } from './utils/constants';

import AnalyzersTab from './AnalyzersTab';
import EventsTab from './EventsTab';
import Filters from './Filters';
import FeaturesTab from './FeaturesTab';
import SubjectsTab from './SubjectsTab';

import * as styles from './styles.module.scss';

const MapLayersTab = () => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.mapLayersTab' });

  // The tabs that support filtering have mountOnEnter and unmountOnExit so
  // Bootstrap correctly calculates the dimension of the collapsibles that will
  // be open by default.
  return <Tabs
      aria-labelledby="side-bar-tab-header"
      className={styles.tabs}
      defaultActiveKey={TAB_KEYS.SUBJECTS}
      variant="underline"
    >
    <Tab
      as="section"
      className={styles.tab}
      eventKey={TAB_KEYS.SUBJECTS}
      mountOnEnter
      title={t('subjectsTabTitle')}
      unmountOnExit
    >
      <Filters tab={TAB_KEYS.SUBJECTS} />

      <SubjectsTab />
    </Tab>

    <Tab
      as="section"
      className={styles.tab}
      eventKey={TAB_KEYS.FEATURES}
      mountOnEnter
      title={t('featuresTabTitle')}
      unmountOnExit
    >
      <Filters tab={TAB_KEYS.FEATURES} />

      <FeaturesTab />
    </Tab>

    <Tab
      as="section"
      className={styles.tab}
      eventKey={TAB_KEYS.ANALYZERS}
      mountOnEnter
      title={t('analyzersTabTitle')}
      unmountOnExit
    >
      <Filters tab={TAB_KEYS.ANALYZERS} />

      <AnalyzersTab />
    </Tab>

    <Tab
      as="section"
      className={styles.tab}
      eventKey={TAB_KEYS.EVENTS}
      title={t('eventsTabTitle')}
    >
      <EventsTab />
    </Tab>
  </Tabs>;
};

export default MapLayersTab;
