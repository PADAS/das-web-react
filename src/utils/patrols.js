import React from 'react';
import {
  addHours,
  addMinutes,
  formatDistance,
  isThisYear,
  isToday,
  startOfMinute,
} from 'date-fns';
import { bbox, booleanEqual, featureCollection, point, multiLineString } from '@turf/turf';
import i18next from 'i18next';
import concat from 'lodash/concat';
import orderBy from 'lodash/orderBy';
import cloneDeep from 'lodash/cloneDeep';
import isUndefined from 'lodash/isUndefined';
import isNil from 'lodash/isNil';
import omit from 'lodash/omit';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';

import { calcSpriteSvgUrl } from './img';
import { format, getCurrentLocale, SHORT_TIME_FORMAT } from './datetime';
import { PATROL_UI_STATES, PATROL_API_STATES } from '../constants';

import TimeAgo from '../TimeAgo';

import store from '../store';
import { addNoteToPatrol, createPatrol, updatePatrol, uploadPatrolFile } from '../ducks/patrols';

import { getReporterById } from './events';

import * as colorVariables from '../common/styles/vars/colors.module.scss';

const DEFAULT_STROKE = '#FF0080';
export const DELTA_FOR_OVERDUE = 30; //minutes till we say something is overdue
export const READY_TO_START_WINDOW_HOURS = 1; // hours before its start a patrol counts as ready to start

const PATROL_STATUS_THEME_COLOR_MAP = {
  [PATROL_UI_STATES.SCHEDULED.key]: {
    base: colorVariables.patrolReadyThemeColor,
    background: colorVariables.patrolReadyThemeBgColor,
  },
  [PATROL_UI_STATES.READY_TO_START.key]: {
    base: colorVariables.patrolReadyThemeColor,
    background: colorVariables.patrolReadyThemeBgColor,
  },
  [PATROL_UI_STATES.ACTIVE.key]: {
    base: colorVariables.patrolActiveThemeColor,
    background: colorVariables.patrolActiveThemeBgColor,
  },
  [PATROL_UI_STATES.PAUSED.key]: {
    base: colorVariables.patrolPausedThemeColor,
    background: colorVariables.patrolPausedThemeBgColor,
  },
  [PATROL_UI_STATES.DONE.key]: {
    base: colorVariables.patrolDoneThemeColor,
    background: colorVariables.patrolDoneThemeBgColor,
  },
  [PATROL_UI_STATES.START_OVERDUE.key]: {
    base: colorVariables.patrolOverdueThemeColor,
    background: colorVariables.patrolOverdueThemeBgColor,
  },
  [PATROL_UI_STATES.CANCELLED.key]: {
    base: colorVariables.patrolCancelledThemeColor,
    background: colorVariables.patrolCancelledThemeBgColor,
    fontColor: colorVariables.patrolCancelledThemeFontColor,
  },
  [PATROL_UI_STATES.INVALID.key]: {
    base: colorVariables.patrolCancelledThemeColor,
    background: colorVariables.patrolCancelledThemeBgColor,
    fontColor: colorVariables.patrolCancelledThemeFontColor,
  },
};

export const calcColorThemeForPatrolState = (patrolState) => {

  return PATROL_STATUS_THEME_COLOR_MAP[patrolState.key];
};

export const generatePseudoReportCategoryForPatrolTypes = (patrolTypes) => {
  const categoryObject = {
    'value': 'patrols',
    'display': 'Patrols',
    'ordernum': 0,
    'flag': 'user',
    'permissions': [
      'create',
      'update',
      'read',
      'delete'
    ],
  };

  const maxDefinedOrdernum = Math.max(
    ...patrolTypes.reduce((nums, { ordernum }) => {
      if (isNil(ordernum)) return nums;

      nums.push(ordernum);
      return nums;
    }, [])
  );

  const types = patrolTypes
    .filter(type => !!type.is_active)
    .map(type => ({
      ...type,
      category: { ...categoryObject },
      ordernum: isNil(type.ordernum)
        ? (maxDefinedOrdernum+1)
        : type.ordernum
    }));

  return {
    ...categoryObject,
    types: orderBy(types, ['ordernum', 'display']),
  };
};


export const createNewPatrolForPatrolType = (patrolType, data, isAutoStart = true) => {
  const { value: patrol_type, icon_id, default_priority: priority = 0 } = patrolType;
  const location = data && data.location;
  const reportedById = data && data.reportedById;
  const time = data && data.time;

  const trackingSubject = reportedById && getReporterById(reportedById);

  const leader = trackingSubject ? trackingSubject : null;
  const startTime = time ? new Date(time) : new Date();

  return {
    icon_id,
    is_collection: false,
    // state: 'active',
    priority,
    created_at: new Date(),
    patrol_segments: [
      {
        patrol_type,
        priority,
        events: [],
        scheduled_start: isAutoStart ? null : startTime,
        leader,
        start_location: location ? { ...location } : null,
        time_range: {
          start_time: isAutoStart ? startTime : null,
          end_time: null,
        },
        end_location: null,
      },
    ],
    files: [],
    notes: [],
    title: null,
  };
};

export const iconTypeForPatrol = (patrol) => {
  const UNKNOWN_TYPE = '';

  if (patrol.icon_id) return patrol.icon_id;

  const lastSegment = patrol.patrol_segments[patrol.patrol_segments.length - 1];

  if (lastSegment?.icon_id) return lastSegment.icon_id;

  return UNKNOWN_TYPE;
};

export const findMatchingPatrolType = (patrolTypes, patrolType) => (patrolTypes || []).find(type =>
  (type.value === patrolType) || (type.id === patrolType)
);

export const displayNameForPatrolType = (patrolTypes, patrolType) =>
  findMatchingPatrolType(patrolTypes, patrolType)?.display ?? null;

export const iconIdForPatrolType = (patrolTypes, patrolType) =>
  findMatchingPatrolType(patrolTypes, patrolType)?.icon_id ?? null;

