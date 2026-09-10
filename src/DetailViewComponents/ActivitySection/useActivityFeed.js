import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { isGreaterThan } from '../../utils/datetime';
import { SYSTEM_CONFIG_FLAGS } from '../../constants';
import { TrackerContext } from '../../utils/analytics';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import AttachmentListItem from './AttachmentListItem';
import ContainedReportListItem from './ContainedReportListItem';
import DateListItem from './DateListItem';
import NoteListItem from './NoteListItem';

// Shared so that omitting an optional list does not hand the memos a new
// identity on every render.
const EMPTY_LIST = [];

const getCardId = (card) => card?.tmpId ?? card?.id;

const isUnsavedNewNote = (note) => !!note.tmpId && !note.originalText;

const useActivityFeed = ({
  attachments,
  containedReports,
  endTime = null,
  endTitle = null,
  milestones = EMPTY_LIST,
  newAttachments = EMPTY_LIST,
  newNotes = EMPTY_LIST,
  notes,
  onDeleteAttachment,
  onCancelNote,
  onDeleteNote,
  onChangeNote,
  onDoneNote,
  sortButtonComponent,
  startTime = null,
  startTitle = null,
}) => {
  const { t } = useTranslation('details-view', { keyPrefix: 'activitySection' });

  const tracker = useContext(TrackerContext);

  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);

  const [expandedCardIds, setExpandedCardIds] = useState(() => new Set());

  const enabledContainedEvents = useMemo(
    () => eventsEnabled ? containedReports : [],
    [containedReports, eventsEnabled]
  );

  const onCollapseCard = useCallback((card, analyticsLabel) => {
    setExpandedCardIds((prevExpandedCardIds) => {
      const cardId = getCardId(card);
      if (!prevExpandedCardIds.has(cardId)) {
        return prevExpandedCardIds;
      }

      const nextExpandedCardIds = new Set(prevExpandedCardIds);
      nextExpandedCardIds.delete(cardId);
      return nextExpandedCardIds;
    });

    if (analyticsLabel) {
      tracker.track(`Collapse ${analyticsLabel} card in the activity section`);
    }
  }, [tracker]);

  const onExpandCard = useCallback((card, analyticsLabel) => {
    setExpandedCardIds((prevExpandedCardIds) => {
      const cardId = getCardId(card);
      if (prevExpandedCardIds.has(cardId)) {
        return prevExpandedCardIds;
      }

      return new Set(prevExpandedCardIds).add(cardId);
    });

    if (analyticsLabel) {
      tracker.track(`Expand ${analyticsLabel} card in the activity section`);
    }
  }, [tracker]);

  const attachmentsSortableList = useMemo(() => attachments.map((attachment) => ({
    node: <AttachmentListItem
      attachment={attachment}
      isOpen={expandedCardIds.has(getCardId(attachment))}
      key={attachment.id}
      onCollapse={onCollapseCard}
      onExpand={onExpandCard}
    />,
    sortDate: new Date(attachment.updated_at || attachment.created_at || attachment.updates?.[0]?.time),
  })), [attachments, expandedCardIds, onCollapseCard, onExpandCard]);

  const newAttachmentsSortableList = useMemo(() => newAttachments.map((attachmentToAdd) => ({
    node: <AttachmentListItem
      attachment={attachmentToAdd.file}
      key={attachmentToAdd.file.name}
      onDelete={onDeleteAttachment}
      ref={attachmentToAdd.ref}
    />,
    sortDate: new Date(attachmentToAdd.creationDate),
  })), [newAttachments, onDeleteAttachment]);

  const containedEventsSortableList = useMemo(() => enabledContainedEvents.map((containedEvent) => ({
    node: <ContainedReportListItem
      isOpen={expandedCardIds.has(getCardId(containedEvent))}
      key={containedEvent.id}
      onCollapse={onCollapseCard}
      onExpand={onExpandCard}
      report={containedEvent}
    />,
    sortDate: new Date(containedEvent.time || containedEvent.updated_at),
  })), [enabledContainedEvents, expandedCardIds, onCollapseCard, onExpandCard]);

  const datesSortableList = useMemo(() => {
    const datesSortableList = [];

    const now = new Date();
    if (startTime && isGreaterThan(now, startTime)){
      datesSortableList.push({
        node: <DateListItem date={startTime} key="startTime" title={startTitle ?? t('dateItemStartTitle')} />,
        sortDate: new Date(startTime),
      });
    }

    milestones.forEach(({ date, id, title }) => {
      const milestoneDate = date ? new Date(date) : null;

      if (milestoneDate && !isGreaterThan(milestoneDate, now)) {
        datesSortableList.push({
          node: <DateListItem date={milestoneDate} key={`milestone-${id}`} title={title} />,
          sortDate: milestoneDate,
        });
      }
    });

    if (endTime && !isGreaterThan(endTime, now)){
      datesSortableList.push({
        node: <DateListItem date={endTime} key="endTime" title={endTitle ?? t('dateItemEndedTitle')} />,
        sortDate: new Date(endTime),
      });
    }

    return datesSortableList;
  }, [endTime, endTitle, milestones, startTime, startTitle, t]);

  const notesSortableList = useMemo(() => notes.map((note) => ({
    node: <NoteListItem
      isOpen={expandedCardIds.has(getCardId(note))}
      key={note.id}
      note={note}
      onCancel={onCancelNote}
      onChange={onChangeNote}
      onCollapse={onCollapseCard}
      onDone={onDoneNote}
      onExpand={onExpandCard}
    />,
    sortDate: new Date(note.updated_at || note.created_at || note.updates?.[0]?.time),
  })), [expandedCardIds, notes, onCancelNote, onChangeNote, onCollapseCard, onDoneNote, onExpandCard]);

  const newNotesSortableList = useMemo(() => newNotes.map((noteToAdd) => ({
    node: <NoteListItem
      isOpen={expandedCardIds.has(getCardId(noteToAdd))}
      key={noteToAdd.tmpId}
      note={noteToAdd}
      onCancel={onCancelNote}
      onChange={onChangeNote}
      onCollapse={onCollapseCard}
      onDelete={onDeleteNote}
      onDone={onDoneNote}
      onExpand={onExpandCard}
      ref={noteToAdd.ref}
    />,
    sortDate: new Date(noteToAdd.creationDate),
  })), [newNotes, expandedCardIds, onChangeNote, onCancelNote, onDoneNote, onCollapseCard, onDeleteNote, onExpandCard]);

  const sortableList = useMemo(() => [
    ...attachmentsSortableList,
    ...newAttachmentsSortableList,
    ...containedEventsSortableList,
    ...datesSortableList,
    ...notesSortableList,
    ...newNotesSortableList,
  ], [
    attachmentsSortableList,
    containedEventsSortableList,
    datesSortableList,
    newAttachmentsSortableList,
    newNotesSortableList,
    notesSortableList,
  ]);

  const onSort = useCallback((order) => {
    tracker.track(`Sort activity section in ${order} order`);
  }, [tracker]);

  const [sortButton, sortedItems] = useSortedNodesWithToggleBtn(sortableList, onSort, undefined, sortButtonComponent);

  const imageAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.file_type === 'image'),
    [attachments]
  );

  const unsavedNewNoteIds = useMemo(
    () => newNotes.filter(isUnsavedNewNote).map(getCardId),
    [newNotes]
  );

  const collapsibleCardIds = useMemo(() => [
    ...enabledContainedEvents,
    ...imageAttachments,
    ...notes,
    ...newNotes.filter((note) => !isUnsavedNewNote(note)),
  ].map(getCardId), [enabledContainedEvents, imageAttachments, newNotes, notes]);

  const hasCollapsibleItems = collapsibleCardIds.length > 0;
  // Cards dropped while expanded leave their id behind, so this asks the cards on screen instead
  // of comparing counts against the set.
  const areAllItemsExpanded = hasCollapsibleItems
    && collapsibleCardIds.every((cardId) => expandedCardIds.has(cardId));

  const onToggleExpandAll = useCallback(() => {
    if (hasCollapsibleItems) {
      setExpandedCardIds(new Set(areAllItemsExpanded
        ? unsavedNewNoteIds
        : [...unsavedNewNoteIds, ...collapsibleCardIds]));

      tracker.track(`${areAllItemsExpanded ? 'Collapse' : 'Expand'} All`);
    }
  }, [areAllItemsExpanded, collapsibleCardIds, hasCollapsibleItems, tracker, unsavedNewNoteIds]);

  useEffect(() => {
    newNotes.filter(isUnsavedNewNote).forEach((note) => onExpandCard(note));
  }, [newNotes, onExpandCard]);

  return {
    areAllItemsExpanded,
    hasCollapsibleItems,
    hasItems: sortableList.length > 0,
    onToggleExpandAll,
    sortButton,
    sortedItems,
  };
};

export default useActivityFeed;
