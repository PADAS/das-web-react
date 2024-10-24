import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ReactComponent as BulletListIcon } from '../common/images/icons/bullet-list.svg';
import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';

import { addPatrolSegmentToEvent, getEventIdsForCollection, setOriginalTextToEventNotes } from '../utils/events';
import { createPatrolDataSelector } from '../selectors/patrols';
import { convertFileListToArray, filterDuplicateUploadFilenames } from '../utils/file';
import {
  actualEndTimeForPatrol,
  actualStartTimeForPatrol,
  createNewPatrolForPatrolType,
  displayEndTimeForPatrol,
  displayPatrolSegmentId,
  displayStartTimeForPatrol,
  extractAttachmentUpdates,
  getReportsForPatrol,
  patrolShouldBeMarkedDone,
  patrolShouldBeMarkedOpen,
} from '../utils/patrols';
import { extractObjectDifference } from '../utils/objects';
import { fetchPatrol } from '../ducks/patrols';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { generateSaveActionsForReportLikeObject, executeSaveActions } from '../utils/save';
import { getCurrentIdFromURL } from '../utils/navigation';
import { PATROL_API_STATES, TAB_KEYS } from '../constants';
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
import AddReportButton from '../DetailViewComponents/AddReportButton';
import Header from './Header';
import HistorySection from '../DetailViewComponents/HistorySection';
import InvalidDatesModal from './InvalidDatesModal';
import LoadingOverlay from '../LoadingOverlay';
import NavigationPromptModal from '../NavigationPromptModal';
import PlanSection from './PlanSection';
import QuickLinks from '../QuickLinks';

import styles from './styles.module.scss';

import activitySectionStyles from '../DetailViewComponents/ActivitySection/styles.module.scss';
import { areCardsEquals as areNotesEqual } from '../DetailViewComponents/utils';
import { SidebarScrollContext } from '../SidebarScrollContext';
import { ReactComponent as ERLogo } from '../common/images/icons/er-logo.svg';

const patrolDetailViewTracker = trackEventFactory(PATROL_DETAIL_VIEW_CATEGORY);

const QUICK_LINKS_SCROLL_TOP_OFFSET = 20;