export const iconIdForPatrolSegment = (patrolTypes, patrolSegment) =>
  iconIdForPatrolType(patrolTypes, patrolSegment.patrol_type) ?? patrolSegment.icon_id ?? null;

export const displayTitleForPatrol = (patrol, leader, includeLeaderName = true) => {
  const t = i18next.getFixedT(null, 'utils', 'displayTitleForPatrol');
  if (patrol.title) return patrol.title;

  if (includeLeaderName && leader && leader.name) {
    return leader.name;
  }


  const lastSegment = patrol.patrol_segments[patrol.patrol_segments.length - 1];

  if (!lastSegment?.patrol_type) return t('unknown');

  const { data: { patrolTypes } } = store.getState();

  return displayNameForPatrolType(patrolTypes, lastSegment.patrol_type) ?? t('unknown');
};

export const displayStartTimeForPatrolSegment = (patrolSegment) => {
  const { time_range: { start_time } = {}, scheduled_start } = patrolSegment;

  return (start_time || scheduled_start)
    ? new Date((start_time || scheduled_start))
    : null;
};

export const displayStartTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;

  return displayStartTimeForPatrolSegment(patrol.patrol_segments[0]);
};

export const actualStartTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { time_range: { start_time } = {} } = firstLeg;

  return start_time
    ? new Date(start_time)
    : null;
};

// A patrol serves its legs a reduced event that leaves out the `time` the
// activity feed sorts and labels by. Its geojson carries the same instant.
const withReportedTime = (event) => {
  const reportedTime = event.geojson?.properties?.datetime;

  return !event.time && reportedTime ? { ...event, time: reportedTime } : event;
};

export const getReportsForPatrol = (patrol) => {
  const patrolReportsById = new Map((patrol?.patrol_segments ?? [])
    .flatMap((segment) => segment.events ?? [])
    .map((event) => [event.id, withReportedTime(event)]));

  return [...patrolReportsById.values()];
};

export const getReportsForPatrolSegment = (patrolSegment) => {
  const patrolSegmentReportsById = new Map(
    (patrolSegment.events ?? []).map((event) => [event.id, withReportedTime(event)])
  );

  return [...patrolSegmentReportsById.values()];
};

// Notes and files belong to the patrol, so a leg claims the ones written while
// it ran.
export const filterActivityItemsForPatrolSegment = (activityItems, patrolSegment) => {
  const since = patrolSegment.time_range?.start_time
    ? new Date(patrolSegment.time_range.start_time).getTime()
    : null;

  if (since === null) {
    return [];
  }

  const until = patrolSegment.time_range?.end_time
    ? new Date(patrolSegment.time_range.end_time).getTime()
    : Infinity;

  return activityItems.filter((activityItem) => {
    // A leg claims what was written while it ran, so an edit made later does
    // not move a note onto the leg the user happened to be editing from.
    const itemTime = new Date(
      activityItem.created_at || activityItem.updates?.at(-1)?.time || activityItem.updated_at
    ).getTime();

    // Consecutive legs share an instant, so the range is half-open.
    return itemTime >= since && itemTime < until;
  });
};

export const displayEndTimeForPatrolSegment = (patrolSegment) => {
  const { scheduled_end, time_range: { end_time } = {} } = patrolSegment;

  const value = end_time || scheduled_end;

  return value
    ? new Date(value)
    : null;
};

export const actualStartTimeForPatrolSegment = (patrolSegment) => patrolSegment.time_range?.start_time
  ? new Date(patrolSegment.time_range.start_time)
  : null;

export const actualEndTimeForPatrolSegment = (patrolSegment) => patrolSegment.time_range?.end_time
  ? new Date(patrolSegment.time_range.end_time)
  : null;

export const scheduledEndTimeForPatrolSegment = (patrolSegment) =>
  patrolSegment.scheduled_end ? new Date(patrolSegment.scheduled_end) : null;

// The earliest a following leg may begin is where this one ends, or begins
// while it has no end.
export const earliestStartAfterPatrolSegment = (patrolSegment) => {
  const earliestStart = displayEndTimeForPatrolSegment(patrolSegment)
    ?? displayStartTimeForPatrolSegment(patrolSegment);

  return earliestStart && (earliestStart.getSeconds() || earliestStart.getMilliseconds())
    ? addMinutes(startOfMinute(earliestStart), 1)
    : earliestStart;
};

export const displayEndTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;

  return displayEndTimeForPatrolSegment(patrol.patrol_segments[patrol.patrol_segments.length - 1]);
};

export const actualEndTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const lastLeg = patrol.patrol_segments[patrol.patrol_segments.length - 1];

  const { time_range: { end_time } = {} } = lastLeg;

  const value = end_time;

  return value
    ? new Date(value)
    : null;
};

const EMPTY_TEAM_AND_TRACKING_OPTIONS = { assets: [], members: [], teams: [] };

// A leg stores its team and rosters as ids. The configured lists only offer
// what a site can pick today, so a subject deactivated since the leg ran falls
// back to the subject store rather than dropping out of what it did.
const resolveRoster = (rosterIds, rosterOptions, subjectStore) => uniq(rosterIds ?? [])
  .map((rosterId) => rosterOptions.find(({ id }) => id === rosterId) ?? subjectStore[rosterId])
  .filter(Boolean);

export const getTeamAndTrackingForPatrolSegment = (
  patrolSegment,
  teamAndTrackingOptions = EMPTY_TEAM_AND_TRACKING_OPTIONS,
  subjectStore = {}
) => ({
  assets: resolveRoster(patrolSegment?.assets, teamAndTrackingOptions.assets, subjectStore),
  members: resolveRoster(patrolSegment?.members, teamAndTrackingOptions.members, subjectStore),
  team: teamAndTrackingOptions.teams.find(({ id }) => id === patrolSegment?.team) ?? null,
});

