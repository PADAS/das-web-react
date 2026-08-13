import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { addPatrolSegmentToEvent } from '../../../utils/events';
import { convertFileListToArray, filterDuplicateUploadFilenames } from '../../../utils/file';
import { fetchPatrol } from '../../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../../utils/tracks';
import { PATROL_OVERVIEW_CATEGORY, TrackerContext, trackEventFactory } from '../../../utils/analytics';
import { TAB_KEYS as SIDEBAR_TAB_KEYS } from '../../../constants';
import { uuid } from '../../../utils/string';

import Footer from './Footer';
import Header from './Header';
import History from './History';
import NavigationPromptModal from '../../../NavigationPromptModal';
import Overview from './Overview';

import * as activitySectionStyles from '../../../DetailViewComponents/ActivitySection/styles.module.scss';
import * as styles from './styles.module.scss';

const patrolOverviewTracker = trackEventFactory(PATROL_OVERVIEW_CATEGORY);

const LOADER_SIZE = 50;

const NEW_ACTIVITY_SECTION_ITEM_SCROLL_DELAY = parseFloat(activitySectionStyles.cardToggleTransitionTime);

const TAB_KEYS = { HISTORY: 'history', OVERVIEW: 'overview' };
const TAB_LABELS = { [TAB_KEYS.HISTORY]: 'History', [TAB_KEYS.OVERVIEW]: 'Overview' };

