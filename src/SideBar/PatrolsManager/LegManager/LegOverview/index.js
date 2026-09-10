import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { addPatrolSegmentToEvent, getEventIdsForCollection } from '../../../../utils/events';
import {
  actualEndTimeForPatrolSegment,
  actualStartTimeForPatrolSegment,
  canEditPatrolSegment,
  filterActivityItemsForPatrolSegment,
  getReportsForPatrolSegment,
  getTrackedSubjectsForPatrolSegment,
  hasPatrolSegmentNotRun,
  isPatrolStateUnderWay,
} from '../../../../utils/patrols';
import { fetchPatrol, updatePatrol, uploadPatrolFile } from '../../../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../../../utils/tracks';
import { LEG_OVERVIEW_CATEGORY, TrackerContext, trackEventFactory } from '../../../../utils/analytics';
import { selectPatrolRosterFallbackSubjects } from '../../../../selectors/patrols';
import { TAB_KEYS } from '../../../../constants';
import useNavigate from '../../../../hooks/useNavigate';
import usePatrolActivityEditing from '../../utils/usePatrolActivityEditing';
import usePatrolState from '../../../../hooks/usePatrolState';

import Activity from '../../Activity';
import DetailViewLoader from '../../DetailViewLoader';
import Footer from './Footer';
import Header from './Header';
import NavigationPromptModal from '../../../../NavigationPromptModal';
import Plan from './Plan';

import * as styles from './styles.module.scss';

const legOverviewTracker = trackEventFactory(LEG_OVERVIEW_CATEGORY);