// Every subject a leg tracks, each of them once and its lead first: the lead,
// the team members and the assets.
export const getTrackedSubjectsForPatrolSegment = (patrolSegment, teamAndTrackingOptions, subjectStore) => {
  const teamAndTracking = getTeamAndTrackingForPatrolSegment(patrolSegment, teamAndTrackingOptions, subjectStore);

  return uniqBy(
    [
      ...(patrolSegment?.leader ? [patrolSegment.leader] : []),
      ...teamAndTracking.members,
      ...teamAndTracking.assets,
    ],
    'id'
  );
};

export const isPatrolSegmentAPause = (patrolSegment) => !!patrolSegment?.is_pause;

export const getElapsedTimeForPatrolSegment = (patrolSegment, fallbackEndTime) => {
  if (!patrolSegment.time_range?.start_time) {
    return 0;
  }

  const startTime = new Date(patrolSegment.time_range.start_time).getTime();
  const endTime = patrolSegment.time_range.end_time
    ? new Date(patrolSegment.time_range.end_time).getTime()
    : fallbackEndTime;
  return Math.max(0, endTime - startTime);
};

const getLastStateChangeTimeForPatrol = (patrol) => {
  const stateChangeTimes = (patrol.updates ?? [])
    .filter((update) => update.type === 'update_patrol_state')
    .map((update) => new Date(update.time).getTime());

  return stateChangeTimes.length ? new Date(Math.max(...stateChangeTimes)) : null;
};

export const getCancellationTimeForPatrol = (patrol) => isPatrolCancelled(patrol)
  ? getLastStateChangeTimeForPatrol(patrol)
  : null;

export const effectiveEndTimeForPatrol = (patrol) => {
  const legsEndTime = actualEndTimeForPatrol(patrol);

  if (legsEndTime || !(isPatrolCancelled(patrol) || isPatrolDone(patrol))) {
    return legsEndTime;
  }

  return getLastStateChangeTimeForPatrol(patrol) ?? actualStartTimeForPatrol(patrol);
};

// The start of the first leg to have taken over from this one: a leg with no
// end of its own ran only up to there, whatever its own end time never said.
const takeoverTimeAfterPatrolSegment = (patrol, patrolSegment) => {
  const patrolSegments = patrol.patrol_segments ?? [];
  const segmentIndex = patrolSegments.indexOf(patrolSegment);

  if (segmentIndex === -1) {
    return null;
  }

  return patrolSegments
    .slice(segmentIndex + 1)
    .map(actualStartTimeForPatrolSegment)
    .find((startTime) => !!startTime && startTime.getTime() <= Date.now())
    ?? null;
};

// A leg the patrol was cancelled or marked done on carries no end of its own,
// so the moment the patrol was closed stands in for it — and so does the start
// of the leg that took over from one the patrol left open.
export const effectiveEndTimeForPatrolSegment = (patrol, patrolSegment) => {
  const segmentEndTime = actualEndTimeForPatrolSegment(patrolSegment);

  if (segmentEndTime) {
    return segmentEndTime;
  }

  if (isPatrolCancelled(patrol) || isPatrolDone(patrol)) {
    return getLastStateChangeTimeForPatrol(patrol) ?? actualStartTimeForPatrolSegment(patrolSegment);
  }

  return takeoverTimeAfterPatrolSegment(patrol, patrolSegment);
};

const endTimeForPatrolOrFallback = (patrol, fallbackEndTime) =>
  effectiveEndTimeForPatrol(patrol)?.getTime() ?? fallbackEndTime;

export const getElapsedTimeForPatrol = (patrol, fallbackEndTime = Date.now()) => {
  const startDate = actualStartTimeForPatrol(patrol);

  if (!startDate) {
    return 0;
  }

  return Math.max(0, endTimeForPatrolOrFallback(patrol, fallbackEndTime) - startDate.getTime());
};

export const getPausedTimeForPatrol = (patrol, fallbackEndTime = Date.now()) => {
  const endTime = endTimeForPatrolOrFallback(patrol, fallbackEndTime);

  return patrol.patrol_segments.reduce(
    (totalPausedTime, patrolSegment) => isPatrolSegmentAPause(patrolSegment)
      ? totalPausedTime + getElapsedTimeForPatrolSegment(
        patrolSegment,
        effectiveEndTimeForPatrolSegment(patrol, patrolSegment)?.getTime() ?? endTime
      )
      : totalPausedTime,
    0
  );
};

export const getPatrolsForLeaderId = (leaderId) => {
  const { data: { patrolStore } } = store.getState();

  return Object.values(patrolStore).filter(patrol => {
    const lastSegment = patrol.patrol_segments[patrol.patrol_segments.length - 1];

    return !!lastSegment?.leader && lastSegment.leader.id === leaderId;
  });
};

export const getActivePatrolsForLeaderId = (leaderId) => {
  const patrols = getPatrolsForLeaderId(leaderId);
  const activePatrols = patrols.filter(
    item => {
      return calcPatrolState(item) === PATROL_UI_STATES.ACTIVE;
    }
  );

  return activePatrols;
};

export const extractAttachmentUpdates = (collection) => {
  const extractedUpdates =
    collection.reduce((accumulator, { updates }) =>
      updates
        ? [...accumulator, ...updates]
        : accumulator, []
    );
  return extractedUpdates;
};

export const displayDurationForPatrol = (patrol) => {
  const patrolState = calcPatrolState(patrol);

  if (patrolState === PATROL_UI_STATES.READY_TO_START
    || patrolState === PATROL_UI_STATES.SCHEDULED
    || patrolState === PATROL_UI_STATES.START_OVERDUE) {
    return '0:00';
  }

  const now = new Date();
  const nowTime = now.getTime();
  const locale = getCurrentLocale();

  const displayStartTime = actualStartTimeForPatrol(patrol);
  const displayEndTime = actualEndTimeForPatrol(patrol);

  const hasStarted = !!displayStartTime
    && (displayStartTime.getTime() < nowTime);

  if (!hasStarted) return '0s';

  const hasEnded = !!displayEndTime
    && (displayEndTime.getTime() <= nowTime);

  if (!hasEnded) {
    return <TimeAgo date={displayStartTime} />;
  }

  return formatDistance(displayStartTime, displayEndTime, { locale });
};