const PatrolDetailView = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('patrols', { keyPrefix: 'detailView' });

  const patrolId = getCurrentIdFromURL(location.pathname);
  const newPatrolTemporalId = location.state?.temporalId;
  const newPatrolTypeId = searchParams.get('patrolType');
  const { setScrollPosition } = useContext(SidebarScrollContext);

  const isAutoStart = useSelector((state) => state.view.userPreferences.autoStartPatrols);
  const patrolStore = useSelector((state) => state.data.patrolStore);
  const patrolType = useSelector(
    (state) => state.data.patrolTypes.find((patrolType) => patrolType.id === newPatrolTypeId)
  );
  const state = useSelector((state) => state);

  const newAttachmentRef = useRef(null);
  const newNoteRef = useRef(null);
  const temporalIdRef = useRef(null);
  const printableContentRef = useRef(null);

  const [attachmentsToAdd, setAttachmentsToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPatrol, setIsLoadingPatrol] = useState(true);
  const [patrolDataSelector, setPatrolDataSelector] = useState(null);
  const [patrolForm, setPatrolForm] = useState();
  const [redirectTo, setRedirectTo] = useState(null);
  const [notesToAdd, setNotesToAdd] = useState([]);
  const [showInvalidDatesModal, setShowInvalidDatesModal] = useState(false);

  const { patrol, leader } = patrolDataSelector || {};

  const isNewPatrol = patrolId === 'new';
  const patrolData = location.state?.patrolData;
  const shouldRenderPatrolDetailView = !!(isNewPatrol ? patrolType : (patrolStore[patrolId] && !isLoadingPatrol));

  const newPatrol = useMemo(
    () => patrolType ? createNewPatrolForPatrolType(patrolType, patrolData, isAutoStart) : null,
    [isAutoStart, patrolData, patrolType]
  );
  const originalPatrol = isNewPatrol ? newPatrol : setOriginalTextToEventNotes(patrolStore[patrolId]);

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
  const patrolNotes = useMemo(() => Array.isArray(patrolForm?.notes) ? [...patrolForm.notes] : [], [patrolForm?.notes]);

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
    () => notesToAdd.length > 0 && notesToAdd.some((note) => note.text),
    [notesToAdd]
  );

  const patrolSegmentId = patrol && displayPatrolSegmentId(patrol);

  const shouldShowNavigationPrompt = !isSaving
    && !redirectTo
    && (attachmentsToAdd.length > 0
      || newNotesAdded
      || Object.keys(patrolChanges).length > 0);

  const onSaveSuccess = useCallback((redirectTo) => () => {
    setRedirectTo(redirectTo);
    setScrollPosition(TAB_KEYS.PATROLS, 0);
    patrolDetailViewTracker.track(`Saved ${isNewPatrol ? 'new' : 'existing'} patrol`);
  }, [isNewPatrol, setScrollPosition]);

  const onSaveError = useCallback((error) => {
    patrolDetailViewTracker.track(`Error saving ${isNewPatrol ? 'new' : 'existing'} patrol`);

    console.warn('failed to save new patrol', error);
  }, [isNewPatrol]);

  const onSavePatrol = useCallback((shouldRedirectAfterSave = true) => {
    if (isSaving) {
      return;
    }

    const endDate = displayEndTimeForPatrol(patrolForm);
    const startDate = displayStartTimeForPatrol(patrolForm);
    if (endDate && startDate > endDate) {
      return setShowInvalidDatesModal(true);
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

    const newNotes = notesToAdd.map((note) => ({ ...note, ref: undefined }));
    patrolToSubmit.notes = [ ...patrolToSubmit.notes, ...newNotes ];

    const newAttachments = attachmentsToAdd.map((attachmentToAdd) => attachmentToAdd.file);
    const saveActions = generateSaveActionsForReportLikeObject(patrolToSubmit, 'patrol', [], newAttachments);
    return executeSaveActions(saveActions)
      .then(onSaveSuccess(shouldRedirectAfterSave ? `/${TAB_KEYS.PATROLS}` : undefined))
      .catch(onSaveError)
      .finally(() => setIsSaving(false));
  }, [attachmentsToAdd, isNewPatrol, isSaving, notesToAdd, onSaveError, onSaveSuccess, patrolForm]);

  const onAddReport = useCallback(async (reportData) => {
    const { data: { data } } = reportData.length ? reportData[0] : reportData;
    await addPatrolSegmentToEvent(patrolSegmentId, data.id);

    patrolDetailViewTracker.track('Save report to patrol');

    await dispatch(fetchPatrol(patrolId));
  }, [dispatch, patrolId, patrolSegmentId]);

  const trackDiscard = useCallback(() => {
    patrolDetailViewTracker.track(`Discard changes to ${isNewPatrol ? 'new' : 'existing'} patrol`);
  }, [isNewPatrol]);

  const onNavigationContinue = useCallback((shouldSave = false) => {
    if (shouldSave) {
      onSavePatrol(false);
    } else {
      trackDiscard();
    }
    return true;
  }, [onSavePatrol, trackDiscard]);

  const onChangeTitle = useCallback(
    (newTitle) => setPatrolForm({ ...patrolForm, title: newTitle }),
    [patrolForm, setPatrolForm]
  );

  const onPatrolEndDateChange = useCallback((endDate, shouldSchedule) => {
    const [segment] = patrolForm.patrol_segments;
    setPatrolForm({
      ...patrolForm,
      patrol_segments: [{
        ...segment,
        scheduled_end: endDate && shouldSchedule ? endDate : null,
        time_range: { ...segment.time_range, end_time: !endDate || shouldSchedule ? null : endDate },
      }],
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
    const update = {
      leader: selection || null,
    };
    if (isNewPatrol && selection) {
      const [patrolSegment] = patrolForm?.patrol_segments;
      const { start_location, time_range } = patrolSegment;
      const trackedSubjectLocation = selection?.last_position?.geometry?.coordinates;
      const trackedSubjectLocationTime = selection?.last_position?.properties?.coordinateProperties?.time;
      const isRadioAndHasRecentAct = subjectIsARadio(selection) && radioHasRecentActivity(selection);

      if ( !start_location && isRadioAndHasRecentAct && !!trackedSubjectLocation) {
        update.start_location = {
          latitude: trackedSubjectLocation[1],
          longitude: trackedSubjectLocation[0],
        };
      }
      if (!time_range?.start_time && isRadioAndHasRecentAct && !!trackedSubjectLocationTime){
        update.time_range = {
          start_time: trackedSubjectLocationTime,
        };
      }
    }

    setPatrolForm({
      ...patrolForm,
      patrol_segments: [
        {
          ...patrolForm?.patrol_segments[0],
          ...update,
        },
        ...patrolForm?.patrol_segments.slice(1),
      ],
    });

    patrolDetailViewTracker.track(`${selection ? 'Set' : 'Unset'} patrol tracked subject`);
  }, [isNewPatrol, patrolForm]);

  const onPatrolStartDateChange = useCallback((startDate, shouldSchedule) => {
    const [segment] = patrolForm.patrol_segments;
    setPatrolForm({
      ...patrolForm,
      patrol_segments: [{
        ...segment,
        scheduled_start: shouldSchedule ? startDate : null,
        time_range: { ...segment.time_range, start_time: shouldSchedule ?  null : startDate },
      }],
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

  const onDoneNote = useCallback((note) => {
    const isNew = !!note.tmpId;
    const notes = isNew ? notesToAdd : patrolNotes;
    const updatedNotes = notes.map((currentNote) => {
      if (areNotesEqual(currentNote, note)){
        const text = currentNote.text.trim();
        return {
          ...currentNote,
          originalText: text,
          text
        };
      }
      return currentNote;
    });

    if (isNew){
      setNotesToAdd(updatedNotes);
    } else {
      setPatrolForm({ ...patrolForm, notes: updatedNotes });
    }
  }, [notesToAdd, patrolForm, patrolNotes]);

  const onDeleteNote = useCallback((note) => {
    setNotesToAdd(notesToAdd.filter((noteToAdd) => noteToAdd !== note));
  }, [notesToAdd]);

  const onCancelNote = useCallback((note) => {
    const isNew = !!note.tmpId;
    const notes = isNew ? notesToAdd : patrolNotes;
    const updatedNotes = notes.map((currentNote) =>
      areNotesEqual(currentNote, note)
        ? { ...currentNote, text: currentNote.originalText }
        : currentNote
    );
    if (isNew){
      setNotesToAdd(updatedNotes);
    } else {
      setPatrolForm({ ...patrolForm, notes: updatedNotes });
    }
  }, [notesToAdd, patrolForm, patrolNotes]);

  const onChangeNote = useCallback((originalNote, { target: { value } }) => {
    const editedNote = {
      ...originalNote,
      text: value,
    };
    const isNew = !!originalNote.tmpId;

    if (isNew) {
      setNotesToAdd(notesToAdd.map((noteToAdd) => noteToAdd === originalNote ? editedNote : noteToAdd));
    } else {
      setPatrolForm({
        ...patrolForm,
        notes: patrolNotes.map((reportNote) => reportNote === originalNote ? editedNote : reportNote),
      });
    }

    return editedNote;
  }, [notesToAdd, patrolForm, patrolNotes]);

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

    patrolDetailViewTracker.track('Added Attachment');
  }, [attachmentsToAdd, patrolAttachments]);

  const onAddNote = useCallback(() => {
    const userHasNewNoteEmpty = notesToAdd.some((noteToAdd) => !noteToAdd.originalText);
    if (userHasNewNoteEmpty) {
      window.alert(t('addEmptyNoteAlert'));
    } else {
      const newNote = {
        creationDate: new Date().toISOString(),
        ref: newNoteRef,
        text: '',
        tmpId: uuid(),
      };
      setNotesToAdd([...notesToAdd, newNote]);
      patrolDetailViewTracker.track('Added Note');

      setTimeout(() => {
        newNoteRef?.current?.scrollIntoView?.({
          behavior: 'smooth',
        });
      }, parseFloat(activitySectionStyles.cardToggleTransitionTime));
    }
  }, [notesToAdd, t]);

  const onClickCancelButton = useCallback(() => navigate(`/${TAB_KEYS.PATROLS}`), [navigate]);

  const onHideInvalidDatesModal = useCallback(() => setShowInvalidDatesModal(false), []);

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
    if (leader?.id) {
      fetchTracksIfNecessary([leader?.id], {
        optionalDateBoundaries: { since: patrolStartTime, until: patrolEndTime }
      });
    }
  }, [leader?.id, patrolEndTime, patrolStartTime]);

  useEffect(() => {
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [navigate, redirectTo]);

  const hasActivitySectionContent = (attachmentsToAdd.length + patrolNotes.length + notesToAdd.length + patrolNotes.length) > 0;
  const shouldRenderActivitySection = !isNewPatrol || hasActivitySectionContent;
  const shouldRenderHistorySection = !!patrolUpdates.length;

  return shouldRenderPatrolDetailView && !!patrolForm ? <div className={styles.patrolDetailView} ref={printableContentRef}>
    {isSaving && <LoadingOverlay className={styles.loadingOverlay} message={t('loadingMessage')} />}

    <NavigationPromptModal onContinue={onNavigationContinue} when={shouldShowNavigationPrompt} />

    <ERLogo className={styles.printLogo} />

    <Header printableContentRef={printableContentRef} onChangeTitle={onChangeTitle} patrol={patrolForm} setRedirectTo={setRedirectTo} />

    <TrackerContext.Provider value={patrolDetailViewTracker}>
      <div className={styles.body}>
        <QuickLinks scrollTopOffset={QUICK_LINKS_SCROLL_TOP_OFFSET}>
          <QuickLinks.NavigationBar className={styles.navigationBar}>
            <QuickLinks.Anchor
              anchorTitle={t('quickLinksTitles.plan')}
              iconComponent={<CalendarIcon />}
              onClick={() => patrolDetailViewTracker.track(
                `Click the "Plan" quicklink in a ${isNewPatrol ? 'new' : 'existing'} patrol`
              )}
            />

            <QuickLinks.Anchor
              anchorTitle={t('quickLinksTitles.activity')}
              iconComponent={<BulletListIcon />}
              onClick={() => patrolDetailViewTracker.track(
                `Click the "Activity" quicklink in a ${isNewPatrol ? 'new' : 'existing'} patrol`
              )}
            />

            <QuickLinks.Anchor
              anchorTitle={t('quickLinksTitles.history')}
              iconComponent={<HistoryIcon />}
              onClick={() => patrolDetailViewTracker.track(
                `Click the "History" quicklink in a ${isNewPatrol ? 'new' : 'existing'} patrol`
              )}
            />
          </QuickLinks.NavigationBar>

          <div className={styles.content}>
            <QuickLinks.SectionsWrapper className={styles.sectionWrapper}>
              <QuickLinks.Section anchorTitle={t('quickLinksTitles.plan')}>
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

              {shouldRenderActivitySection && <div className={`${styles.sectionSeparation} ${styles.hideOnPrint}`} />}

              <QuickLinks.Section anchorTitle={t('quickLinksTitles.activity')} hidden={!shouldRenderActivitySection}>
                <ActivitySection
                  attachments={patrolAttachments}
                  attachmentsToAdd={attachmentsToAdd}
                  className={!hasActivitySectionContent ? styles.hideOnPrint : ''}
                  containedReports={containedReports}
                  endTime={patrolEndTime}
                  notes={patrolNotes}
                  notesToAdd={notesToAdd}
                  onDeleteAttachment={onDeleteAttachment}
                  onChangeNote={onChangeNote}
                  onCancelNote={onCancelNote}
                  onDoneNote={onDoneNote}
                  onDeleteNote={onDeleteNote}
                  startTime={patrolStartTime}
                />
              </QuickLinks.Section>

              {shouldRenderHistorySection && <div className={`${styles.sectionSeparation} ${styles.hideOnPrint}`} />}

              <QuickLinks.Section anchorTitle={t('quickLinksTitles.history')} hidden={!shouldRenderHistorySection}>
                <HistorySection
                    updates={patrolUpdates}
                    className={styles.hideOnPrint}
                />
              </QuickLinks.Section>
            </QuickLinks.SectionsWrapper>

            <div className={`${styles.footer} ${styles.hideOnPrint}`}>
              <div className={styles.footerActionButtonsContainer}>
                <AddNoteButton className={styles.footerActionButton} onAddNote={onAddNote} />

                <AddAttachmentButton className={styles.footerActionButton} onAddAttachments={onAddAttachments} />

                {!isNewPatrol && <AddReportButton
                  analyticsMetadata={{ category: PATROL_DETAIL_VIEW_CATEGORY, location: 'Patrol Detail View' }}
                  className={styles.footerActionButton}
                  formProps={{
                    isPatrolReport: true,
                    onSaveSuccess: onAddReport,
                    redirectTo: [{ pathname: location.pathname, search: location.search }, { state: location.state }],
                  }}
                />}
              </div>

              <div>
                <Button className={styles.cancelButton} onClick={onClickCancelButton} type="button" variant="secondary">
                  {t('formButtons.cancel')}
                </Button>

                <Button className={styles.saveButton} onClick={onSavePatrol} type="button">
                  {t('formButtons.save')}
                </Button>
              </div>
            </div>
          </div>
        </QuickLinks>
      </div>
    </TrackerContext.Provider>

    <InvalidDatesModal onHide={onHideInvalidDatesModal} show={showInvalidDatesModal} />
  </div> : null;
};

export default memo(PatrolDetailView);
