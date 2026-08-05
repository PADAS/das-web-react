import React, { useEffect, useRef } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import { fetchPatrol } from '../../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../../utils/tracks';
import { getCurrentIdFromURL } from '../../../utils/navigation';

import Footer from './Footer';
import Header from './Header';
import History from './History';
import Overview from './Overview';

import * as styles from './styles.module.scss';

const TAB_KEYS = { HISTORY: 'history', OVERVIEW: 'overview' };
const LOADER_SIZE = 50;

const PatrolOverview = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview' });

  const patrolId = getCurrentIdFromURL(location.pathname);

  const patrol = useSelector((state) => state.data.patrolStore[patrolId]);

  const printableContentRef = useRef(null);

  useEffect(() => {
    // Fetch the patrol if it is not in the store.
    if (patrolId && !patrol) {
      dispatch(fetchPatrol(patrolId));
    }
  }, [dispatch, patrol, patrolId]);

  useEffect(() => {
    // Fetches the patrol leg tracks if necessary.
    patrol?.patrol_segments?.forEach((segment) => {
      if (segment.leader?.id) {
        fetchTracksIfNecessary(
          [segment.leader.id],
          {
            optionalDateBoundaries: {
              since: segment.time_range?.start_time,
              until: segment.time_range?.end_time,
            },
          },
        );
      }
    });
  }, [patrol]);

  if (!patrol) {
    return <div className={styles.loaderWrapper} data-testid="patrolOverview-loader">
      <MoonLoader size={LOADER_SIZE} />
    </div>;
  }

  return <div className={styles.patrolOverview} ref={printableContentRef}>
    <Header patrol={patrol} printableContentRef={printableContentRef} />

    <div className={styles.tabsContainer}>
      <Tabs
        aria-label={t('tabsLabel')}
        className={styles.tabs}
        defaultActiveKey={TAB_KEYS.OVERVIEW}
        variant="underline"
      >
        <Tab
          as="section"
          className={styles.tab}
          data-testid="patrolOverview-overviewTab"
          eventKey={TAB_KEYS.OVERVIEW}
          title={t('overviewTabTitle')}
        >
          <Overview patrol={patrol} />
        </Tab>

        <Tab
          as="section"
          className={styles.tab}
          data-testid="patrolOverview-historyTab"
          eventKey={TAB_KEYS.HISTORY}
          title={t('historyTabTitle')}
        >
          <History patrol={patrol} />
        </Tab>
      </Tabs>
    </div>

    <Footer />
  </div>;
};

export default PatrolOverview;
