import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import isFuture from 'date-fns/is_future';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ReactComponent as BulletListIcon } from '../common/images/icons/bullet-list.svg';
import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';

import { addPatrolSegmentToEvent, getEventIdsForCollection } from '../utils/events';
import { createPatrolDataSelector } from '../selectors/patrols';
import { convertFileListToArray, filterDuplicateUploadFilenames } from '../utils/file';
import {
  actualEndTimeForPatrol,
  actualStartTimeForPatrol,
  createNewPatrolForPatrolType,
  displayPatrolSegmentId,
  extractAttachmentUpdates,
  getReportsForPatrol,
  patrolShouldBeMarkedDone,
  patrolShouldBeMarkedOpen,
} from '../utils/patrols';
import { extractObjectDifference } from '../utils/objects';
import { fetchPatrol } from '../ducks/patrols';
import { generateSaveActionsForReportLikeObject, executeSaveActions } from '../utils/save';
import { getCurrentIdFromURL } from '../utils/navigation';
import { PATROL_API_STATES, PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../constants';
import {
  TrackerContext,
  PATROL_DETAIL_VIEW_CATEGORY,
  trackEventFactory
} from '../utils/analytics';
import { radioHasRecentActivity, subjectIsARadio } from '../utils/subjects';
import useNavigate from '../hooks/useNavigate';
import { uuid } from '../utils/string';

import ActivitySection from '../DetailViewComponents/ActivitySection';
import AddAttachmentButton from '../AddAttachmentButton';
import AddNoteButton from '../AddNoteButton';
import AddReportButton from '../DetailView/AddReportButton';
import Header from './Header';
import HistorySection from '../DetailViewComponents/HistorySection';
import LoadingOverlay from '../LoadingOverlay';
import NavigationPromptModal from '../NavigationPromptModal';
import PlanSection from './PlanSection';
import QuickLinks from '../QuickLinks';

import styles from './styles.module.scss';

import activitySectionStyles from '../DetailViewComponents/ActivitySection/styles.module.scss';

const patrolDetailViewTracker = trackEventFactory(PATROL_DETAIL_VIEW_CATEGORY);

const QUICK_LINKS_SCROLL_TOP_OFFSET = 20;

// TODO: Remove this eslint-disable once patrols new UI epic is ready
/* eslint-disable no-unused-vars */
const PatrolDetailView = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const patrolId = getCurrentIdFromURL(location.pathname);
  const newPatrolTemporalId = location.state?.temporalId;
  const newPatrolTypeId = searchParams.get('patrolType');

  const patrolPermissions = useSelector((state) => {
    const permissionSource = state.data.selectedUserProfile?.id ? state.data.selectedUserProfile : state.data.user;
    return permissionSource?.permissions?.[PERMISSION_KEYS.PATROLS] || [] ;
  });
  const patrolStore = useSelector((state) => state.data.patrolStore);
  const patrolType = useSelector(
    (state) => state.data.patrolTypes.find((patrolType) => patrolType.id === newPatrolTypeId)
  );
  const state = useSelector((state) => state);

  const newAttachmentRef = useRef(null);
  const newNoteRef = useRef(null);
  const temporalIdRef = useRef(null);

  const [attachmentsToAdd, setAttachmentsToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPatrol, setIsLoadingPatrol] = useState(true);
  const [notesUnsavedChanges, setNotesUnsavedChanges] = useState({});
  const [patrolDataSelector, setPatrolDataSelector] = useState(null);
  const [patrolForm, setPatrolForm] = useState();
  const [redirectTo, setRedirectTo] = useState(null);

  const patrolTracker = trackEventFactory(PATROL_DETAIL_VIEW_CATEGORY);

  const { patrol, leader, trackData, startStopGeometries } = patrolDataSelector || {};

  const isNewPatrol = patrolId === 'new';
  const patrolData = location.state?.patrolData;
  const shouldRenderPatrolDetailView = !!(isNewPatrol ? patrolType : (patrolStore[patrolId] && !isLoadingPatrol));

  const newPatrol = useMemo(
    () => patrolType ? createNewPatrolForPatrolType(patrolType, patrolData) : null,
    [patrolData, patrolType]
  );
  const originalPatrol = isNewPatrol ? newPatrol : patrolStore[patrolId];

  const containedReports = useMemo(() => {
    const patrolReports = getReportsForPatrol(patrol);

    // don't show the contained reports, which are also bound to the segment
    const allReports = [...patrolReports];
    const incidents = allReports.filter((report) => report.is_collection);
    const incidentIds = incidents.reduce(
      (accumulator, incident) => [...accumulator, ...(getEventIdsForCollection(incident)|| [])],
      []
    );

    return allReports.filter((report) => !incidentIds.includes(report.id));
  }, [patrol]);

  const patrolEndTime = useMemo(() => patrolForm ? actualEndTimeForPatrol(patrolForm) : null, [patrolForm]);
  const patrolStartTime = useMemo(() => patrolForm ? actualStartTimeForPatrol(patrolForm) : null, [patrolForm]);

  const patrolAttachments = useMemo(
    () => Array.isArray(patrolForm?.files) ? patrolForm.files : [],
    [patrolForm?.files]
  );
  const patrolNotes = useMemo(() => Array.isArray(patrolForm?.notes) ? patrolForm.notes : [], [patrolForm?.notes]);

  const patrolChanges = useMemo(() => {
    if (!originalPatrol || !patrolForm) {
      return {};
    }

    return extractObjectDifference(patrolForm, originalPatrol);
  }, [originalPatrol, patrolForm]);

  const patrolUpdates = useMemo(() => {
    if (!patrolForm || isNewPatrol) {
      return [];
    }

    const [segmentsFirstLeg] = patrolForm.patrol_segments;

    const topLevelUpdates = patrolForm.updates;
    const { updates: segmentUpdates } = segmentsFirstLeg;
    const noteUpdates = extractAttachmentUpdates(patrolForm.notes);
    const fileUpdates = extractAttachmentUpdates(patrolForm.files);
    const eventUpdates = extractAttachmentUpdates(segmentsFirstLeg.events);

    return [...topLevelUpdates, ...segmentUpdates, ...noteUpdates, ...fileUpdates, ...eventUpdates];
  }, [isNewPatrol, patrolForm]);

  const newNotesAdded = useMemo(
    () => patrolForm?.notes?.length > 0 && patrolForm.notes.some((note) => !note.id && note.text),
    [patrolForm?.notes]
  );

  // TODO: test that a user without permissions can't do any update actions once the implementation is finished
  const hasEditPatrolsPermission = patrolPermissions.includes(PERMISSIONS.UPDATE);
  const patrolSegmentId = patrol && displayPatrolSegmentId(patrol);

  const notesWithUnsavedChanges = useMemo(
    () => Object.values(notesUnsavedChanges).some((hasUnsavedChanges) => hasUnsavedChanges),
    [notesUnsavedChanges]
  );

  const shouldShowNavigationPrompt = !isSaving
    && !redirectTo
    && (attachmentsToAdd.length > 0
      || newNotesAdded
      || notesWithUnsavedChanges
      || Object.keys(patrolChanges).length > 0);

  const onSaveSuccess = useCallback((redirectTo) => () => {
    setRedirectTo(redirectTo);

    patrolDetailViewTracker.track(`Saved ${isNewPatrol ? 'new' : 'existing'} patrol`);
  }, [isNewPatrol]);

  const onSaveError = useCallback((error) => {
    patrolDetailViewTracker.track(`Error saving ${isNewPatrol ? 'new' : 'existing'} patrol`);

    console.warn('failed to save new patrol', error);
  }, [isNewPatrol]);

  const onSavePatrol = useCallback((shouldRedirectAfterSave = true) => {
    if (isSaving) {
      return;
    }

    patrolDetailViewTracker.track(`Click 'Save' button for ${isNewPatrol ? 'new' : 'existing'} patrol`);

    setIsSaving(true);

    const patrolToSubmit = { ...patrolForm };
    if (patrolShouldBeMarkedDone(patrolForm)){
      patrolToSubmit.state = PATROL_API_STATES.DONE;
    } else if (patrolShouldBeMarkedOpen(patrolForm)) {
      patrolToSubmit.state = PATROL_API_STATES.OPEN;
    }

    ['start_location', 'end_location'].forEach((prop) => {
      if (patrolToSubmit.hasOwnProperty(prop) && !patrolToSubmit[prop]) {
        patrolToSubmit[prop] = null;
      }
    });

    patrolToSubmit.notes = patrolToSubmit.notes.map((note) => ({ ...note, ref: undefined }));

    const newAttachments = attachmentsToAdd.map((attachmentToAdd) => attachmentToAdd.file);
    const saveActions = generateSaveActionsForReportLikeObject(patrolToSubmit, 'patrol', [], newAttachments);
    return executeSaveActions(saveActions)
      .then(onSaveSuccess(shouldRedirectAfterSave ? `/${TAB_KEYS.PATROLS}` : undefined))
      .catch(onSaveError)
      .finally(() => setIsSaving(false));
  }, [attachmentsToAdd, isNewPatrol, isSaving, onSaveError, onSaveSuccess, patrolForm]);

  const onAddReport = useCallback(async (reportData, navigateFromReport) => {
    const { data: { data } } = reportData.length ? reportData[0] : reportData;
    await addPatrolSegmentToEvent(patrolSegmentId, data.id);

    patrolDetailViewTracker.track('Save report to patrol');

    await dispatch(fetchPatrol(patrolId));

    navigateFromReport({ pathname: location.pathname, search: location.search }, { state: location.state });
  }, [dispatch, location.pathname, location.search, location.state, patrolId, patrolSegmentId]);

  const trackDiscard = useCallback(() => {
    patrolDetailViewTracker.track(`Discard changes to ${isNewPatrol ? 'new' : 'existing'} patrol`);
  }, [isNewPatrol]);

  const onNavigationContinue = useCallback(async (shouldSave = false) => {
    if (shouldSave) {
      await onSavePatrol(false);
    } else {
      trackDiscard();
    }
  }, [onSavePatrol, trackDiscard]);

  const onChangeTitle = useCallback(
    (newTitle) => setPatrolForm({ ...patrolForm, title: newTitle }),
    [patrolForm, setPatrolForm]
  );

  const onPatrolEndDateChange = useCallback((endDate, isAutoEnd) => {
    const isScheduled = !isAutoEnd && isFuture(endDate);

    setPatrolForm({
      ...patrolForm,
      patrol_segments: [
        {
          ...patrolForm.patrol_segments[0],
          scheduled_end: isScheduled ? endDate : null,
          time_range: { ...patrolForm.patrol_segments[0].time_range, end_time: !isScheduled ? endDate : null },
        },
        ...patrolForm.patrol_segments.slice(1),
      ],
    });

    patrolDetailViewTracker.track('Set patrol end date');
  }, [patrolForm]);

  const onPatrolEndLocationChange = useCallback((endLocation) => {
    const updatedEndLocation = !!endLocation ? { latitude: endLocation[1], longitude: endLocation[0] } : null;

    setPatrolForm({
      ...patrolForm,
      patrol_segments: [
        { ...patrolForm.patrol_segments[0], end_location: updatedEndLocation },
        ...patrolForm.patrol_segments.slice(1),
      ],
    });

    patrolDetailViewTracker.track('Set patrol end location');
  }, [patrolForm]);

  const onPatrolObjectiveChange = useCallback((event) => {
    event.preventDefault();

    setPatrolForm({ ...patrolForm, objective: event.target.value });

    patrolDetailViewTracker.track('Set patrol objective');
  }, [patrolForm]);

  const onPatrolReportedByChange = useCallback((selection) => {
    let startLocation, timeRange;
    if (isNewPatrol) {
      const shouldAssignTrackedSubjectLocationAndTime = radioHasRecentActivity(selection)
        && subjectIsARadio(selection)
        && !!selection?.last_position?.geometry?.coordinates
        && !!selection?.last_position?.properties?.coordinateProperties?.time;
      if (shouldAssignTrackedSubjectLocationAndTime) {
        startLocation = {
          latitude: selection.last_position.geometry.coordinates[1],
          longitude: selection.last_position.geometry.coordinates[0],
        };
        timeRange = { start_time: selection.last_position.properties.coordinateProperties.time };
      } else if (!selection) {
        startLocation = null;
        timeRange = { start_time: new Date().toISOString() };
      }
    }

    setPatrolForm({
      ...patrolForm,
      patrol_segments: [
        {
          ...patrolForm.patrol_segments[0],
          leader: selection || null,
          start_location: startLocation,
          time_range: timeRange,
        },
        ...patrolForm.patrol_segments.slice(1),
      ],
    });

    patrolDetailViewTracker.track(`${selection ? 'Set' : 'Unset'} patrol tracked subject`);
  }, [isNewPatrol, patrolForm]);

  const onPatrolStartDateChange = useCallback((startDate, isAutoStart) => {
    const isScheduled = !isAutoStart && isFuture(startDate);

    setPatrolForm({
      ...patrolForm,
      patrol_segments: [
        {
          ...patrolForm.patrol_segments[0],
          scheduled_start: isScheduled ? startDate : null,
          time_range: { ...patrolForm.patrol_segments[0].time_range, start_time: !isScheduled ? startDate : null },
        },
        ...patrolForm.patrol_segments.slice(1),
      ],
    });

    patrolDetailViewTracker.track('Set patrol start date');
  }, [patrolForm]);

  const onPatrolStartLocationChange = useCallback((startLocation) => {
    const updatedStartLocation = !!startLocation ? { latitude: startLocation[1], longitude: startLocation[0] } : null;

    setPatrolForm({
      ...patrolForm,
      patrol_segments: [
        { ...patrolForm.patrol_segments[0], start_location: updatedStartLocation },
        ...patrolForm.patrol_segments.slice(1),
      ],
    });

    patrolDetailViewTracker.track('Set patrol start location');
  }, [patrolForm]);

  const updateNotesUnsavedChanges = useCallback((creationDate, hasUnsavedChanges) => {
    if (notesUnsavedChanges[creationDate] !== hasUnsavedChanges){
      setNotesUnsavedChanges({ ...notesUnsavedChanges, [creationDate]: hasUnsavedChanges });
    }
  }, [notesUnsavedChanges]);

  const onDeleteNote = useCallback((noteToDelete) => {
    updateNotesUnsavedChanges(noteToDelete.creationDate, false);
    setPatrolForm({
      ...patrolForm,
      notes: patrolForm.notes.filter((note) => note.text !== noteToDelete.text),
    });
  }, [patrolForm, updateNotesUnsavedChanges]);

  const onSaveNote = useCallback((originalNote, updatedNote) => {
    const editedNote = { ...originalNote, text: updatedNote.text };

    updateNotesUnsavedChanges(editedNote.creationDate, false);

    const isNew = !originalNote.id;
    if (isNew) {
      setPatrolForm({
        ...patrolForm,
        notes: patrolForm.notes.map((note) => note.text === originalNote.text ? editedNote : note),
      });
    } else {
      setPatrolForm({
        ...patrolForm,
        notes: patrolForm.notes.map((note) => note.id === originalNote.id ? editedNote : note),
      });
    }
    return editedNote;
  }, [patrolForm, updateNotesUnsavedChanges]);

  const onDeleteAttachment = useCallback((attachment) => {
    setAttachmentsToAdd(attachmentsToAdd.filter((attachmentToAdd) => attachmentToAdd.file.name !== attachment.name));
  }, [attachmentsToAdd]);

  const onAddAttachments = useCallback((files) => {
    const filesArray = convertFileListToArray(files);
    const uploadableFiles = filterDuplicateUploadFilenames(
      [...patrolAttachments, ...attachmentsToAdd.map((attachmentToAdd) => attachmentToAdd.file)],
      filesArray
    );

    setAttachmentsToAdd([
      ...attachmentsToAdd,
      ...uploadableFiles.map((uploadableFile) => ({ file: uploadableFile, creationDate: new Date().toISOString(), ref: newAttachmentRef })),
    ]);

    setTimeout(() => {
      newAttachmentRef?.current?.scrollIntoView?.({
        behavior: 'smooth',
      });
    }, parseFloat(activitySectionStyles.cardToggleTransitionTime));

    patrolTracker.track('Added Attachment');
  }, [attachmentsToAdd, patrolAttachments, patrolTracker]);

  const onAddNote = useCallback(() => {
    const userHasNewNoteEmpty = patrolForm.notes.some((note) => !note.text);
    if (userHasNewNoteEmpty) {
      window.alert('Can not add a new note: there\'s an empty note not saved yet');
    } else {
      const newNote = { creationDate: new Date().toISOString(), ref: newNoteRef, text: '' };
      setPatrolForm({ ...patrolForm, notes: [...patrolForm.notes, newNote] });

      patrolTracker.track('Added Note');

      setTimeout(() => {
        newNoteRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
      }, parseFloat(activitySectionStyles.cardToggleTransitionTime));
    }
  }, [patrolForm, patrolTracker]);

  const onCancelAddedReport = useCallback((navigateFromReport) => {
    navigateFromReport({ pathname: location.pathname, search: location.search }, { state: location.state });
  }, [location.pathname, location.search, location.state]);

  const onClickCancelButton = useCallback(() => navigate(`/${TAB_KEYS.PATROLS}`), [navigate]);

  useEffect(() => {
    if (patrol) {
      setPatrolForm({ ...patrol });
    }
  }, [leader, patrol]);

  useEffect(() => {
    if (isNewPatrol || patrolStore[patrolId]) {
      setIsLoadingPatrol(false);
    }
  }, [isNewPatrol, patrolId, patrolStore]);

  useEffect(() => {
    if (isNewPatrol) {
      if (!patrolType) {
        navigate(`/${TAB_KEYS.PATROLS}`, { replace: true });
      } else if (!newPatrolTemporalId) {
        navigate(
          `${location.pathname}${location.search}`,
          { replace: true, state: { ...location.state, temporalId: uuid() } }
        );
      }
    }
  }, [isNewPatrol, location.pathname, location.search, location.state, navigate, newPatrolTemporalId, patrolType]);

  useEffect(() => {
    if (!isNewPatrol && !patrolStore[patrolId]) {
      setIsLoadingPatrol(true);
      dispatch(fetchPatrol(patrolId))
        .then(() => setIsLoadingPatrol(false))
        .catch(() => navigate(`/${TAB_KEYS.PATROLS}`, { replace: true }));
    }
  }, [dispatch, isNewPatrol, navigate, patrolId, patrolStore]);

  useEffect(() => {
    if (!isLoadingPatrol) {
      const navigationPatrolId = isNewPatrol ? newPatrolTemporalId : patrolId;
      const memoryPatrolId = isNewPatrol ? temporalIdRef.current : patrolDataSelector?.patrol?.id;
      if (navigationPatrolId !== memoryPatrolId) {
        setPatrolDataSelector(originalPatrol ? createPatrolDataSelector()(state, { patrol: originalPatrol }) : {});
        temporalIdRef.current = isNewPatrol ? newPatrolTemporalId : null;
      }
    }
  }, [
    isLoadingPatrol,
    isNewPatrol,
    newPatrolTemporalId,
    originalPatrol,
    patrolDataSelector?.patrol?.id,
    patrolId,
    state,
  ]);

  useEffect(() => {
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [navigate, redirectTo]);

  const shouldRenderActivitySection = !isNewPatrol || (attachmentsToAdd.length + patrolNotes.length) > 0;
  const shouldRenderHistorySection = !!patrolUpdates.length;

  return shouldRenderPatrolDetailView && !!patrolForm ? <div className={styles.patrolDetailView}>
    {isSaving && <LoadingOverlay className={styles.loadingOverlay} message="Saving..." />}

    <NavigationPromptModal onContinue={onNavigationContinue} when={shouldShowNavigationPrompt} />

    <Header onChangeTitle={onChangeTitle} patrol={patrolForm} />

    <TrackerContext.Provider value={patrolTracker}>
      <div className={styles.body}>
        <QuickLinks scrollTopOffset={QUICK_LINKS_SCROLL_TOP_OFFSET}>
          <QuickLinks.NavigationBar>
            <QuickLinks.Anchor anchorTitle="Plan" iconComponent={<CalendarIcon />} />

            <QuickLinks.Anchor anchorTitle="Activity" iconComponent={<BulletListIcon />} />

            <QuickLinks.Anchor anchorTitle="History" iconComponent={<HistoryIcon />} />
          </QuickLinks.NavigationBar>

          <div className={styles.content}>
            <QuickLinks.SectionsWrapper>
              <QuickLinks.Section anchorTitle="Plan">
                <PlanSection
                  onPatrolEndDateChange={onPatrolEndDateChange}
                  onPatrolEndLocationChange={onPatrolEndLocationChange}
                  onPatrolObjectiveChange={onPatrolObjectiveChange}
                  onPatrolReportedByChange={onPatrolReportedByChange}
                  onPatrolStartDateChange={onPatrolStartDateChange}
                  onPatrolStartLocationChange={onPatrolStartLocationChange}
                  patrolForm={patrolForm}
                />
              </QuickLinks.Section>

              {shouldRenderActivitySection && <div className={styles.sectionSeparation} />}

              <QuickLinks.Section anchorTitle="Activity" hidden={!shouldRenderActivitySection}>
                <ActivitySection
                  attachments={patrolAttachments}
                  attachmentsToAdd={attachmentsToAdd}
                  containedReports={containedReports}
                  endTime={patrolEndTime}
                  notes={patrolNotes.filter((note) => note.id)}
                  notesToAdd={patrolNotes.filter((note) => !note.id)}
                  onDeleteAttachment={onDeleteAttachment}
                  onDeleteNote={onDeleteNote}
                  onSaveNote={onSaveNote}
                  startTime={patrolStartTime}
                />
              </QuickLinks.Section>

              {shouldRenderHistorySection && <div className={styles.sectionSeparation} />}

              <QuickLinks.Section anchorTitle="History" hidden={!shouldRenderHistorySection}>
                <HistorySection updates={patrolUpdates} />
              </QuickLinks.Section>
            </QuickLinks.SectionsWrapper>

            <div className={styles.footer}>
              <div className={styles.footerActionButtonsContainer}>
                <AddNoteButton className={styles.footerActionButton} onAddNote={onAddNote} />

                <AddAttachmentButton className={styles.footerActionButton} onAddAttachments={onAddAttachments} />

                {!isNewPatrol && <AddReportButton
                  analyticsMetadata={{ category: PATROL_DETAIL_VIEW_CATEGORY, location: 'Patrol Detail View' }}
                  formProps={{
                    hidePatrols: true,
                    isPatrolReport: true,
                    onCancelAddedReport,
                    onSaveSuccess: onAddReport,
                  }}
                />}
              </div>

              <div>
                <Button className={styles.cancelButton} onClick={onClickCancelButton} type="button" variant="secondary">
                  Cancel
                </Button>

                <Button className={styles.saveButton} onClick={onSavePatrol} type="button">
                  Save
                </Button>
              </div>
            </div>
          </div>
        </QuickLinks>
      </div>
    </TrackerContext.Provider>

  </div> : null;
};

export default memo(PatrolDetailView);
