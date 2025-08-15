import React, { useMemo } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { displayReportsOnMapState, hideSubjects } from '../../ducks/map-layer-filter';
import { INITIAL_TRACK_STATE } from '../../ducks/map-ui';
import { getSubjectGroups } from '../../selectors/subjects';
import { getUniqueSubjectGroupSubjectIDs } from '../../utils/subjects';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { TAB_KEYS } from './utils/constants';
import { updateHeatmapSubjects, updateTrackState } from '../../ducks/map-ui';

import AnalyzersTab from './AnalyzersTab';
import Checkmark from '../../Checkmark';
import EventsTab from './EventsTab';
import Filters from './Filters';
import FeaturesTab from './FeaturesTab';
import SubjectsTab from './SubjectsTab';

import * as styles from './styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const MapLayersTab = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.mapLayersTab' });

  const subjectGroups = useSelector(getSubjectGroups);

  const subjectIDs = useMemo(() => getUniqueSubjectGroupSubjectIDs(...subjectGroups), [subjectGroups]);

  const onClearAllMapLayers = () => {
    // We don't want to clear the map features.
    dispatch(hideSubjects(...subjectIDs));
    dispatch(displayReportsOnMapState(false));
    dispatch(updateTrackState(INITIAL_TRACK_STATE));
    dispatch(updateHeatmapSubjects([]));

    mapLayerTracker.track('Clicked Clear All link');
  };


  // The tabs that support filtering have mountOnEnter and unmountOnExit so
  // Bootstrap correctly calculates the dimension of the collapsibles that will
  // be open by default.
  return <>
    <Tabs
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
    </Tabs>

    <footer className={styles.footer}>
      <button
        aria-label={t('clearAllMapLayersButtonLabel')}
        className={styles.clearAllMapLayersButton}
        onClick={onClearAllMapLayers}
        type="button"
      >
        <Checkmark />

        {t('clearAllMapLayersButton')}
      </button>
    </footer>
  </>;
};

export default MapLayersTab;
