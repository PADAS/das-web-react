import React, { memo, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as HistoryIcon } from '../../common/images/icons/history.svg';

import { TrackerContext } from '../../utils/analytics';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import UpdateListItem from './UpdateListItem';

import * as styles from './styles.module.scss';

const FILTERED_UPDATE_MESSAGES = ['Updated fields: ', 'Note Updated: '];

const HistorySection = ({ className = '', updates }) => {
  const tracker = useContext(TrackerContext);
  const { t } = useTranslation('details-view', { keyPrefix: 'historySection' });

  const updatesRendered = useMemo(() => updates.reduce((accumulator, update) => {
    if (!FILTERED_UPDATE_MESSAGES.includes(update.message)) {
      accumulator.push({
        sortDate: new Date(update.time),
        node: <UpdateListItem
          key={update.time}
          message={update.message}
          time={update.time}
          user={update.user}
        />,
      });
    }

    return accumulator;
  }, []), [updates]);

  const onSort = useCallback((order) => {
    tracker.track(`Sort history section in ${order} order`);
  }, [tracker]);

  const [SortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(updatesRendered, onSort);

  return <div className={className} data-testid="detailView-historySection">
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <HistoryIcon />

        <h2>{t('sectionTitle')}</h2>
      </div>

      <div className={styles.actions}>
        <label>{t('timeLabel')}</label>

        <SortButton />
      </div>
    </div>

    <ul className={styles.historyList}>{sortedItemsRendered}</ul>
  </div>;
};

export default memo(HistorySection);