const LegOverviewContent = ({ legNumber, onStagedChangesChange, patrol, patrolSegment }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('patrols', { keyPrefix: 'legOverview' });

  const activityEditing = usePatrolActivityEditing(patrol, legOverviewTracker);
  const legState = usePatrolState(patrol, patrolSegment);

  const patrolRosterFallbackSubjects = useSelector((state) => selectPatrolRosterFallbackSubjects(state, patrol));
  const patrolTeamAndTrackingOptions = useSelector((state) => state.data.patrolTeamAndTrackingOptions);

  const printableContentRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);

  const hasNotRun = hasPatrolSegmentNotRun(patrol, patrolSegment);

  // Events belong to the leg itself; notes and files belong to the patrol, so
  // the leg claims the ones written while it ran.
  const legAttachments = useMemo(
    () => filterActivityItemsForPatrolSegment(activityEditing.patrolAttachments, patrolSegment),
    [activityEditing.patrolAttachments, patrolSegment]
  );

  const legNotes = useMemo(
    () => filterActivityItemsForPatrolSegment(activityEditing.editedNotes, patrolSegment),
    [activityEditing.editedNotes, patrolSegment]
  );

  // Held stable so that the memoized activity section can bail on a render
  // the leg itself did not change on.
  const legEndTime = useMemo(
    () => hasNotRun ? null : actualEndTimeForPatrolSegment(patrolSegment),
    [hasNotRun, patrolSegment]
  );

  const legStartTime = useMemo(() => actualStartTimeForPatrolSegment(patrolSegment), [patrolSegment]);

  const legEvents = useMemo(() => {
    const segmentEvents = getReportsForPatrolSegment(patrolSegment);

    const segmentCollections = segmentEvents.filter((event) => event.is_collection);
    const idsOfEventsInSegmentCollections = segmentCollections.reduce(
      (accumulator, incident) => [...accumulator, ...(getEventIdsForCollection(incident) || [])],
      []
    );

    return segmentEvents.filter((event) => !idsOfEventsInSegmentCollections.includes(event.id));
  }, [patrolSegment]);

  const onAddEvent = useCallback(async (saveResults) => {
    const [firstResult] = Array.isArray(saveResults) ? saveResults : [saveResults];
    const newEventId = firstResult.data.data.id;

    // The event is already saved: a failed link leaves it out of the leg, not
    // unreported, so the rest of the flow carries on.
    try {
      await addPatrolSegmentToEvent(patrolSegment.id, newEventId);

      legOverviewTracker.track('Link new event to leg');
    } catch (error) {
      toast.error(t('addEventLinkErrorMessage'));

      legOverviewTracker.track('Error linking new event to leg');

      console.warn('Error linking a new event to a leg: ', error);
    }

    // The event form is waiting on this, so a failed refresh must not reject
    // into it.
    await dispatch(fetchPatrol(patrol.id)).catch(() => {});
  }, [dispatch, patrol.id, patrolSegment.id, t]);

  const addEventFormProps = useMemo(() => ({
    isPatrolReport: true,
    onSaveSuccess: onAddEvent,
    redirectTo: [{ pathname: `/${TAB_KEYS.PATROLS}/${patrol.id}/legs/${patrolSegment.id}` }],
  }), [onAddEvent, patrol.id, patrolSegment.id]);

  const savePatrol = useCallback(async () => {
    const [patrolUpdateResult, ...attachmentResults] = await Promise.allSettled([
      activityEditing.notesUpdate
        ? dispatch(updatePatrol({ id: patrol.id, notes: activityEditing.notesUpdate }))
        : Promise.resolve(),
      ...activityEditing.newAttachments.map((newAttachment) => uploadPatrolFile(patrol.id, newAttachment.file)),
    ]);

    const refetchPatrol = dispatch(fetchPatrol(patrol.id)).catch(() => {});

    if (patrolUpdateResult.status === 'fulfilled') {
      activityEditing.onNotesSaved();
    }

    // Whatever was uploaded stops being staged, whether the rest of the save
    // went through or not: the refetched patrol carries it from here on.
    activityEditing.onAttachmentsUploaded(
      activityEditing.newAttachments.filter((_, index) => attachmentResults[index].status === 'fulfilled')
    );

    const failedRequest = [patrolUpdateResult, ...attachmentResults].find((request) => request.status === 'rejected');
    if (!failedRequest) {
      legOverviewTracker.track('Saved a leg from leg overview');

      await refetchPatrol;

      return true;
    }

    await refetchPatrol;

    toast.error(patrolUpdateResult.status === 'fulfilled' ? t('attachmentsSaveErrorMessage') : t('saveErrorMessage'));

    legOverviewTracker.track('Error saving a leg from leg overview');

    console.warn('Error saving a leg: ', failedRequest.reason);

    return false;
  }, [activityEditing, dispatch, patrol.id, t]);

  const onSave = useCallback(async () => {
    legOverviewTracker.track('Click the "Save" button in leg overview');

    setIsSaving(true);

    await savePatrol();

    setIsSaving(false);
  }, [savePatrol]);

  // The prompt keeps the user on the page when this answers falsy, so a save
  // that failed leaves them with their edits rather than losing them.
  const onContinueNavigation = useCallback((shouldSave) => {
    if (shouldSave) {
      legOverviewTracker.track('Save unsaved changes and navigate away from leg overview');

      return savePatrol();
    }

    legOverviewTracker.track('Discard unsaved changes and navigate away from leg overview');

    return true;
  }, [savePatrol]);

  // Lifted so that the route keeps this leg on screen while an edit is staged
  // on it, rather than sending the user away with the edit.
  useEffect(() => {
    onStagedChangesChange(activityEditing.hasStagedChanges);
  }, [activityEditing.hasStagedChanges, onStagedChangesChange]);

  useEffect(() => {
    const trackedSubjectIds = getTrackedSubjectsForPatrolSegment(
      patrolSegment,
      patrolTeamAndTrackingOptions,
      patrolRosterFallbackSubjects
    ).map((trackedSubject) => trackedSubject.id);

    if (trackedSubjectIds.length > 0) {
      fetchTracksIfNecessary(
        trackedSubjectIds,
        {
          optionalDateBoundaries: {
            since: patrolSegment.time_range?.start_time,
            until: patrolSegment.time_range?.end_time,
          },
        },
      );
    }
  }, [patrolRosterFallbackSubjects, patrolSegment, patrolTeamAndTrackingOptions]);

  return <TrackerContext.Provider value={legOverviewTracker}>
    <NavigationPromptModal onContinue={onContinueNavigation} when={activityEditing.hasStagedChanges && !isSaving} />

    <div className={styles.legOverview} ref={printableContentRef}>
      <Header
        legNumber={legNumber}
        legState={legState}
        patrol={patrol}
        patrolSegment={patrolSegment}
        printableContentRef={printableContentRef}
      />

      <div className={styles.body}>
        <Plan patrol={patrol} patrolSegment={patrolSegment} />

        <Activity
          attachments={legAttachments}
          containedEvents={legEvents}
          emptyStateMessage={t('activityEmptyStateMessage')}
          endTime={legEndTime}
          endTitle={t('legEndedTitle', { legNumber })}
          existingNotes={legNotes}
          newAttachments={activityEditing.newAttachments}
          newNotes={activityEditing.newNotes}
          onCancelNote={activityEditing.onCancelNote}
          onChangeNote={activityEditing.onChangeNote}
          onDeleteAttachment={activityEditing.onDeleteAttachment}
          onDeleteNote={activityEditing.onDeleteNote}
          onDoneNote={activityEditing.onDoneNote}
          patrol={patrol}
          patrolSegment={patrolSegment}
          startTime={legStartTime}
          startTitle={t('legStartedTitle', { legNumber })}
        />
      </div>

      <Footer
        addEventFormProps={addEventFormProps}
        canEditLeg={canEditPatrolSegment(patrol, legState)}
        disableAddNoteButton={activityEditing.isAddNoteDisabled}
        disableSaveButton={!activityEditing.hasStagedChanges}
        isLegUnderWay={isPatrolStateUnderWay(legState)}
        isSaving={isSaving}
        legId={patrolSegment.id}
        onAddAttachments={activityEditing.onAddAttachments}
        onAddNote={activityEditing.onAddNote}
        onSave={onSave}
        patrolId={patrol.id}
      />
    </div>
  </TrackerContext.Provider>;
};

