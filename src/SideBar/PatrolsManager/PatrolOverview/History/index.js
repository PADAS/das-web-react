import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../../../common/images/icons/arrow-up.svg';

import { extractAttachmentUpdates } from '../../../../utils/patrols';
import { SORT_DIRECTION } from '../../../../constants';

import DateTime from '../../../../DateTime';

import * as styles from './styles.module.scss';

const FILTERED_HISTORY_MESSAGES = ['Updated fields: ', 'Note Updated: '];

const History = ({ patrol }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.history' });

  const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.down);

  const updates = useMemo(() => {
    const segments = patrol.patrol_segments;
    const sortMultiplier = sortDirection === SORT_DIRECTION.up ? 1 : -1;

    return [
      ...patrol.updates,
      ...extractAttachmentUpdates(patrol.files),
      ...extractAttachmentUpdates(patrol.notes),
      ...segments.flatMap((segment) => segment.updates),
      ...segments.flatMap((segment) => extractAttachmentUpdates(segment.events)),
    ]
      .filter((update) => !FILTERED_HISTORY_MESSAGES.includes(update.message))
      .sort((a, b) => (new Date(b.time) - new Date(a.time)) * sortMultiplier)
      .map((update) => ({
        ...update,
        userDisplayName: `${update.user?.first_name ?? ''} ${update.user?.last_name ?? ''}`.trim() || null,
      }));
  }, [patrol, sortDirection]);

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
          onClick={() => setSortDirection(
            sortDirection === SORT_DIRECTION.up ? SORT_DIRECTION.down : SORT_DIRECTION.up
          )}
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

export default History;
