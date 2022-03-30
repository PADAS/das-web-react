import React, { useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import orderBy from 'lodash/orderBy';

import { ReactComponent as ArrowDown } from '../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUp } from '../../common/images/icons/arrow-up.svg';

import { extractAttachmentUpdates } from '../../utils/patrols';

import TimeAgo from '../../TimeAgo';

import styles from './styles.module.scss';

const ASCENDING_TIME_SORT_ORDER = 'asc';
const DESCENDING_TIME_SORT_ORDER = 'desc';

const HistoryListItem = ({ date, message, secondaryMessage, user }) => <div
    className={styles.historyListItem}
    data-testid="historyListItem"
  >
  <div>
    <p className="user">{user}</p>
    <p className="message">{message}</p>
    <p className="secondaryMessage">{secondaryMessage}</p>
  </div>

  <TimeAgo className="date" date={date} />
</div>;

const HistoryTab = ({ patrolForm }) => {
  const [timeSortOrder, setTimeSortOrder] = useState(DESCENDING_TIME_SORT_ORDER);

  const updates = useMemo(() => {
    if (!patrolForm.updates) return [];

    const topLevelUpdate = patrolForm.updates;
    const [firstLeg] = patrolForm.patrol_segments;
    const { updates: segmentUpdates } = firstLeg;
    const noteUpdates = extractAttachmentUpdates(patrolForm.notes);
    const fileUpdates = extractAttachmentUpdates(patrolForm.files);
    const eventUpdates = extractAttachmentUpdates(firstLeg.events);
    const allUpdates = [...topLevelUpdate, ...segmentUpdates, ...noteUpdates, ...fileUpdates, ...eventUpdates];

    return orderBy(allUpdates, [(item) => new Date(item.time)], [timeSortOrder]);
  }, [patrolForm, timeSortOrder]);

  return <>
    <div className={styles.header}>
      Time
      <Button
        className={styles.timeSortButton}
        onClick={() => setTimeSortOrder(timeSortOrder === DESCENDING_TIME_SORT_ORDER
          ? ASCENDING_TIME_SORT_ORDER : DESCENDING_TIME_SORT_ORDER)}
        type="button"
        variant={timeSortOrder === DESCENDING_TIME_SORT_ORDER ? 'secondary' : 'primary'}
      >
        {timeSortOrder === DESCENDING_TIME_SORT_ORDER ? <ArrowDown /> : <ArrowUp />}
      </Button>
    </div>

    <div className={styles.historyList}>
      {/* TODO: backend integration will take place here */}
      {updates.map((update) => <HistoryListItem
        date={update.time}
        key={update.time}
        message={update.message}
        secondaryMessage=""
        user={`${update.user.first_name} ${update.user.last_name}`}
      />)}
    </div>
  </>;
};

export default HistoryTab;