export const PATROL_SAVE_ACTIONS = {
  create(data) {
    return {
      priority: 300,
      action() {
        return store.dispatch(createPatrol(data));
      },
    };
  },
  update(data) {
    return {
      priority: 250,
      action() {
        return store.dispatch(updatePatrol(data));
      },
    };
  },
  addNote(note) {
    return {
      priority: 200,
      action(patrol_id) {
        return store.dispatch(addNoteToPatrol(patrol_id, note));
      },
    };
  },
  addFile(file) {
    return {
      priority: 200,
      action(patrol_id) {
        return uploadPatrolFile(patrol_id, file);
      },
    };
  },
};

const { READY_TO_START, ACTIVE, DONE, PAUSED, START_OVERDUE, CANCELLED, INVALID, SCHEDULED } = PATROL_UI_STATES;

export const displayPatrolSegmentId = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;
  const { id } = firstLeg;
  return id || null;
};

export const getIsMobilePatrol = (patrol) => patrol?.provenance === 'mobile';

export const isPatrolCancelled = (patrol) => patrol.state === 'cancelled';

export const isPatrolDone = (patrol) => patrol.state === 'done';

export const isSegmentFinished = (patrolSegment) => {
  const { time_range: { end_time } = {} } = patrolSegment;

  if (end_time) {
    const patrolEndDate = new Date(end_time);
    const now = new Date();

    return patrolEndDate.getTime() < now.getTime();
  }
  return false;
};

export const isSegmentOverdue = (patrolSegment) => {
  const { scheduled_start, time_range: { start_time } = {} } = patrolSegment;

  if (!start_time && !!scheduled_start) {
    const patrolStartOverdueDate = addMinutes(new Date(scheduled_start), DELTA_FOR_OVERDUE);

    return patrolStartOverdueDate.getTime() < Date.now();
  }
  return false;
};

export const isSegmentActive = (patrolSegment) => {
  const { time_range: { start_time, end_time } = {} } = patrolSegment;

  if (start_time) {
    const patrolStartDate = new Date(start_time);
    const now = new Date();
    if (patrolStartDate.getTime() < now.getTime()) {
      const patrolEndDate = !!end_time && new Date(end_time);

      return !patrolEndDate || patrolEndDate.getTime() > now.getTime();
    }
  }
  return false;
};

// A segment only counts as still running when the patrol as a whole hasn't been cancelled or
// marked done, on top of the segment itself being time-wise active.
export const isSegmentActiveForPatrol = (patrol, segment) =>
  !isPatrolCancelled(patrol) && !isPatrolDone(patrol) && isSegmentActive(segment);

export const isSegmentPending = (patrolSegment) => {
  const { time_range: { start_time } = {} } = patrolSegment;

  return !start_time || new Date(start_time).getTime() > Date.now();
};

// Legs run in order, so only the first leg counts: a later one reached by the
// clock would otherwise start a patrol nobody started.
export const hasPatrolBegun = (patrol) => {
  const [firstSegment] = patrol.patrol_segments ?? [];

  return !!firstSegment && !isSegmentPending(firstSegment);
};

// The leg the patrol is on: the one running, the last one to have run, or its
// first while none has begun.
export const governingPatrolSegment = (patrol) => {
  const patrolSegments = patrol.patrol_segments ?? [];

  return patrolSegments.findLast(isSegmentActive)
    ?? patrolSegments.findLast((patrolSegment) => !isSegmentPending(patrolSegment))
    ?? patrolSegments[0]
    ?? null;
};

// A pause is a leg like any other, so a patrol is paused while the leg it is
// running is one. A patrol that was called off or closed runs no leg at all,
// whatever end its legs were left without.
export const isPatrolPaused = (patrol) => isPatrolSegmentAPause(
  (patrol?.patrol_segments ?? []).findLast((patrolSegment) => isSegmentActiveForPatrol(patrol, patrolSegment))
);

export const patrolStateDetailsOverdueStartTime = (patrol) => {
  const startTime = displayStartTimeForPatrol(patrol);
  const currentTime = new Date();
  return formatDistance(startTime, currentTime, {
    includeSeconds: true,
    locale: getCurrentLocale()
  });
};

export const formatPatrolStateTitleDate = (date) => {
  const otherYearFormat = 'd MMM YY HH:mm';
  const defaultFormat = 'd MMM HH:mm';

  if (!date) return '';

  if (isToday(date)) {
    return format(date, SHORT_TIME_FORMAT);
  }

  if (!isThisYear(date)) {
    return format(date, otherYearFormat);
  }

  return format(date, defaultFormat);
};

export const patrolStateDetailsStartTime = (patrol) =>
  formatPatrolStateTitleDate(displayStartTimeForPatrol(patrol));

export const patrolStateDetailsEndTime = (patrol) =>
  formatPatrolStateTitleDate(displayEndTimeForPatrol(patrol));

export const calcPatrolState = (patrol) => {
  if (isPatrolCancelled(patrol)) {
    return CANCELLED;
  }
  if (isPatrolDone(patrol)) {
    return DONE;
  }

  const [firstSegment] = patrol.patrol_segments ?? [];
  if (!firstSegment) {
    return INVALID;
  }

  // A patrol runs from the moment it begins until every leg of it has ended.
  // Legs may overlap, so the last one to start is not always the last to end.
  if (hasPatrolBegun(patrol)) {
    if (patrol.patrol_segments.every(isSegmentFinished)) {
      return DONE;
    }

    return isPatrolPaused(patrol) ? PAUSED : ACTIVE;
  }

  if (isSegmentOverdue(firstSegment)) {
    return START_OVERDUE;
  }

  const patrolStartDate = displayStartTimeForPatrolSegment(firstSegment);
  if (patrolStartDate) {
    const readyToStartThreshold = addHours(new Date(), READY_TO_START_WINDOW_HOURS);

    return patrolStartDate.getTime() < readyToStartThreshold.getTime() ? READY_TO_START : SCHEDULED;
  }

  return INVALID;
};

