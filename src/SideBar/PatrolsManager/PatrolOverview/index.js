import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isCancel } from 'axios';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { addPatrolSegmentToEvent } from '../../../utils/events';
import buildPatrolStatusUpdate from './utils/buildPatrolStatusUpdate';
import { displayTitleForPatrol, getTrackedSubjectsForPatrolSegment, governingPatrolSegment } from '../../../utils/patrols';
import { fetchPatrol, updatePatrol, uploadPatrolFile } from '../../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../../utils/tracks';
import { PATROL_OVERVIEW_CATEGORY, TrackerContext, trackEventFactory } from '../../../utils/analytics';
import { TAB_KEYS as SIDEBAR_TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';
import usePatrolActivityEditing from '../utils/usePatrolActivityEditing';
import usePatrolState from '../../../hooks/usePatrolState';

import DetailViewLoader from '../DetailViewLoader';
import Footer from './Footer';
import Header from './Header';
import History from './History';
import NavigationPromptModal from '../../../NavigationPromptModal';
import Overview from './Overview';

import * as styles from './styles.module.scss';

const patrolOverviewTracker = trackEventFactory(PATROL_OVERVIEW_CATEGORY);

const TAB_KEYS = { HISTORY: 'history', OVERVIEW: 'overview' };
const TAB_LABELS = { [TAB_KEYS.HISTORY]: 'History', [TAB_KEYS.OVERVIEW]: 'Overview' };

const PatrolOverviewContent = ({ patrol }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview' });

  const activityEditing = usePatrolActivityEditing(patrol, patrolOverviewTracker);
  const patrolState = usePatrolState(patrol);

  const patrolTeamAndTrackingOptions = useSelector((state) => state.data.patrolTeamAndTrackingOptions);

  const printableContentRef = useRef(null);

  const [editedState, setEditedState] = useState(null);
  const [editedTitle, setEditedTitle] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [shouldRedirectToFeed, setShouldRedirectToFeed] = useState(false);

  const patrolTitle = displayTitleForPatrol(patrol, governingPatrolSegment(patrol)?.leader);

  const title = editedTitle ?? patrolTitle;

  const isTitleDirty = editedTitle !== null && editedTitle.trim() !== patrolTitle.trim();

  const state = editedState ?? patrolState;

  const isStateDirty = editedState !== null;

  const patrolUpdates = useMemo(() => ({
    ...(isTitleDirty ? { title: title.trim() } : {}),
    ...(activityEditing.notesUpdate ? { notes: activityEditing.notesUpdate } : {}),
  }), [activityEditing.notesUpdate, isTitleDirty, title]);

  const hasUnsavedChanges = isTitleDirty || isStateDirty || activityEditing.hasStagedChanges;

  const onAddEvent = useCallback(async (saveResults) => {
    const [firstResult] = Array.isArray(saveResults) ? saveResults : [saveResults];
    const newEventId = firstResult.data.data.id;

    // The event is already saved: a failed link leaves it out of the patrol,
    // not unreported, so the rest of the flow carries on.
    try {
      await addPatrolSegmentToEvent(governingPatrolSegment(patrol).id, newEventId);

      patrolOverviewTracker.track('Link new event to patrol');
    } catch (error) {
      toast.error(t('addEventLinkErrorMessage'));

      patrolOverviewTracker.track('Error linking new event to patrol');

      console.warn('Error linking a new event to a patrol: ', error);
    }

    // The event form is waiting on this, so a failed refresh must not reject
    // into it.
    await dispatch(fetchPatrol(patrol.id)).catch(() => {});
  }, [dispatch, patrol, t]);

  const addEventFormProps = useMemo(() => ({
    isPatrolReport: true,
    onSaveSuccess: onAddEvent,
    redirectTo: [{ pathname: `/${SIDEBAR_TAB_KEYS.PATROLS}/${patrol.id}` }],
  }), [onAddEvent, patrol.id]);

  const onChangeState = useCallback((pickedState) => {
    setEditedState(pickedState === patrolState ? null : pickedState);
  }, [patrolState]);

  const savePatrol = useCallback(async () => {
    // The status update is built here, and not alongside the other updates,
    // because it stamps the transition with the moment the patrol is saved.
    const statusUpdate = isStateDirty ? buildPatrolStatusUpdate(patrol, state) : null;
    const patrolUpdatesWithStatusUpdate = { ...patrolUpdates, ...statusUpdate };
    const hasUpdates = Object.keys(patrolUpdatesWithStatusUpdate).length > 0;

    // Update the patrol and upload the new attachments in parallel.
    const [patrolUpdateResult, ...attachmentResults] = await Promise.allSettled([
      hasUpdates ? dispatch(updatePatrol({ ...patrolUpdatesWithStatusUpdate, id: patrol.id })) : Promise.resolve(),
      ...activityEditing.newAttachments.map((newAttachment) => uploadPatrolFile(patrol.id, newAttachment.file)),
    ]);

    const refetchPatrol = dispatch(fetchPatrol(patrol.id)).catch(() => {});

    if (patrolUpdateResult.status === 'fulfilled') {
      // The patrol update went through. Clear what it saved.
      setEditedState(null);
      setEditedTitle(null);
      activityEditing.onNotesSaved();
    }

    // Whatever was uploaded stops being staged, whether the rest of the save
    // went through or not: the refetched patrol carries it from here on.
    activityEditing.onAttachmentsUploaded(
      activityEditing.newAttachments.filter((_, index) => attachmentResults[index].status === 'fulfilled')
    );

    const failedRequest = [patrolUpdateResult, ...attachmentResults].find((request) => request.status === 'rejected');
    if (!failedRequest) {
      patrolOverviewTracker.track('Saved patrol from patrol overview');

      return true;
    }

    await refetchPatrol;

    toast.error(patrolUpdateResult.status === 'fulfilled' ? t('attachmentsSaveErrorMessage') : t('saveErrorMessage'));

    patrolOverviewTracker.track('Error saving patrol from patrol overview');

    console.warn('Error saving patrol: ', failedRequest.reason);

    return false;
  }, [activityEditing, dispatch, isStateDirty, patrol, patrolUpdates, state, t]);

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
    patrol.patrol_segments.forEach((segment) => {
      const trackedSubjectIds = getTrackedSubjectsForPatrolSegment(segment, patrolTeamAndTrackingOptions)
        .map((trackedSubject) => trackedSubject.id);

      if (trackedSubjectIds.length > 0) {
        fetchTracksIfNecessary(
          trackedSubjectIds,
          {
            optionalDateBoundaries: {
              since: segment.time_range?.start_time,
              until: segment.time_range?.end_time,
            },
          },
        );
      }
    });
  }, [patrol, patrolTeamAndTrackingOptions]);

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
              attachments={activityEditing.patrolAttachments}
              existingNotes={activityEditing.editedNotes}
              newAttachments={activityEditing.newAttachments}
              newNotes={activityEditing.newNotes}
              onCancelNote={activityEditing.onCancelNote}
              onChangeNote={activityEditing.onChangeNote}
              onDeleteAttachment={activityEditing.onDeleteAttachment}
              onDeleteNote={activityEditing.onDeleteNote}
              onDoneNote={activityEditing.onDoneNote}
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
        disableAddNoteButton={activityEditing.isAddNoteDisabled}
        disableSaveButton={!hasUnsavedChanges}
        isSaving={isSaving}
        onAddAttachments={activityEditing.onAddAttachments}
        onAddNote={activityEditing.onAddNote}
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
  const isMountedRef = useRef(true);

  const [isLoadingPatrol, setIsLoadingPatrol] = useState(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    if (patrolId && fetchedPatrolIdRef.current !== patrolId) {
      fetchedPatrolIdRef.current = patrolId;

      dispatch(fetchPatrol(patrolId))
        .then(() => setIsLoadingPatrol(false))
        .catch((error) => {
          // A cancelled request means the session is being torn down. Redirect
          // if the component has not been unmounted yet.
          if (isMountedRef.current && !isCancel(error)) {
            navigate(`/${SIDEBAR_TAB_KEYS.PATROLS}`, { replace: true });
          }
        });
    }
  }, [dispatch, navigate, patrolId]);

  return isLoadingPatrol || !patrol
    ? <DetailViewLoader />
    : <PatrolOverviewContent patrol={patrol} />;
};

export default PatrolOverview;
