import React, { memo, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../../../common/images/icons/arrow-up.svg';

import { ASCENDING_SORT_ORDER, DESCENDING_SORT_ORDER, SORT_DIRECTION } from '../../../../constants';
import { extractAttachmentUpdates } from '../../../../utils/patrols';
import { TrackerContext } from '../../../../utils/analytics';

import DateTime from '../../../../DateTime';

import * as styles from './styles.module.scss';

const FILTERED_HISTORY_MESSAGES = ['Updated fields: ', 'Note Updated: '];

const History = ({ patrol }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.history' });

  const tracker = useContext(TrackerContext);

  const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.down);

  const updates = useMemo(() => {
    const segments = patrol.patrol_segments;
    const sortMultiplier = sortDirection === SORT_DIRECTION.up ? -1 : 1;

    return [
      ...(patrol.updates ?? []),
      ...extractAttachmentUpdates(patrol.files ?? []),
      ...extractAttachmentUpdates(patrol.notes ?? []),
      ...segments.flatMap((segment) => segment.updates ?? []),
      ...segments.flatMap((segment) => extractAttachmentUpdates(segment.events ?? [])),
    ]
      .filter((update) => !FILTERED_HISTORY_MESSAGES.includes(update.message))
      .sort((a, b) => (new Date(b.time) - new Date(a.time)) * sortMultiplier)
      .map((update) => ({
        ...update,
        userDisplayName: `${update.user?.first_name ?? ''} ${update.user?.last_name ?? ''}`.trim() || null,
      }));
  }, [patrol, sortDirection]);

  const onToggleSortDirection = () => {
    const newSortDirection = sortDirection === SORT_DIRECTION.up ? SORT_DIRECTION.down : SORT_DIRECTION.up;

    setSortDirection(newSortDirection);

    tracker.track(`Sort history section in ${
      newSortDirection === SORT_DIRECTION.up ? ASCENDING_SORT_ORDER : DESCENDING_SORT_ORDER
    } order`);
  };

  return <div className={styles.history}>
    <div className={styles.header}>
      <div className={styles.actions}>
        <span className={styles.timeLabel}>{t('timeLabel')}</span>

        <button
          aria-label={t(`sortDirectionButtonLabel.${sortDirection}`)}
          aria-pressed={sortDirection === SORT_DIRECTION.up}
          className={`${styles.sortDirectionButton} ${
            sortDirection === SORT_DIRECTION.up ? styles.active : ''
          }`}
          onClick={onToggleSortDirection}
          title={t(`sortDirectionButtonLabel.${sortDirection}`)}
          type="button"
        >
          {sortDirection === SORT_DIRECTION.down
            ? <ArrowDownIcon aria-hidden="true" />
            : <ArrowUpIcon aria-hidden="true" />}
        </button>
      </div>
    </div>

    <ul className={styles.updatesList} role="list">
      {updates.map((update) => <li className={styles.updateItem} key={`${update.time}-${update.message}`}>
        <div className={styles.updateContent}>
          {update.userDisplayName && <span className={styles.updateUser}>{update.userDisplayName}</span>}

          <span className={styles.updateMessage}>{update.message}</span>
        </div>

        <DateTime className={styles.updateDate} date={update.time} showElapsed={false} />
      </li>)}
    </ul>
  </div>;
};

export default memo(History);
