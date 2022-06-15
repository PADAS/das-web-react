import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as ArrowDownIcon } from '../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../common/images/icons/arrow-up.svg';
import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import { ASCENDING_SORT_ORDER, DESCENDING_SORT_ORDER } from '../../constants';

import Attachment from './Attachment';
import Note from './Note';

import styles from './styles.module.scss';

const ActivitySection = ({
  attachmentsToAdd,
  notesToAdd,
  onDeleteAttachment,
  reportAttachments,
  reportNotes,
  reportTracker,
  setNotesToAdd,
  setReportNotes,
}) => {
  const [timeSortOrder, setTimeSortOrder] = useState(DESCENDING_SORT_ORDER);
  const [cardsExpanded, setCardsExpanded] = useState([]);

  const reportAttachmentsRendered = useMemo(() => reportAttachments.map((reportAttachment) => ({
    date: reportAttachment.updated_at || reportAttachment.created_at,
    node: <Attachment attachment={reportAttachment} key={reportAttachment.id} reportTracker={reportTracker} />,
  })), [reportAttachments, reportTracker]);

  const attachmentsToAddRendered = useMemo(() => attachmentsToAdd.map((attachmentToAdd) => ({
    date: attachmentToAdd.creationDate,
    node: <Attachment
      attachment={attachmentToAdd.file}
      key={attachmentToAdd.file.name}
      onDeleteAttachment={onDeleteAttachment}
    />,
  })), [attachmentsToAdd, onDeleteAttachment]);

  const reportNotesRendered = useMemo(() => reportNotes.map((reportNote) => ({
    date: reportNote.updated_at || reportNote.created_at,
    node: <Note
      cardsExpanded={cardsExpanded}
      key={reportNote.id}
      note={reportNote}
      reportNotes={reportNotes}
      setCardsExpanded={setCardsExpanded}
      setReportNotes={setReportNotes}
     />,
  })), [cardsExpanded, reportNotes, setReportNotes]);

  const notesToAddRendered = useMemo(() => notesToAdd.map((noteToAdd) => ({
    date: noteToAdd.creationDate,
    node: <Note
      cardsExpanded={cardsExpanded}
      key={noteToAdd.text}
      note={noteToAdd}
      notesToAdd={notesToAdd}
      setCardsExpanded={setCardsExpanded}
      setNotesToAdd={setNotesToAdd}
    />,
  })), [cardsExpanded, notesToAdd, setNotesToAdd]);

  const sortedItemsRendered = useMemo(
    () => [...reportAttachmentsRendered, ...reportNotesRendered, ...attachmentsToAddRendered, ...notesToAddRendered]
      .sort((a, b) => {
        if (timeSortOrder === DESCENDING_SORT_ORDER) {
          return a.date > b.date ? 1 : -1;
        }
        return a.date < b.date ? 1 : -1;
      })
      .map((item) => item.node),
    [attachmentsToAddRendered, notesToAddRendered, reportAttachmentsRendered, reportNotesRendered, timeSortOrder]
  );

  const onExpandAll = useCallback(() => {
    setCardsExpanded([...reportNotes, ...notesToAdd]);
  }, [notesToAdd, reportNotes]);

  const onToggleSort = useCallback(() => {
    setTimeSortOrder(timeSortOrder === DESCENDING_SORT_ORDER ? ASCENDING_SORT_ORDER : DESCENDING_SORT_ORDER);
  }, [timeSortOrder]);

  useEffect(() => {
    const newNotesToExpand = notesToAdd.filter((noteToAdd) => !noteToAdd.text && !cardsExpanded.includes(noteToAdd));

    if (newNotesToExpand.length > 0) {
      setCardsExpanded([...cardsExpanded, ...newNotesToExpand]);
    }
  }, [cardsExpanded, notesToAdd]);

  return <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <BulletListIcon />

        <h2>Activity</h2>
      </div>

      {sortedItemsRendered.length > 0 && <div className={styles.actions}>
        <label>Time</label>

        <Button
          className={styles.timeSortButton}
          data-testid="reportDetailView-activitySection-timeSortButton"
          onClick={onToggleSort}
          type="button"
          variant={timeSortOrder === DESCENDING_SORT_ORDER ? 'secondary' : 'primary'}
        >
          {timeSortOrder === DESCENDING_SORT_ORDER ? <ArrowDownIcon /> : <ArrowUpIcon />}
        </Button>

        <Button
          className={styles.expandAllButton}
          data-testid="reportDetailView-activitySection-expandAllButton"
          onClick={onExpandAll}
          type="button"
          variant="secondary"
        >
          Expand All
        </Button>
      </div>}
    </div>

    {sortedItemsRendered.length > 0 && <ul className={styles.list}>{sortedItemsRendered}</ul>}
  </>;
};

ActivitySection.propTypes = {
  attachmentsToAdd: PropTypes.arrayOf(PropTypes.shape({
    creationDate: PropTypes.string,
    file: PropTypes.shape({
      name: PropTypes.string,
    }),
  })).isRequired,
  notesToAdd: PropTypes.arrayOf(PropTypes.shape({
    creationDate: PropTypes.string,
    text: PropTypes.string,
  })).isRequired,
  onDeleteAttachment: PropTypes.func.isRequired,
  reportAttachments: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
  reportNotes: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
  reportTracker: PropTypes.object.isRequired,
  setNotesToAdd: PropTypes.func.isRequired,
  setReportNotes: PropTypes.func.isRequired,
};

export default memo(ActivitySection);