// Only the first leg can be late or ready: starting the patrol is what starts
// it, and no action starts a later one, so nothing could ever clear the state.
const calcPlannedPatrolSegmentState = (patrolSegment, isFirstSegment) => {
  if (isFirstSegment && isSegmentOverdue(patrolSegment)) {
    return START_OVERDUE;
  }

  const segmentStartDate = displayStartTimeForPatrolSegment(patrolSegment);
  if (!segmentStartDate) {
    return INVALID;
  }

  if (!isFirstSegment) {
    return SCHEDULED;
  }

  return segmentStartDate.getTime() < addHours(new Date(), READY_TO_START_WINDOW_HOURS).getTime()
    ? READY_TO_START
    : SCHEDULED;
};

// A patrol is called off as it stands, so a leg that had already ended by then
// ran its course. Every other one was cut short or never began.
const hasPatrolSegmentRunBeforeCancellation = (patrol, patrolSegment) => {
  if (isSegmentPending(patrolSegment) || !isSegmentFinished(patrolSegment)) {
    return false;
  }

  const cancellationTime = getCancellationTimeForPatrol(patrol);

  return !cancellationTime
    || actualEndTimeForPatrolSegment(patrolSegment).getTime() <= cancellationTime.getTime();
};

// A leg carries no state of its own in the API, so it takes the patrol's, and
// its times only say where in the patrol it falls.
export const calcPatrolSegmentState = (patrol, patrolSegment) => {
  if (isPatrolCancelled(patrol)) {
    return hasPatrolSegmentRunBeforeCancellation(patrol, patrolSegment) ? DONE : CANCELLED;
  }

  const isFirstSegment = (patrol.patrol_segments ?? [])[0] === patrolSegment;
  const isOver = isPatrolSegmentOver(patrol, patrolSegment);

  if (isSegmentPending(patrolSegment)) {
    // A leg that never started and no longer can was called off, not finished,
    // whatever end the patrol stamped on it.
    return isOver ? CANCELLED : calcPlannedPatrolSegmentState(patrolSegment, isFirstSegment);
  }

  if (isOver) {
    return DONE;
  }

  // Legs run in order, so until the patrol has begun none of them has, whatever
  // a leg planned ahead says about its own start.
  if (!hasPatrolBegun(patrol)) {
    return calcPlannedPatrolSegmentState(patrolSegment, isFirstSegment);
  }

  return isPatrolSegmentAPause(patrolSegment) ? PAUSED : ACTIVE;
};

// A leg can no longer run once the patrol is over, once its own end has passed,
// or, having no end of its own, once a later leg has begun.
const isPatrolSegmentOver = (patrol, patrolSegment) => {
  const patrolState = calcPatrolState(patrol);
  if (patrolState === CANCELLED || patrolState === DONE) {
    return true;
  }

  // A leg with an end of its own runs up to it, whatever the legs overlapping
  // it do: the API lets more than one of them run at a time.
  if (patrolSegment.time_range?.end_time) {
    return isSegmentFinished(patrolSegment);
  }

  // Nothing has begun until the patrol has, so a leg only takes over from an
  // earlier one once the patrol is really under way.
  if (!hasPatrolBegun(patrol)) {
    return false;
  }

  const patrolSegments = patrol.patrol_segments ?? [];
  const segmentIndex = patrolSegments.indexOf(patrolSegment);

  return segmentIndex !== -1 && patrolSegments
    .slice(segmentIndex + 1)
    .some((laterPatrolSegment) => !isSegmentPending(laterPatrolSegment));
};

// Closing a patrol stamps an end on every leg, so the end time of a leg that
// never started says nothing — it can even precede its own planned start.
export const hasPatrolSegmentNotRun = (patrol, patrolSegment) =>
  isSegmentPending(patrolSegment) && isPatrolSegmentOver(patrol, patrolSegment);

// The mobile app owns a leg until it stops running it, so a leg it may still
// be working on cannot be edited from here.
export const canEditPatrolSegment = (patrol, patrolSegmentState) => !getIsMobilePatrol(patrol)
  || patrolSegmentState === PATROL_UI_STATES.CANCELLED
  || patrolSegmentState === PATROL_UI_STATES.DONE;

// A patrol under way is running, whether or not the leg it is on is a pause.
export const isPatrolStateUnderWay = (patrolState) => patrolState === PATROL_UI_STATES.ACTIVE
  || patrolState === PATROL_UI_STATES.PAUSED;

export const canEndPatrol = (patrol) => isPatrolStateUnderWay(calcPatrolState(patrol));

// A patrol whose plan does not hold together cannot be extended into shape,
// and one running from the mobile app is not manageable from here.
export const canPatrolTakeNewLegs = (patrol, patrolState) => patrolState !== PATROL_UI_STATES.CANCELLED
  && patrolState !== PATROL_UI_STATES.DONE
  && patrolState !== PATROL_UI_STATES.INVALID
  && !(getIsMobilePatrol(patrol) && isPatrolStateUnderWay(patrolState));

// The API merges a leg into the one it holds and leaves unnamed legs alone, so
// every update below names the legs it changes and says only what changed.
const withPatrolSegmentTimeRange = (patrolSegment, timeRange) => ({
  id: patrolSegment.id,
  time_range: { ...patrolSegment.time_range, ...timeRange },
});

// A leg that never ran keeps the times it was given as the plan they always
// were, and takes the patrol's end as its own.
const withPatrolSegmentClosedUnrun = (patrolSegment, endTime) => ({
  id: patrolSegment.id,
  scheduled_end: patrolSegment.scheduled_end ?? patrolSegment.time_range?.end_time ?? null,
  scheduled_start: patrolSegment.scheduled_start ?? patrolSegment.time_range?.start_time ?? null,
  time_range: { end_time: endTime, start_time: null },
});

// An update that changes no leg names none: an empty list would read as a
// patrol whose legs are all being taken away.
const withPatrolSegmentUpdates = (patrolSegmentUpdates) =>
  patrolSegmentUpdates.length > 0 ? { patrol_segments: patrolSegmentUpdates } : {};