const LegOverview = ({ patrol }) => {
  const navigate = useNavigate();
  const { legId } = useParams();

  const [hasStagedChanges, setHasStagedChanges] = useState(false);
  const [lastShownLeg, setLastShownLeg] = useState(null);

  const patrolSegmentIndex = patrol.patrol_segments.findIndex((patrolSegment) => patrolSegment.id === legId);

  const foundLeg = patrolSegmentIndex === -1
    ? null
    : { legNumber: patrolSegmentIndex + 1, patrolSegment: patrol.patrol_segments[patrolSegmentIndex] };

  if (foundLeg && foundLeg.patrolSegment !== lastShownLeg?.patrolSegment) {
    setLastShownLeg(foundLeg);
  }

  // A leg that goes away under an unsaved edit stays on screen, its number
  // included, so the user saves or discards it rather than losing it to the
  // redirect below.
  const shownLeg = foundLeg ?? (hasStagedChanges ? lastShownLeg : null);

  const hasLegToShow = !!shownLeg;

  useEffect(() => {
    // This route is reachable by its url alone.
    if (!hasLegToShow) {
      navigate(`/${TAB_KEYS.PATROLS}/${patrol.id}`, { replace: true });
    }
  }, [hasLegToShow, navigate, patrol.id]);

  // Keyed by leg, so what the user staged on one does not follow them to the
  // next.
  return shownLeg
    ? <LegOverviewContent
      key={shownLeg.patrolSegment.id}
      legNumber={shownLeg.legNumber}
      onStagedChangesChange={setHasStagedChanges}
      patrol={patrol}
      patrolSegment={shownLeg.patrolSegment}
    />
    : <DetailViewLoader />;
};

export default LegOverview;