const PatrolOverview = () => {
  const dispatch = useDispatch();
  const { patrolId } = useParams();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview' });

  const patrol = useSelector((state) => state.data.patrolStore[patrolId]);

  const printableContentRef = useRef(null);
  const newAttachmentRef = useRef(null);
  const newNoteRef = useRef(null);

  const [editedExistingNotes, setEditedExistingNotes] = useState({});
  const [isTitleDirty, setIsTitleDirty] = useState(false);
  const [newAttachments, setNewAttachments] = useState([]);
  const [newNotes, setNewNotes] = useState([]);

  const existingAttachments = useMemo(() => Array.isArray(patrol?.files) ? patrol.files : [], [patrol]);

  const patrolNotes = useMemo(() => Array.isArray(patrol?.notes) ? patrol.notes : [], [patrol]);

  const existingNotes = useMemo(() => patrolNotes.map((note) => {
    const edition = editedExistingNotes[note.id];

    return {
      ...note,
      originalText: edition?.originalText ?? note.text,
      text: edition?.text ?? note.text,
    };
  }), [editedExistingNotes, patrolNotes]);

  const hasEditedExistingNotes = useMemo(
    () => patrolNotes.some((note) => (editedExistingNotes[note.id]?.text ?? note.text) !== note.text),
    [editedExistingNotes, patrolNotes]
  );

  const onAddEvent = useCallback(async (saveResults) => {
    const [firstResult] = Array.isArray(saveResults) ? saveResults : [saveResults];
    const newEventId = firstResult.data.data.id;

    const lastSegment = patrol.patrol_segments[patrol.patrol_segments.length - 1];

    await addPatrolSegmentToEvent(lastSegment.id, newEventId);

    patrolOverviewTracker.track('Link new event to patrol');

    await dispatch(fetchPatrol(patrolId));
  }, [dispatch, patrol, patrolId]);

  const addEventFormProps = useMemo(() => ({
    isPatrolReport: true,
    onSaveSuccess: onAddEvent,
    redirectTo: [{ pathname: `/${SIDEBAR_TAB_KEYS.PATROLS}/${patrolId}` }],
  }), [onAddEvent, patrolId]);

  const onAddNote = useCallback(() => {
    setNewNotes((prevNewNotes) => [
      ...prevNewNotes,
      { creationDate: new Date().toISOString(), ref: newNoteRef, text: '', tmpId: uuid() },
    ]);

    setTimeout(
      () => newNoteRef.current?.scrollIntoView?.({ behavior: 'smooth' }),
      NEW_ACTIVITY_SECTION_ITEM_SCROLL_DELAY
    );

    patrolOverviewTracker.track('Added Note');
  }, []);

  const onChangeNote = useCallback((originalNote, event) => {
    if (originalNote.tmpId) {
      setNewNotes((prevNewNotes) => prevNewNotes.map(
        (note) => note.tmpId === originalNote.tmpId ? { ...note, text: event.target.value } : note
      ));
    } else {
      setEditedExistingNotes((prevEditedExistingNotes) => ({
        ...prevEditedExistingNotes,
        [originalNote.id]: { originalText: originalNote.originalText, text: event.target.value },
      }));
    }
  }, []);

  const onDoneNote = useCallback((editedNote) => {
    if (editedNote.tmpId) {
      setNewNotes((prevNewNotes) => prevNewNotes.map((note) => {
        if (note.tmpId === editedNote.tmpId) {
          // The trimmed text becomes the original one, so the note no longer
          // counts as being written.
          const text = note.text.trim();
          return { ...note, originalText: text, text };
        }
        return note;
      }));

      patrolOverviewTracker.track('Save new note');
    } else {
      setEditedExistingNotes((prevEditedExistingNotes) => {
        const text = editedNote.text.trim();

        return { ...prevEditedExistingNotes, [editedNote.id]: { originalText: text, text } };
      });

      patrolOverviewTracker.track('Save existing note');
    }
  }, []);

  const onCancelNote = useCallback((editedNote) => {
    if (editedNote.tmpId) {
      setNewNotes((prevNewNotes) => prevNewNotes.map(
        (note) => note.tmpId === editedNote.tmpId ? { ...note, text: note.originalText } : note
      ));
    } else {
      setEditedExistingNotes((prevEditedExistingNotes) => {
        const edition = prevEditedExistingNotes[editedNote.id];

        if (!edition) {
          return prevEditedExistingNotes;
        }

        if (edition.originalText === patrolNotes.find((note) => note.id === editedNote.id)?.text) {
          const nextEditedExistingNotes = { ...prevEditedExistingNotes };
          delete nextEditedExistingNotes[editedNote.id];
          return nextEditedExistingNotes;
        }

        return { ...prevEditedExistingNotes, [editedNote.id]: { ...edition, text: edition.originalText } };
      });
    }
  }, [patrolNotes]);

  const onDeleteNote = useCallback((noteToDelete) => {
    setNewNotes((prevNewNotes) => prevNewNotes.filter((note) => note !== noteToDelete));

    patrolOverviewTracker.track('Delete new note');
  }, []);

  const onAddAttachments = useCallback((files) => {
    let attachmentsAdded = false;

    setNewAttachments((prevNewAttachments) => {
      const filesToAdd = filterDuplicateUploadFilenames(
        [...existingAttachments, ...prevNewAttachments.map((attachmentToAdd) => attachmentToAdd.file)],
        convertFileListToArray(files)
      );

      if (filesToAdd.length === 0) {
        return prevNewAttachments;
      }

      attachmentsAdded = true;

      return [
        ...prevNewAttachments,
        ...filesToAdd.map((file) => ({ creationDate: new Date().toISOString(), file, ref: newAttachmentRef })),
      ];
    });

    if (attachmentsAdded) {
      setTimeout(
        () => newAttachmentRef.current?.scrollIntoView?.({ behavior: 'smooth' }),
        NEW_ACTIVITY_SECTION_ITEM_SCROLL_DELAY
      );

      patrolOverviewTracker.track('Added Attachment');
    }
  }, [existingAttachments]);

  const onDeleteAttachment = useCallback((fileToDelete) => {
    setNewAttachments(
      (prevNewAttachments) => prevNewAttachments.filter(
        (attachment) => attachment.file.name !== fileToDelete.name
      )
    );

    patrolOverviewTracker.track('Delete new attachment');
  }, []);

  const onContinueNavigation = useCallback(() => {
    patrolOverviewTracker.track('Discard unsaved changes and navigate away from patrol overview');

    return true;
  }, []);

  useEffect(() => {
    // Fetch the patrol if it is not in the store.
    if (patrolId && !patrol) {
      dispatch(fetchPatrol(patrolId));
    }
  }, [dispatch, patrol, patrolId]);

  useEffect(() => {
    // Fetches the patrol segment tracks if necessary.
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

  return <TrackerContext.Provider value={patrolOverviewTracker}>
    <NavigationPromptModal
      description={t('navigationPromptModalDescription')}
      onContinue={onContinueNavigation}
      showPositiveContinueButton={false}
      when={isTitleDirty || newAttachments.length > 0 || newNotes.length > 0 || hasEditedExistingNotes}
    />

    <div className={styles.patrolOverview} ref={printableContentRef}>
      <Header patrol={patrol} printableContentRef={printableContentRef} setIsTitleDirty={setIsTitleDirty} />

      <div className={styles.tabsContainer}>
        <Tabs
          aria-label={t('tabsLabel')}
          className={styles.tabs}
          defaultActiveKey={TAB_KEYS.OVERVIEW}
          onSelect={(key) => patrolOverviewTracker.track(`Click the "${TAB_LABELS[key]}" tab in patrol overview`)}
          variant="underline"
        >
          <Tab
            as="section"
            className={styles.tab}
            data-testid="patrolOverview-overviewTab"
            eventKey={TAB_KEYS.OVERVIEW}
            title={t('overviewTabTitle')}
          >
            <Overview
              existingNotes={existingNotes}
              newAttachments={newAttachments}
              newNotes={newNotes}
              onCancelNote={onCancelNote}
              onChangeNote={onChangeNote}
              onDeleteAttachment={onDeleteAttachment}
              onDeleteNote={onDeleteNote}
              onDoneNote={onDoneNote}
              patrol={patrol}
            />
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

      <Footer
        addEventFormProps={addEventFormProps}
        disableAddNoteButton={newNotes.some((noteToAdd) => !noteToAdd.originalText)}
        onAddAttachments={onAddAttachments}
        onAddNote={onAddNote}
      />
    </div>
  </TrackerContext.Provider>;
};

export default PatrolOverview;