// An update names the legs it changes, so reading a patrol as it would be once
// one is saved means merging those into the legs it already carries.
export const patrolWithUpdateApplied = (patrol, patrolUpdate) => ({
  ...patrol,
  ...patrolUpdate,
  patrol_segments: (patrolUpdate.patrol_segments ?? []).reduce((patrolSegments, patrolSegmentUpdate) => {
    const updatedIndex = patrolSegments.findIndex(({ id }) => id === patrolSegmentUpdate.id);

    return updatedIndex === -1
      ? [...patrolSegments, patrolSegmentUpdate]
      : patrolSegments.map((patrolSegment, index) => index === updatedIndex
        ? { ...patrolSegment, ...patrolSegmentUpdate }
        : patrolSegment);
  }, patrol.patrol_segments ?? []),
});

export const buildPatrolEndUpdate = (patrol) => {
  const endTime = new Date().toISOString();

  return {
    // A leg that already ended carries the end the patrol needs it to.
    ...withPatrolSegmentUpdates(patrol.patrol_segments
      .filter((patrolSegment) => !isSegmentFinished(patrolSegment))
      .map((patrolSegment) => isSegmentPending(patrolSegment)
        ? withPatrolSegmentClosedUnrun(patrolSegment, endTime)
        : withPatrolSegmentTimeRange(patrolSegment, { end_time: endTime }))),
    state: PATROL_API_STATES.DONE,
  };
};

// Only the first leg can be started by hand, so a later one that never ran
// gets its start back and runs by itself when the patrol reaches it.
const withPatrolSegmentReopened = (patrolSegment, isFirstSegment) => {
  const reopenedPatrolSegment = withPatrolSegmentTimeRange(patrolSegment, { end_time: null });

  return isFirstSegment || patrolSegment.time_range?.start_time || !patrolSegment.scheduled_start
    ? reopenedPatrolSegment
    : {
      ...reopenedPatrolSegment,
      scheduled_start: null,
      time_range: { ...reopenedPatrolSegment.time_range, start_time: patrolSegment.scheduled_start },
    };
};

export const buildPatrolReopenUpdate = (patrol) => {
  // Calling a patrol off leaves its legs as they were, so restoring it has
  // nothing to give back.
  if (isPatrolCancelled(patrol)) {
    return { state: PATROL_API_STATES.OPEN };
  }

  // Ending the patrol closed every leg still running or waiting to at one
  // instant, the latest any leg carries, and that instant is what tells them
  // from the legs that had really ended by themselves.
  const closingEndTime = patrol.patrol_segments.reduce((latestEndTime, patrolSegment) => {
    const endTime = patrolSegment.time_range?.end_time ?? null;

    return endTime && (!latestEndTime || new Date(endTime) > new Date(latestEndTime)) ? endTime : latestEndTime;
  }, null);

  return {
    ...withPatrolSegmentUpdates(patrol.patrol_segments
      .map((patrolSegment, index) => closingEndTime && patrolSegment.time_range?.end_time === closingEndTime
        ? withPatrolSegmentReopened(patrolSegment, index === 0)
        : null)
      .filter(Boolean)),
    state: PATROL_API_STATES.OPEN,
  };
};

// A leg starting now drops an end already behind it, which a close stamped on
// it rather than the plan; one still ahead is the plan and stands.
const withPatrolSegmentStartedNow = (patrolSegment) => withPatrolSegmentTimeRange(patrolSegment, {
  ...(isSegmentFinished(patrolSegment) ? { end_time: null } : {}),
  start_time: new Date().toISOString(),
});

// A leg reached only after its successor began cannot have started now, and
// nothing records that it was skipped, so its plan stands as what it ran.
const withPatrolSegmentRunAsPlanned = (patrolSegment) => {
  const scheduledEnd = scheduledEndTimeForPatrolSegment(patrolSegment);
  const hasScheduledEndPassed = !!scheduledEnd && scheduledEnd.getTime() < Date.now();

  return {
    id: patrolSegment.id,
    scheduled_end: hasScheduledEndPassed ? null : patrolSegment.scheduled_end,
    scheduled_start: null,
    time_range: {
      end_time: hasScheduledEndPassed ? patrolSegment.scheduled_end : patrolSegment.time_range?.end_time ?? null,
      start_time: patrolSegment.scheduled_start,
    },
  };
};

// Pausing and resuming both close the running leg and open a copy, so a pause
// is a full leg and a resume restores the one it interrupted for free.
const withPatrolSegmentContinuedAt = (patrolSegment, startTime, { isPause }) => ({
  // The places the interrupted leg was planned around are not this one's, and
  // the icon the server derived from its type is not the client's to send.
  ...omit(patrolSegment, ['end_location', 'events', 'icon_id', 'id', 'image_url', 'start_location', 'updates']),
  is_pause: isPause,
  // The API rejects a leg whose lead is not one of its members, and a lead is
  // on the team they lead — a leg from before rosters existed has none.
  ...(patrolSegment.leader?.id
    ? { members: uniq([patrolSegment.leader.id, ...(patrolSegment.members ?? [])]) }
    : {}),
  scheduled_end: null,
  scheduled_start: null,
  time_range: { end_time: null, start_time: startTime },
});

const buildPatrolContinuationUpdate = (patrol, { isPause }) => {
  const runningSegment = (patrol.patrol_segments ?? []).findLast(isSegmentActive);

  // Nothing is under way to interrupt or to pick back up.
  if (!runningSegment) {
    return null;
  }

  const continuationTime = new Date().toISOString();

  return {
    patrol_segments: [
      withPatrolSegmentTimeRange(runningSegment, { end_time: continuationTime }),
      withPatrolSegmentContinuedAt(runningSegment, continuationTime, { isPause }),
    ],
    state: PATROL_API_STATES.OPEN,
  };
};

export const buildPatrolPauseUpdate = (patrol) => buildPatrolContinuationUpdate(patrol, { isPause: true });

export const buildPatrolResumeUpdate = (patrol) => buildPatrolContinuationUpdate(patrol, { isPause: false });

