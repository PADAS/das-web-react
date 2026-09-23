import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { PATROLS_FEED_CATEGORY, TrackerContext, trackEventFactory } from '../../../utils/analytics';
import { selectPatrolsFeedMappedFromStore } from '../../../selectors/patrols';
import { sortPatrolList } from '../../../utils/patrols';
import { TAB_KEYS } from '../../../constants';
import useFetchPatrolsFeed from '../../useFetchPatrolsFeed';

import DetailViewLoader from '../DetailViewLoader';
import Filters from './Filters';
import PatrolRow from './PatrolRow';
import { ScrollRestoration } from '../../../SidebarScrollContext';

import * as styles from './styles.module.scss';

const patrolsFeedTracker = trackEventFactory(PATROLS_FEED_CATEGORY);

const PatrolsFeed = () => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolsFeed' });

  const { loadingPatrolsFeed } = useFetchPatrolsFeed();

  const patrolsFeedMappedFromStore = useSelector(selectPatrolsFeedMappedFromStore);

  const patrols = useMemo(() => sortPatrolList(patrolsFeedMappedFromStore), [patrolsFeedMappedFromStore]);

  return <TrackerContext.Provider value={patrolsFeedTracker}>
    <div className={styles.patrolsFeed}>
      <Filters resultCount={patrols.length} />

      {loadingPatrolsFeed && <DetailViewLoader className={styles.loader} />}

      {!loadingPatrolsFeed && patrols.length === 0 && <p className={styles.emptyStateMessage}>
        {t('emptyStateMessage')}
      </p>}

      {!loadingPatrolsFeed && patrols.length > 0 && <ScrollRestoration
        aria-label={t('patrolListLabel')}
        className={styles.patrolList}
        Component="ul"
        namespace={TAB_KEYS.PATROLS}
      >
        {patrols.map((patrol) => <PatrolRow key={patrol.id} patrol={patrol} />)}
      </ScrollRestoration>}
    </div>
  </TrackerContext.Provider>;
};

export default memo(PatrolsFeed);
