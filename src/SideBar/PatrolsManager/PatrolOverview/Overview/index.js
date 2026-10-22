import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowRightFromLineIcon } from '../../../../common/images/icons/arrow-right-from-line.svg';
import { ReactComponent as PauseIcon } from '../../../../common/images/icons/pause.svg';
import { ReactComponent as PlayIcon } from '../../../../common/images/icons/play.svg';

import {
  actualEndTimeForPatrol,
  actualEndTimeForPatrolSegment,
  actualStartTimeForPatrol,
  actualStartTimeForPatrolSegment,
  displayNumberForPatrolSegment,
  getElapsedTimeForPatrol,
  getElapsedTimeForPatrolSegment,
  getReportsForPatrol,
  hasPatrolSegmentNotRun,
  isPatrolSegmentAPause,
} from '../../../../utils/patrols';
import { getEventIdsForCollection } from '../../../../utils/events';
import { longTermDurationHumanizer } from '../../../../utils/datetime';
import { PATROL_UI_STATES, TAB_KEYS } from '../../../../constants';

import Activity from '../../Activity';
import Legs from './Legs';

import * as styles from './styles.module.scss';

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
  const { i18n, t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview' });
  const { t: tDates } = useTranslation('dates');

  const humanizeDuration = useMemo(() => longTermDurationHumanizer(tDates, i18n.language), [i18n.language, tDates]);

  // Held stable so that the memoized activity section can bail on a render
  // the patrol itself did not change on.
  const patrolEndTime = useMemo(
    // A patrol that never began has no end that marks anything that happened.
    () => actualStartTimeForPatrol(patrol) ? actualEndTimeForPatrol(patrol) : null,
    [patrol]
  );
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

  const legLinkForPatrolSegment = useCallback((patrolSegmentIndex) => {
    const patrolSegment = patrol.patrol_segments[patrolSegmentIndex];

    return {
      label: t(
        `viewLegLinkLabel.${isPatrolSegmentAPause(patrolSegment) ? 'pause' : 'leg'}`,
        { number: displayNumberForPatrolSegment(patrol.patrol_segments, patrolSegmentIndex) }
      ),
      to: `/${TAB_KEYS.PATROLS}/${patrol.id}/legs/${patrolSegment.id}`,
    };
  }, [patrol.id, patrol.patrol_segments, t]);

  // The first leg has no start row of its own: the patrol starting stands for it.
  const patrolStartLink = useMemo(
    () => patrol.patrol_segments.length > 0 ? legLinkForPatrolSegment(0) : null,
    [legLinkForPatrolSegment, patrol.patrol_segments.length]
  );

  const legMilestones = useMemo(() => patrol.patrol_segments.flatMap((patrolSegment, index) => {
    // Closing a patrol stamps an end even on a leg that never ran, and that
    // end marks nothing that happened.
    if (hasPatrolSegmentNotRun(patrol, patrolSegment)) {
      return [];
    }

    const legNumber = displayNumberForPatrolSegment(patrol.patrol_segments, index);
    const startTime = index > 0 ? actualStartTimeForPatrolSegment(patrolSegment) : null;
    const endTime = index < patrol.patrol_segments.length - 1 ? actualEndTimeForPatrolSegment(patrolSegment) : null;

    // A pause interrupts the patrol rather than carrying it on, so its moments
    // are the patrol stopping and, where a leg follows, picking back up.
    if (isPatrolSegmentAPause(patrolSegment)) {
      return [
        ...(startTime ? [{
          date: startTime,
          icon: PauseIcon,
          id: `${patrolSegment.id}-start`,
          link: legLinkForPatrolSegment(index),
          title: t('patrolPausedTitle'),
          variant: PATROL_UI_STATES.PAUSED.key,
        }] : []),
        ...(endTime ? [{
          date: endTime,
          icon: PlayIcon,
          id: `${patrolSegment.id}-end`,
          title: t('patrolResumedTitle', {
            duration: humanizeDuration(getElapsedTimeForPatrolSegment(patrolSegment)),
          }),
          variant: PATROL_UI_STATES.ACTIVE.key,
        }] : []),
      ];
    }

    return [
      ...(startTime ? [{
        date: startTime,
        icon: ArrowRightFromLineIcon,
        id: `${patrolSegment.id}-start`,
        link: legLinkForPatrolSegment(index),
        title: t('legStartedTitle', { legNumber }),
      }] : []),
      ...(endTime ? [{
        date: endTime,
        id: `${patrolSegment.id}-end`,
        title: t('legEndedTitle', {
          duration: humanizeDuration(getElapsedTimeForPatrolSegment(patrolSegment)),
          legNumber,
        }),
      }] : []),
    ];
  }), [humanizeDuration, legLinkForPatrolSegment, patrol, t]);

  return <>
    <Legs patrol={patrol} patrolState={patrolState} />

    <Activity
      attachments={attachments}
      className={styles.activity}
      containedEvents={containedEvents}
      emptyStateMessage={t('activityEmptyStateMessage')}
      endTime={patrolEndTime}
      endTitle={t('patrolEndedTitle', {
        duration: patrolEndTime ? humanizeDuration(getElapsedTimeForPatrol(patrol)) : null,
      })}
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
      startIcon={ArrowRightFromLineIcon}
      startLink={patrolStartLink}
      startTime={patrolStartTime}
      startTitle={t('patrolStartedTitle')}
    />
  </>;
};

export default memo(Overview);