export const buildPatrolStartUpdate = (patrol) => {
  const [firstSegment] = patrol.patrol_segments;

  // Legs are ordered by their start, so a first leg beginning now would sort
  // behind any leg that has already begun by itself.
  const hasFirstSegmentBeenOvertaken = !!firstSegment?.scheduled_start
    && patrol.patrol_segments.slice(1).some((patrolSegment) => !isSegmentPending(patrolSegment));

  return {
    ...withPatrolSegmentUpdates(firstSegment
      ? [hasFirstSegmentBeenOvertaken
        ? withPatrolSegmentRunAsPlanned(firstSegment)
        : withPatrolSegmentStartedNow(firstSegment)]
      : []),
    state: PATROL_API_STATES.OPEN,
  };
};

export const sortPatrolList = (patrols) => {
  const { READY_TO_START, SCHEDULED, ACTIVE, DONE, PAUSED, START_OVERDUE, CANCELLED } = PATROL_UI_STATES;

  const sortFunc = (patrol) => {
    const patrolState = calcPatrolState(patrol);

    if (patrolState === READY_TO_START) return 1;
    if (patrolState === START_OVERDUE) return 2;
    if (patrolState === ACTIVE) return 3;
    if (patrolState === PAUSED) return 4;
    if (patrolState === SCHEDULED) return 5;
    if (patrolState === DONE) return 6;
    if (patrolState === CANCELLED) return 7;
    return 7;
  };

  // The most recent update across every leg.
  const patrolGetLastUpdateTime = ({ patrol_segments }) => {
    const legUpdateTimes = (patrol_segments || [])
      .map((segment) => segment?.updates?.[0]?.time)
      .filter(Boolean)
      .map((time) => new Date(time).getTime());

    return legUpdateTimes.length ? new Date(Math.max(...legUpdateTimes)) : 0;
  };

  return orderBy(patrols, [sortFunc, patrolGetLastUpdateTime], ['asc', 'desc']);
};

export const makePatrolPointFromFeature = (label, coordinates, icon_id, stroke, time) => {

  const properties = {
    stroke,
    image: calcSpriteSvgUrl(icon_id),
    name: label,
    title: label,
    time: time,
  };

  return point(coordinates, properties);
};


export const extractLegPatrolPoints = (segment, leader, legTrackData, rawLegTrackData, isLegActive) => {
  const { icon_id, start_location, end_location, time_range: { start_time, end_time } = {} } = segment;

  const hasFeatures = !!legTrackData?.points?.features?.length;
  const features = hasFeatures && legTrackData.points.features;

  const stroke = features?.[0]?.properties?.stroke
    || leader?.last_position?.properties?.stroke
    || (!!leader && !!leader.additional && !!leader.additional.rgb && `rgb(${leader.additional.rgb})`)
    || DEFAULT_STROKE;

  let leg_points = {
    start_location: null,
    end_location: null,
  };

  const endTime = new Date(end_time);
  const startTime = new Date(start_time);

  if (start_location) {
    leg_points.start_location = makePatrolPointFromFeature('Patrol Start', [start_location.longitude, start_location.latitude], icon_id, stroke, start_time);

  } else if (hasFeatures) {
    const firstTrackPoint = features[features.length - 1];
    const firstTrackPointMatchesStartTime = new Date(firstTrackPoint.properties.time).getTime() === startTime.getTime();

    const { geometry: { coordinates: [longitude, latitude] } } = firstTrackPoint;

    leg_points.start_location = makePatrolPointFromFeature(`Patrol Start${firstTrackPointMatchesStartTime ? '' : ' (Est)'}`, [longitude, latitude], icon_id, stroke, firstTrackPoint.properties.time);
  }

  if (!isLegActive) {
    if (end_location) {
      leg_points.end_location = makePatrolPointFromFeature('Patrol End', [end_location.longitude, end_location.latitude], icon_id, stroke, end_time);

    } else if (hasFeatures) {
      let lastTrackPoint = features[0];
      let lastTrackPointMatchesEndTime = new Date(lastTrackPoint.properties.time).getTime() === endTime.getTime();

      if (!lastTrackPointMatchesEndTime
        && !!legTrackData.indices
        && !isUndefined(legTrackData.indices.until)
        && legTrackData.indices.until > 0) {
        const nextPointAfterTrimmedData = rawLegTrackData.points.features[legTrackData.indices.until - 1];

        if (nextPointAfterTrimmedData) {

          const nextPointMatchesEndTime = !!nextPointAfterTrimmedData && new Date(nextPointAfterTrimmedData.properties.properties).getTime() === endTime.getTime();
          const timeDiffFromLastPatrolTrackPoint = Math.abs(new Date(lastTrackPoint.properties.time).getTime() - endTime.getTime());
          const timeDiffFromNextPoint = Math.abs(new Date(nextPointAfterTrimmedData.properties.time).getTime() - endTime.getTime());

          if (nextPointMatchesEndTime
          || (timeDiffFromNextPoint < timeDiffFromLastPatrolTrackPoint)) {
            lastTrackPoint = nextPointAfterTrimmedData;
            lastTrackPointMatchesEndTime = new Date(nextPointAfterTrimmedData.properties.time).getTime() === endTime.getTime();
          }
        }
      }

      const { geometry: { coordinates: [longitude, latitude] } } = lastTrackPoint;

      leg_points.end_location = makePatrolPointFromFeature(`Patrol End${lastTrackPointMatchesEndTime ? '' : ' (Est)'}`, [longitude, latitude], icon_id, stroke, lastTrackPoint.properties.time);
    }
  }

  if (!leg_points.end_location && !leg_points.start_location) return null;

  return leg_points;
};

