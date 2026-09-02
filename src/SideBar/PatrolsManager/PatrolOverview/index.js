import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { addPatrolSegmentToEvent } from '../../../utils/events';
import buildPatrolStatusUpdate from './utils/buildPatrolStatusUpdate';
import { convertFileListToArray, filterDuplicateUploadFilenames } from '../../../utils/file';
import { displayTitleForPatrol, governingPatrolSegment } from '../../../utils/patrols';
import { fetchPatrol, updatePatrol, uploadPatrolFile } from '../../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../../utils/tracks';
import { PATROL_OVERVIEW_CATEGORY, TrackerContext, trackEventFactory } from '../../../utils/analytics';
import { TAB_KEYS as SIDEBAR_TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';
import usePatrolState from '../../../hooks/usePatrolState';
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

const PatrolOverviewContent = ({ patrol }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview' });

  const newAttachmentRef = useRef(null);
  const newNoteRef = useRef(null);
  const printableContentRef = useRef(null);

  const [editedExistingNotes, setEditedExistingNotes] = useState({});
  const [editedState, setEditedState] = useState(null);
  const [editedTitle, setEditedTitle] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newAttachments, setNewAttachments] = useState([]);
  const [newNotes, setNewNotes] = useState([]);
  const [shouldRedirectToFeed, setShouldRedirectToFeed] = useState(false);

  const patrolTitle = displayTitleForPatrol(patrol, governingPatrolSegment(patrol)?.leader);

  const title = editedTitle ?? patrolTitle;

  const isTitleDirty = editedTitle !== null && editedTitle.trim() !== patrolTitle.trim();

  const patrolState = usePatrolState(patrol);

  const state = editedState ?? patrolState;

  const isStateDirty = editedState !== null;

  const patrolAttachments = useMemo(() => Array.isArray(patrol.files) ? patrol.files : [], [patrol]);

  const patrolNotes = useMemo(() => Array.isArray(patrol.notes) ? patrol.notes : [], [patrol]);

  const editedPatrolNotes = useMemo(() => patrolNotes.map((note) => {
    const edition = editedExistingNotes[note.id];
    const editedText = edition?.text.trim();

    return {
      ...note,
      isUnsaved: !!editedText && editedText !== note.text.trim(),
      originalText: edition?.originalText ?? note.text,
      text: edition?.text ?? note.text,
    };
  }), [editedExistingNotes, patrolNotes]);

  const newNotesWithText = useMemo(() => newNotes.filter((note) => note.text.trim()), [newNotes]);

  const patrolUpdates = useMemo(() => {
    const patrolUpdates = {};

    if (isTitleDirty) {
      patrolUpdates.title = title.trim();
    }

    const patrolNotesWithEditions = patrolNotes.map((note) => {
      const editedText = editedExistingNotes[note.id]?.text.trim();

      return editedText && editedText !== note.text.trim() ? { ...note, text: editedText } : note;
    });

    const hasEditedNotes = patrolNotesWithEditions.some((note, index) => note !== patrolNotes[index]);
    if (hasEditedNotes || newNotesWithText.length > 0) {
      patrolUpdates.notes = [
        ...patrolNotesWithEditions,
        ...newNotesWithText.map(({ text }) => ({ text: text.trim() })),
      ];
    }

    return patrolUpdates;
  }, [editedExistingNotes, isTitleDirty, newNotesWithText, patrolNotes, title]);

  const hasPatrolUpdates = Object.keys(patrolUpdates).length > 0;

  const hasUnsavedChanges = hasPatrolUpdates || newAttachments.length > 0 || isStateDirty;

  const onAddEvent = useCallback(async (saveResults) => {
    const [firstResult] = Array.isArray(saveResults) ? saveResults : [saveResults];
    const newEventId = firstResult.data.data.id;

    await addPatrolSegmentToEvent(governingPatrolSegment(patrol).id, newEventId);

    patrolOverviewTracker.track('Link new event to patrol');

    await dispatch(fetchPatrol(patrol.id));
  }, [dispatch, patrol]);

  const addEventFormProps = useMemo(() => ({
    isPatrolReport: true,
    onSaveSuccess: onAddEvent,
    redirectTo: [{ pathname: `/${SIDEBAR_TAB_KEYS.PATROLS}/${patrol.id}` }],
  }), [onAddEvent, patrol.id]);

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

  const onChangeState = useCallback((pickedState) => {
    setEditedState(pickedState === patrolState ? null : pickedState);
  }, [patrolState]);

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
    const filesToAdd = filterDuplicateUploadFilenames(
      [...patrolAttachments, ...newAttachments.map((attachmentToAdd) => attachmentToAdd.file)],
      convertFileListToArray(files)
    );

    if (filesToAdd.length === 0) {
      return;
    }

    setNewAttachments((prevNewAttachments) => [
      ...prevNewAttachments,
      ...filesToAdd.map((file) => ({ creationDate: new Date().toISOString(), file, ref: newAttachmentRef })),
    ]);

    setTimeout(
      () => newAttachmentRef.current?.scrollIntoView?.({ behavior: 'smooth' }),
      NEW_ACTIVITY_SECTION_ITEM_SCROLL_DELAY
    );

    patrolOverviewTracker.track('Added Attachment');
  }, [newAttachments, patrolAttachments]);

  const onDeleteAttachment = useCallback((fileToDelete) => {
    setNewAttachments(
      (prevNewAttachments) => prevNewAttachments.filter(
        (attachment) => attachment.file.name !== fileToDelete.name
      )
    );

    patrolOverviewTracker.track('Delete new attachment');
  }, []);

  const savePatrol = useCallback(async () => {
    // The status update is built here, and not alongside the other updates,
    // because it stamps the transition with the moment the patrol is saved.
    const statusUpdate = isStateDirty ? buildPatrolStatusUpdate(patrol, state) : null;
    const patrolUpdatesWithStatusUpdate = { ...patrolUpdates, ...statusUpdate };
    const hasUpdates = Object.keys(patrolUpdatesWithStatusUpdate).length > 0;

    // Update the patrol and upload the new attachments in parallel.
    const [patrolUpdateResult, ...attachmentResults] = await Promise.allSettled([
      hasUpdates ? dispatch(updatePatrol({ ...patrolUpdatesWithStatusUpdate, id: patrol.id })) : Promise.resolve(),
      ...newAttachments.map(({ file }) => uploadPatrolFile(patrol.id, file)),
    ]);

    const refetchPatrol = dispatch(fetchPatrol(patrol.id)).catch(() => {});

    if (patrolUpdateResult.status === 'fulfilled') {
      // The patrol update went through. Clear what it saved.
      setEditedExistingNotes({});
      setEditedState(null);
      setEditedTitle(null);
      setNewNotes((prevNewNotes) => prevNewNotes.filter((note) => !newNotesWithText.includes(note)));
    }

    const failedRequest = [patrolUpdateResult, ...attachmentResults].find(({ status }) => status === 'rejected');
    if (!failedRequest) {
      patrolOverviewTracker.track('Saved patrol from patrol overview');

      return true;
    }

    await refetchPatrol;

    // Remove the sucessfully uploaded attachments from the new attachments
    // list.
    const uploadedAttachments = newAttachments.filter((_, index) => attachmentResults[index].status === 'fulfilled');
    setNewAttachments((prevNewAttachments) => prevNewAttachments.filter(
      (attachment) => !uploadedAttachments.includes(attachment)
    ));

    toast.error(patrolUpdateResult.status === 'fulfilled' ? t('attachmentsSaveErrorMessage') : t('saveErrorMessage'));

    patrolOverviewTracker.track('Error saving patrol from patrol overview');

    console.warn('Error saving patrol: ', failedRequest.reason);

    return false;
  }, [dispatch, isStateDirty, newAttachments, newNotesWithText, patrol, patrolUpdates, state, t]);

  const onSave = useCallback(async () => {
    patrolOverviewTracker.track('Click the "Save" button in patrol overview');

    setIsSaving(true);

    if (await savePatrol()) {
      setShouldRedirectToFeed(true);
    } else {
      setIsSaving(false);
    }
  }, [savePatrol]);

  const onContinueNavigation = useCallback((shouldSave) => {
    if (shouldSave) {
      savePatrol();

      patrolOverviewTracker.track('Save unsaved changes and navigate away from patrol overview');
    } else {
      patrolOverviewTracker.track('Discard unsaved changes and navigate away from patrol overview');
    }

    return true;
  }, [savePatrol]);

  useEffect(() => {
    // Fetches the patrol segment tracks if necessary.
    patrol.patrol_segments.forEach((segment) => {
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

  useEffect(() => {
    // Navigating from an effect instead of the save method to make sure the
    // navigation blocker is freed after the patrol is saved.
    if (shouldRedirectToFeed) {
      navigate(`/${SIDEBAR_TAB_KEYS.PATROLS}`);
    }
  }, [navigate, shouldRedirectToFeed]);

  return <TrackerContext.Provider value={patrolOverviewTracker}>
    <NavigationPromptModal onContinue={onContinueNavigation} when={hasUnsavedChanges && !isSaving} />

    <div className={styles.patrolOverview} ref={printableContentRef}>
      <Header
        isStateDirty={isStateDirty}
        isTitleDirty={isTitleDirty}
        onChangeState={onChangeState}
        onChangeTitle={setEditedTitle}
        patrol={patrol}
        patrolState={patrolState}
        printableContentRef={printableContentRef}
        state={state}
        title={title}
      />

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
              existingNotes={editedPatrolNotes}
              newAttachments={newAttachments}
              newNotes={newNotes}
              onCancelNote={onCancelNote}
              onChangeNote={onChangeNote}
              onDeleteAttachment={onDeleteAttachment}
              onDeleteNote={onDeleteNote}
              onDoneNote={onDoneNote}
              patrol={patrol}
              patrolState={patrolState}
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
        disableSaveButton={!hasUnsavedChanges}
        isSaving={isSaving}
        onAddAttachments={onAddAttachments}
        onAddNote={onAddNote}
        onSave={onSave}
      />
    </div>
  </TrackerContext.Provider>;
};

const PatrolOverview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { patrolId } = useParams();

  const patrol = useSelector((state) => state.data.patrolStore[patrolId]);

  const fetchedPatrolIdRef = useRef(null);

  useEffect(() => {
    if (patrolId && fetchedPatrolIdRef.current !== patrolId) {
      fetchedPatrolIdRef.current = patrolId;

      dispatch(fetchPatrol(patrolId))
        .catch(() => navigate(`/${SIDEBAR_TAB_KEYS.PATROLS}`, { replace: true }));
    }
  }, [dispatch, navigate, patrolId]);

  return patrol
    ? <PatrolOverviewContent patrol={patrol} />
    : <div className={styles.loaderWrapper} data-testid="patrolOverview-loader">
      <MoonLoader size={LOADER_SIZE} />
    </div>;
};

export default PatrolOverview;
