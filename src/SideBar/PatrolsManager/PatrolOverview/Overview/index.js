import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PauseIcon } from '../../../../common/images/icons/pause.svg';
import { ReactComponent as PlayIcon } from '../../../../common/images/icons/play.svg';

import {
  actualEndTimeForPatrol,
  actualEndTimeForPatrolSegment,
  actualStartTimeForPatrol,
  actualStartTimeForPatrolSegment,
  effectiveEndTimeForPatrolSegment,
  getElapsedTimeForPatrolSegment,
  getReportsForPatrol,
  hasPatrolSegmentNotRun,
  isPatrolPaused,
  isPatrolSegmentAPause,
} from '../../../../utils/patrols';
import { getEventIdsForCollection } from '../../../../utils/events';
import { longTermAbbreviatedDurationHumanizer } from '../../../../utils/datetime';
import { PATROL_UI_STATES } from '../../../../constants';
import useCurrentTime from '../../../../hooks/useCurrentTime';

import Activity from '../../Activity';
import Legs from './Legs';

import * as styles from './styles.module.scss';

const PAUSED_TIME_REFRESH_INTERVAL = 30_000;

const Overview = ({
  attachments,
  existingNotes,
  newAttachments,
  newNotes,
  onCancelNote,
  onChangeNote,
  onDeleteAttachment,
  onDeleteNote,
  onDoneNote,
  patrol,
  patrolState,
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview' });
  const { t: tDates } = useTranslation('dates');

  const currentTime = useCurrentTime(isPatrolPaused(patrol) ? PAUSED_TIME_REFRESH_INTERVAL : null);

  const humanizeDuration = useMemo(() => longTermAbbreviatedDurationHumanizer(tDates), [tDates]);

  // Held stable so that the memoized activity section can bail on a render
  // the patrol itself did not change on.
  const patrolEndTime = useMemo(() => actualEndTimeForPatrol(patrol), [patrol]);
  const patrolStartTime = useMemo(() => actualStartTimeForPatrol(patrol), [patrol]);

  const containedEvents = useMemo(() => {
    const patrolEvents = getReportsForPatrol(patrol);

    const patrolCollections = patrolEvents.filter((event) => event.is_collection);
    const idsOfEventsInPatrolCollections = patrolCollections.reduce(
      (accumulator, incident) => [...accumulator, ...(getEventIdsForCollection(incident) || [])],
      []
    );

    return patrolEvents.filter((event) => !idsOfEventsInPatrolCollections.includes(event.id));
  }, [patrol]);

  const legMilestones = useMemo(() => patrol.patrol_segments.flatMap((patrolSegment, index) => {
    // Closing a patrol stamps an end even on a leg that never ran, and that
    // end marks nothing that happened.
    if (hasPatrolSegmentNotRun(patrol, patrolSegment)) {
      return [];
    }

    const legNumber = index + 1;
    const startTime = index > 0 ? actualStartTimeForPatrolSegment(patrolSegment) : null;
    const endTime = index < patrol.patrol_segments.length - 1 ? actualEndTimeForPatrolSegment(patrolSegment) : null;

    // A pause interrupts the patrol rather than carrying it on, so its moments
    // are the patrol stopping and, where a leg follows, picking back up.
    if (isPatrolSegmentAPause(patrolSegment)) {
      // A pause the patrol was called off or closed on has an end of its own,
      // so only one the patrol is still sitting on counts up to now.
      const pausedUntil = effectiveEndTimeForPatrolSegment(patrol, patrolSegment)?.getTime() ?? currentTime;
      const pausedFor = humanizeDuration(getElapsedTimeForPatrolSegment(patrolSegment, pausedUntil));

      return [
        ...(startTime ? [{
          date: startTime,
          icon: PauseIcon,
          id: `${patrolSegment.id}-start`,
          title: t('patrolPausedTitle', { pausedFor }),
          variant: PATROL_UI_STATES.PAUSED.key,
        }] : []),
        ...(endTime ? [{
          date: endTime,
          icon: PlayIcon,
          id: `${patrolSegment.id}-end`,
          title: t('patrolResumedTitle'),
          variant: PATROL_UI_STATES.ACTIVE.key,
        }] : []),
      ];
    }

    return [
      ...(startTime
        ? [{ date: startTime, id: `${patrolSegment.id}-start`, title: t('legStartedTitle', { legNumber }) }]
        : []),
      ...(endTime
        ? [{ date: endTime, id: `${patrolSegment.id}-end`, title: t('legEndedTitle', { legNumber }) }]
        : []),
    ];
  }), [currentTime, humanizeDuration, patrol, t]);

  return <>
    <Legs patrol={patrol} patrolState={patrolState} />

    <Activity
      attachments={attachments}
      className={styles.activity}
      containedEvents={containedEvents}
      emptyStateMessage={t('activityEmptyStateMessage')}
      endTime={patrolEndTime}
      endTitle={t('patrolEndedTitle')}
      existingNotes={existingNotes}
      milestones={legMilestones}
      newAttachments={newAttachments}
      newNotes={newNotes}
      onCancelNote={onCancelNote}
      onChangeNote={onChangeNote}
      onDeleteAttachment={onDeleteAttachment}
      onDeleteNote={onDeleteNote}
      onDoneNote={onDoneNote}
      patrol={patrol}
      startTime={patrolStartTime}
      startTitle={t('patrolStartedTitle')}
    />
  </>;
};

export default memo(Overview);