export const finalizeCombinedPatrolPoints = (patrol, patrolPoints) => {
  const isPatrolDone = calcPatrolState(patrol) === PATROL_UI_STATES.DONE;

  if (!!patrolPoints.start_location && !patrolPoints.end_location &&
  isPatrolDone) {
    patrolPoints.end_location = cloneDeep(patrolPoints.start_location);
    patrolPoints.end_location.properties.title = 'Patrol End (Est)';
  }

  if (!!patrolPoints.end_location && !!patrolPoints.start_location
    && booleanEqual(
      point(patrolPoints.end_location.geometry.coordinates),
      point(patrolPoints.start_location.geometry.coordinates),
    )) {
    patrolPoints.start_location.properties.title += ` & ${patrolPoints.end_location.properties.title}`;
    delete patrolPoints.end_location;
  }

  return patrolPoints;
};

export const drawLinesBetweenPatrolTrackAndPatrolPoints = (patrolPoints, trackData) => {
  if (!patrolPoints || !trackData) return null;

  const { end_location, start_location } = patrolPoints;
  const { points: { features } } = trackData;

  if (!end_location && !start_location) return null;
  if (!features || !features.length) return null;

  const earliestTrackPoint = features[features.length - 1];
  const latestTrackPoint = features[0];

  const lineCoords = {
    startLineCoords: null,
    endLineCoords: null,
  };

  if (!!end_location && !booleanEqual(
    point(end_location.geometry.coordinates),
    point(latestTrackPoint.geometry.coordinates)
  )) {
    lineCoords.endLineCoords = [end_location.geometry.coordinates, latestTrackPoint.geometry.coordinates];
  }

  if (!!start_location && !booleanEqual(
    point(start_location.geometry.coordinates),
    point(earliestTrackPoint.geometry.coordinates)
  )) {
    lineCoords.startLineCoords = [start_location.geometry.coordinates, earliestTrackPoint.geometry.coordinates];
  }

  const asArray = Object.values(lineCoords).filter(val => !!val);

  if (!asArray.length) return null;

  return multiLineString(asArray, { stroke: start_location.properties.stroke });

};

export const patrolHasGeoDataToDisplay = (trackData, startStopGeometries) => !!trackData?.track?.features?.[0]?.geometry || !!startStopGeometries;

export const patrolHasTrackData = (patrolTrackData) => !!patrolTrackData?.trackData?.track?.features?.[0]?.geometry;

export const getPatrolLocationCoordinates = (patrolTrackData) =>
  patrolTrackData?.trackData?.points?.features?.[0]?.geometry?.coordinates
    ?? patrolTrackData?.startStopGeometries?.points?.start_location?.geometry?.coordinates
    ?? null;

const locationToCoordinates = (location) => location?.longitude != null && location?.latitude != null
  ? [location.longitude, location.latitude]
  : null;

// A leg's own slice of selectPatrolTrackData's legsTrackData, which carries the
// track alone: the start and stop geometries belong to the patrol as a whole.
export const patrolSegmentHasTrackData = (patrolSegmentTrackData) =>
  !!patrolSegmentTrackData?.track?.features?.[0]?.geometry;

// Tracks are stored most recent position first, so index zero is the leg's
// latest known place.
export const getPatrolSegmentLocationCoordinates = (patrolSegment, patrolSegmentTrackData) =>
  patrolSegmentTrackData?.points?.features?.[0]?.geometry?.coordinates
    ?? locationToCoordinates(patrolSegment?.end_location)
    ?? locationToCoordinates(patrolSegment?.start_location)
    ?? null;

// Everything of a leg there is to fit on screen: its track and the locations it
// was planned around, so a leg nothing has tracked yet still has bounds.
export const getBoundsForPatrolSegment = (patrolSegment, patrolSegmentTrackData) => {
  const trackFeatures = (patrolSegmentTrackData?.track?.features ?? [])
    .filter((feature) => feature.geometry?.coordinates?.length);

  const locationPoints = [patrolSegment?.start_location, patrolSegment?.end_location]
    .map(locationToCoordinates)
    .filter(Boolean)
    .map((coordinates) => point(coordinates));

  const features = [...trackFeatures, ...locationPoints];

  return features.length ? bbox(featureCollection(features)) : null;
};

export const patrolShouldBeMarkedOpen = (patrol) => {
  const isDone = (patrol.state === PATROL_API_STATES.DONE);
  const endTime = actualEndTimeForPatrol(patrol);
  const now = new Date();

  return isDone && endTime && (now.getTime() < endTime.getTime());
};

export const patrolShouldBeMarkedDone = (patrol) => {
  const isOpen = (patrol.state === PATROL_API_STATES.OPEN);
  const endTime = actualEndTimeForPatrol(patrol);
  const now = new Date();

  return isOpen && endTime && (now.getTime() > endTime.getTime());

};

export const getBoundsForPatrol = ((patrol, patrolTrackData) => {
  const { trackData, startStopGeometries } = patrolTrackData;

  const hasSegments = !!patrol.patrol_segments && !!patrol.patrol_segments.length;
  const hasGeoData = patrolHasGeoDataToDisplay(trackData, startStopGeometries);

  if (!hasSegments || !hasGeoData) return null;

  const lastSegment = patrol.patrol_segments[patrol.patrol_segments.length - 1];
  const activeSegmentLeader = isSegmentActiveForPatrol(patrol, lastSegment) ? lastSegment.leader : null;

  const { start_location: patrolStartPoint, end_location: patrolEndPoint } = startStopGeometries?.points || {};
  const patrolEvents = patrol.patrol_segments.flatMap(({ events }) => (events || []).map(({ geojson }) => geojson));
  const patrolLeaderPosition = !!activeSegmentLeader?.last_position && activeSegmentLeader.last_position;
  const patrolTrack = !!trackData && trackData.track;


  const collectionData = concat(patrolEvents, patrolLeaderPosition, patrolTrack.features, patrolStartPoint, patrolEndPoint)
    .filter(item => !!item?.geometry);

  if (!collectionData.length) return null;

  return bbox(
    featureCollection(collectionData),
  );
});

// A patrol has a track from the moment any leg begins, whatever state it went
// on to reach: one called off halfway still covered ground.
export const patrolStateAllowsTrackDisplay = (patrol) =>
  (patrol.patrol_segments ?? []).some((patrolSegment) => !isSegmentPending(patrolSegment));
