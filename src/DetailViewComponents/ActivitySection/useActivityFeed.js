import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { areCardsEquals } from '../utils';
import { isGreaterThan } from '../../utils/datetime';
import { SYSTEM_CONFIG_FLAGS } from '../../constants';
import { TrackerContext } from '../../utils/analytics';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import AttachmentListItem from './AttachmentListItem';
import ContainedReportListItem from './ContainedReportListItem';
import DateListItem from './DateListItem';
import NoteListItem from './NoteListItem';

const ATTACHMENT_ANALYTICS_SUBSTRING = 'attachment';
const CONTAINED_REPORT_ANALYTICS_SUBSTRING = 'contained report';
const EXISTING_NOTE_ANALYTICS_SUBSTRING = 'existing note';
const NEW_NOTE_ANALYTICS_SUBSTRING = 'new note';

const useActivityFeed = ({
  attachments,
  containedReports,
  endTime = null,
  newAttachments = [],
  newNotes = [],
  notes,
  onDeleteAttachment,
  onCancelNote,
  onDeleteNote,
  onChangeNote,
  onDoneNote,
  sortButtonComponent,
  startTime = null,
}) => {
  const tracker = useContext(TrackerContext);
  const { t } = useTranslation('details-view', { keyPrefix: 'activitySection' });

  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);

  const [cardsExpanded, setCardsExpanded] = useState([]);

  const onCollapseCard = useCallback((card, analyticsLabel) => {
    const isCardExpanded = !!cardsExpanded.find((cardExpanded) => areCardsEquals(cardExpanded, card));
    if (isCardExpanded) {
      if (analyticsLabel) {
        tracker.track(`Collapse ${analyticsLabel} card in the activity section`);
      }
      const filtered = [...cardsExpanded.filter((cardExpanded) => !areCardsEquals(cardExpanded, card))];
      setCardsExpanded(filtered);
    }
  }, [cardsExpanded, tracker]);

  const onExpandCard = useCallback((card, analyticsLabel) => {
    const isCardExpanded = !!cardsExpanded.find((cardExpanded) => areCardsEquals(cardExpanded, card));
    if (!isCardExpanded) {
      if (analyticsLabel) {
        tracker.track(`Expand ${analyticsLabel} card in the activity section`);
      }

      setCardsExpanded([...cardsExpanded, card]);
    }
  }, [cardsExpanded, tracker]);

  const attachmentsRendered = useMemo(() => attachments.map((attachment) => ({
    sortDate: new Date(attachment.updated_at || attachment.created_at || attachment.updates[0].time),
    node: <AttachmentListItem
      attachment={attachment}
      cardsExpanded={cardsExpanded}
      key={attachment.id}
      onCollapse={() => onCollapseCard(attachment, ATTACHMENT_ANALYTICS_SUBSTRING)}
      onExpand={() => onExpandCard(attachment, ATTACHMENT_ANALYTICS_SUBSTRING)}
    />,
  })), [attachments, cardsExpanded, onCollapseCard, onExpandCard]);

  const newAttachmentsRendered = useMemo(() => newAttachments.map((attachmentToAdd) => ({
    sortDate: new Date(attachmentToAdd.creationDate),
    node: <AttachmentListItem
      attachment={attachmentToAdd.file}
      key={attachmentToAdd.file.name}
      onDelete={() => onDeleteAttachment(attachmentToAdd.file)}
      ref={attachmentToAdd.ref}
    />,
  })), [newAttachments, onDeleteAttachment]);

  const containedReportsRendered = useMemo(() => eventsEnabled
    ? containedReports.map((containedReport) => ({
      sortDate: new Date(containedReport.time || containedReport.updated_at),
      node: <ContainedReportListItem
        cardsExpanded={cardsExpanded}
        key={containedReport.id}
        onCollapse={() => onCollapseCard(containedReport, CONTAINED_REPORT_ANALYTICS_SUBSTRING)}
        onExpand={() => onExpandCard(containedReport, CONTAINED_REPORT_ANALYTICS_SUBSTRING)}
        report={containedReport}
      />,
    }))
    : [], [cardsExpanded, containedReports, eventsEnabled, onCollapseCard, onExpandCard]);

  const datesRendered = useMemo(() => {
    const dates = [];
    const now = new Date();
    if (startTime && isGreaterThan(now, startTime)){
      dates.push({
        node: <DateListItem date={startTime} key="startTime" title={t('dateItemStartTitle')} />,
        sortDate: new Date(startTime),
      });
    }

    if (endTime && !isGreaterThan(endTime, now)){
      dates.push({
        node: <DateListItem date={endTime} key="endTime" title={t('dateItemEndedTitle')} />,
        sortDate: new Date(endTime),
      });
    }

    return dates;
  }, [endTime, startTime, t]);

  const notesRendered = useMemo(() => notes.map((note) => ({
    sortDate: new Date(note.updated_at || note.created_at || note.updates[0].time),
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={note.id}
      note={note}
      onCollapse={() => onCollapseCard(note, EXISTING_NOTE_ANALYTICS_SUBSTRING)}
      onExpand={() => onExpandCard(note, EXISTING_NOTE_ANALYTICS_SUBSTRING)}
      onCancel={onCancelNote}
      onChange={onChangeNote}
      onDone={onDoneNote}
    />,
  })), [cardsExpanded, notes, onCancelNote, onCollapseCard, onDoneNote, onExpandCard, onChangeNote]);

  const newNotesRendered = useMemo(() => newNotes.map((noteToAdd) => ({
    sortDate: new Date(noteToAdd.creationDate),
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={noteToAdd.tmpId}
      note={noteToAdd}
      onCollapse={() => onCollapseCard(noteToAdd, NEW_NOTE_ANALYTICS_SUBSTRING)}
      onDelete={() => onDeleteNote(noteToAdd)}
      onExpand={() => onExpandCard(noteToAdd, NEW_NOTE_ANALYTICS_SUBSTRING)}
      ref={noteToAdd.ref}
      onChange={onChangeNote}
      onCancel={onCancelNote}
      onDone={onDoneNote}
    />,
  })), [newNotes, cardsExpanded, onChangeNote, onCancelNote, onDoneNote, onCollapseCard, onDeleteNote, onExpandCard]);

  const sortableList = useMemo(() => [
    ...attachmentsRendered,
    ...newAttachmentsRendered,
    ...containedReportsRendered,
    ...datesRendered,
    ...notesRendered,
    ...newNotesRendered,
  ], [
    attachmentsRendered,
    containedReportsRendered,
    datesRendered,
    newAttachmentsRendered,
    newNotesRendered,
    notesRendered,
  ]);

  const onSort = useCallback((order) => {
    tracker.track(`Sort activity section in ${order} order`);
  }, [tracker]);

  const [SortButton, sortedItems] = useSortedNodesWithToggleBtn(sortableList, onSort, undefined, sortButtonComponent);

  const imageAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.file_type === 'image'),
    [attachments]
  );

  const collapsibleItemsCount = containedReportsRendered.length +
    imageAttachments.length +
    notes.length +
    newNotes.length;

  const hasCollapsibleItems = collapsibleItemsCount > 0;

  const areAllItemsExpanded = useMemo(
    () => hasCollapsibleItems && cardsExpanded.length === collapsibleItemsCount,
    [cardsExpanded.length, collapsibleItemsCount, hasCollapsibleItems],
  );

  const onToggleExpandAll = useCallback(() => {
    tracker.track(`${areAllItemsExpanded ? 'Collapse' : 'Expand'} All`);

    setCardsExpanded(areAllItemsExpanded ? [] : [...containedReports, ...imageAttachments, ...notes, ...newNotes]);
  }, [areAllItemsExpanded, containedReports, imageAttachments, notes, newNotes, tracker]);

  useEffect(() => {
    notes.filter((note) => !note.id && !note.text).forEach((note) => onExpandCard(note));
    newNotes.filter((note) => !note.text).forEach((note) => onExpandCard(note));
  }, [notes, newNotes, onExpandCard]);

  return {
    areAllItemsExpanded,
    hasCollapsibleItems,
    hasItems: sortableList.length > 0,
    onToggleExpandAll,
    SortButton,
    sortedItems,
  };
};

export default useActivityFeed;
