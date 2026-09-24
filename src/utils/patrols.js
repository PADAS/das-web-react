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

import { calcTitleAndSubtitle } from './titles';
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

// The types are fetched once a session, so one added since is missing from the
// list. Its own value reads better than an empty cell.
export const displayNameForPatrolSegment = (patrolTypes, patrolSegment) =>
  displayNameForPatrolType(patrolTypes, patrolSegment.patrol_type) ?? patrolSegment.patrol_type ?? null;

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

// Unlike displayTitleForPatrol, an untitled patrol goes by the type of the leg
// that governs it rather than by its leader, the way the patrol views read.
export const calcTitleAndSubtitleForPatrol = (patrol, patrolTypes) => {
  const governingSegment = governingPatrolSegment(patrol);
  const patrolTypeTitle = governingSegment ? displayNameForPatrolSegment(patrolTypes, governingSegment) : null;

  return patrolTypeTitle
    ? calcTitleAndSubtitle(patrol.title, patrolTypeTitle)
    : { subtitle: null, title: displayTitleForPatrol(patrol) };
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

// The latest a preceding leg may reach is where this one begins, down to the
// minute the pickers reach.
export const latestEndBeforePatrolSegment = (patrolSegment) => {
  const latestEnd = displayStartTimeForPatrolSegment(patrolSegment);

  return latestEnd ? startOfMinute(latestEnd) : null;
};

// A pause stamps one instant on the leg it ends and the leg it opens, so a
// bound is never tightened past the times the leg being edited already holds.
export const earliestStartForEditedPatrolSegment = (patrolSegment, previousPatrolSegment) => {
  const earliestStart = previousPatrolSegment ? earliestStartAfterPatrolSegment(previousPatrolSegment) : null;
  const startDateTime = displayStartTimeForPatrolSegment(patrolSegment);

  return earliestStart && startDateTime && earliestStart > startDateTime
    ? startOfMinute(startDateTime)
    : earliestStart;
};

export const latestEndForEditedPatrolSegment = (patrolSegment, nextPatrolSegment) => {
  const latestEnd = nextPatrolSegment ? latestEndBeforePatrolSegment(nextPatrolSegment) : null;
  const endDateTime = displayEndTimeForPatrolSegment(patrolSegment);

  return latestEnd && endDateTime && latestEnd < endDateTime
    ? startOfMinute(endDateTime)
    : latestEnd;
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

// The configured rosters only offer what a site can pick today, so a subject
// deactivated since the leg ran falls back to the subject store.
const resolveRoster = (rosterIds, rosterOptions, subjectStore) => uniq(rosterIds ?? [])
  .map((rosterId) => rosterOptions.find((rosterOption) => rosterOption.id === rosterId) ?? subjectStore[rosterId])
  .filter(Boolean);

export const getTeamAndTrackingForPatrolSegment = (
  patrolSegment,
  teamAndTrackingOptions = EMPTY_TEAM_AND_TRACKING_OPTIONS,
  subjectStore = {}
) => ({
  assets: resolveRoster(patrolSegment?.assets, teamAndTrackingOptions.assets, subjectStore),
  members: resolveRoster(patrolSegment?.members, teamAndTrackingOptions.members, subjectStore),
  team: teamAndTrackingOptions.teams.find((team) => team.id === patrolSegment?.team) ?? null,
});

export const isPatrolSegmentAPause = (patrolSegment) => !!patrolSegment?.is_pause;

const EMPTY_TRACKED_SUBJECTS = [];

// Every subject a leg tracks, once each and its lead first. A pause is the
// patrol standing still: it tracks nobody, so nothing then is the patrol's.
export const getTrackedSubjectsForPatrolSegment = (
  patrolSegment,
  teamAndTrackingOptions = EMPTY_TEAM_AND_TRACKING_OPTIONS,
  subjectStore = {}
) => {
  if (isPatrolSegmentAPause(patrolSegment)) {
    return EMPTY_TRACKED_SUBJECTS;
  }

  return uniqBy(
    [
      ...(patrolSegment?.leader ? [patrolSegment.leader] : []),
      ...resolveRoster(patrolSegment?.members, teamAndTrackingOptions.members, subjectStore),
      ...resolveRoster(patrolSegment?.assets, teamAndTrackingOptions.assets, subjectStore),
    ],
    'id'
  );
};

// A pause interrupts a patrol rather than carrying it on, so it is numbered
// among the pauses and leaves the legs around it reading as consecutive.
export const displayNumberForPatrolSegment = (patrolSegments, patrolSegmentIndex) => {
  const isPause = isPatrolSegmentAPause(patrolSegments[patrolSegmentIndex]);

  return patrolSegments
    .slice(0, patrolSegmentIndex + 1)
    .filter((patrolSegment) => isPatrolSegmentAPause(patrolSegment) === isPause)
    .length;
};

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

// A leg the patrol was cancelled or closed on carries no end of its own, so
// the patrol's own close stands in, as does the next leg's start.
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

export const isPatrolCancelled = (patrol) => patrol.state === PATROL_API_STATES.CANCELLED;

export const isPatrolDone = (patrol) => patrol.state === PATROL_API_STATES.DONE;

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

// A pause is a leg like any other, so a patrol is paused while the leg it
// runs is one. A patrol called off or closed runs no leg at all.
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
  // Ending a patrol is recorded in the state the API keeps, not in its legs, so
  // a close stands even where a leg was left open behind it.
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

// Closing a patrol stamps an end on every leg, so the end time of a leg that
// never started says nothing — it can even precede its own planned start.
export const hasPatrolSegmentNotRun = (patrol, patrolSegment) =>
  isSegmentPending(patrolSegment) && isPatrolSegmentOver(patrol, patrolSegment);

// Provenance is a patrol-level flag and every leg inherits it: nothing says a
// single leg is the app's, so only a leg it can no longer run is editable.
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
    const updatedIndex = patrolSegments.findIndex((patrolSegment) => patrolSegment.id === patrolSegmentUpdate.id);

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

  // Ending the patrol closed every leg still open at one instant, the latest
  // any leg carries, and that instant tells them from legs that really ended.
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


// The patrol markers are drawn rather than sprited: a leg's number has to go
// inside its pin, and Mapbox picks an icon by image, not by a data expression.
const PATROL_MARKER_HEIGHT = 37;
const PATROL_MARKER_WIDTH = 27;
const PATROL_MARKER_COLOR = '#0056C7';
const PATROL_MARKER_PIN_PATH = 'M13.5 1C6.6 1 1 6.6 1 13.5c0 9 12.5 23 12.5 23S26 22.5 26 13.5C26 6.6 20.4 1 13.5 1z';
const PATROL_MARKER_TEXT_FONT = 'Arial, Helvetica, sans-serif';

const buildPatrolMarkerImage = (glyph) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PATROL_MARKER_WIDTH}" `
    + `height="${PATROL_MARKER_HEIGHT}" viewBox="0 0 ${PATROL_MARKER_WIDTH} ${PATROL_MARKER_HEIGHT}">`
    + `<path d="${PATROL_MARKER_PIN_PATH}" fill="${PATROL_MARKER_COLOR}" stroke="#ffffff" stroke-width="1.5"/>`
    + `${glyph}</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const PATROL_START_MARKER_IMAGE = buildPatrolMarkerImage(
  '<path d="M10.75 8.75 19 13.5l-8.25 4.75z" fill="#ffffff"/>'
);
const PATROL_END_MARKER_IMAGE = buildPatrolMarkerImage(
  '<rect x="9.75" y="9.75" width="7.5" height="7.5" rx="1" fill="#ffffff"/>'
);

const patrolLegMarkerImages = new Map();

// A leg's pin carries its own number, so unlike the others it cannot be one
// image built once. The few a patrol needs are kept rather than re-encoded.
const buildPatrolLegMarkerImage = (legNumber) => {
  if (!patrolLegMarkerImages.has(legNumber)) {
    patrolLegMarkerImages.set(legNumber, buildPatrolMarkerImage(
      '<circle cx="13.5" cy="13.5" r="7.5" fill="#ffffff"/>'
      + `<text x="13.5" y="13.5" fill="${PATROL_MARKER_COLOR}" font-family="${PATROL_MARKER_TEXT_FONT}" `
      + `font-size="11" font-weight="bold" text-anchor="middle" dominant-baseline="central">${legNumber}</text>`
    ));
  }

  return patrolLegMarkerImages.get(legNumber);
};

const PATROL_PAUSE_MARKER_IMAGE = buildPatrolMarkerImage(
  '<rect x="9.25" y="9.5" width="3" height="8" rx="0.75" fill="#ffffff"/>'
  + '<rect x="14.75" y="9.5" width="3" height="8" rx="0.75" fill="#ffffff"/>'
);

export const PATROL_MARKER_KINDS = {
  END: 'end',
  LEG: 'leg',
  PAUSE: 'pause',
  START: 'start',
  START_AND_END: 'startAndEnd',
};

export const makePatrolPointFromFeature = (markerKind, coordinates, isEstimated, stroke, time) => point(
  coordinates,
  {
    image: markerKind === PATROL_MARKER_KINDS.START ? PATROL_START_MARKER_IMAGE : PATROL_END_MARKER_IMAGE,
    isEstimated,
    markerKind,
    stroke,
    time,
  }
);

// Where one leg hands over to the next, drawn as a pin badged with the number
// the leg table gives that leg.
export const makePatrolLegMarkerPoint = (legNumber, patrolPoint) => point(patrolPoint.geometry.coordinates, {
  image: buildPatrolLegMarkerImage(legNumber),
  legNumber,
  markerKind: PATROL_MARKER_KINDS.LEG,
  stroke: patrolPoint.properties.stroke,
  time: patrolPoint.properties.time,
});

// A pause's pin stands where the leg before it was last seen, and carries the
// pause symbol: the leg table leaves it unnumbered.
export const makePatrolPauseMarkerPoint = (pauseNumber, patrolPoint) => point(patrolPoint.geometry.coordinates, {
  image: PATROL_PAUSE_MARKER_IMAGE,
  markerKind: PATROL_MARKER_KINDS.PAUSE,
  pauseNumber,
  stroke: patrolPoint.properties.stroke,
  time: patrolPoint.properties.time,
});

// The colour a leg's line is drawn in when its leader has no track to take one
// from: the colour the leader itself was given.
const strokeForPatrolSegmentLeader = (leader) => leader?.last_position?.properties?.stroke
  || (!!leader?.additional?.rgb && `rgb(${leader.additional.rgb})`)
  || DEFAULT_STROKE;

export const extractLegPatrolPoints = (segment, leader, legTrackData, rawLegTrackData, isLegActive) => {
  const { start_location, end_location, time_range: { start_time, end_time } = {} } = segment;

  const hasFeatures = !!legTrackData?.points?.features?.length;
  const features = hasFeatures && legTrackData.points.features;

  const stroke = features?.[0]?.properties?.stroke || strokeForPatrolSegmentLeader(leader);

  let leg_points = {
    start_location: null,
    end_location: null,
  };

  const endTime = new Date(end_time);
  const startTime = new Date(start_time);

  if (start_location) {
    leg_points.start_location = makePatrolPointFromFeature(
      PATROL_MARKER_KINDS.START,
      [start_location.longitude, start_location.latitude],
      false,
      stroke,
      start_time
    );

  } else if (hasFeatures) {
    const firstTrackPoint = features[features.length - 1];
    const firstTrackPointMatchesStartTime = new Date(firstTrackPoint.properties.time).getTime() === startTime.getTime();

    const { geometry: { coordinates: [longitude, latitude] } } = firstTrackPoint;

    leg_points.start_location = makePatrolPointFromFeature(
      PATROL_MARKER_KINDS.START,
      [longitude, latitude],
      !firstTrackPointMatchesStartTime,
      stroke,
      firstTrackPoint.properties.time
    );
  }

  if (!isLegActive) {
    if (end_location) {
      leg_points.end_location = makePatrolPointFromFeature(
        PATROL_MARKER_KINDS.END,
        [end_location.longitude, end_location.latitude],
        false,
        stroke,
        end_time
      );

    } else if (hasFeatures) {
      let lastTrackPoint = features[0];
      let lastTrackPointMatchesEndTime = new Date(lastTrackPoint.properties.time).getTime() === endTime.getTime();

      if (!lastTrackPointMatchesEndTime
        && !!legTrackData.indices
        && !isUndefined(legTrackData.indices.until)
        && legTrackData.indices.until > 0) {
        const nextPointAfterTrimmedData = rawLegTrackData.points.features[legTrackData.indices.until - 1];

        if (nextPointAfterTrimmedData) {
          const timeDiffFromLastPatrolTrackPoint = Math.abs(new Date(lastTrackPoint.properties.time).getTime() - endTime.getTime());
          const timeDiffFromNextPoint = Math.abs(new Date(nextPointAfterTrimmedData.properties.time).getTime() - endTime.getTime());

          if (timeDiffFromNextPoint < timeDiffFromLastPatrolTrackPoint) {
            lastTrackPoint = nextPointAfterTrimmedData;
            lastTrackPointMatchesEndTime = new Date(nextPointAfterTrimmedData.properties.time).getTime() === endTime.getTime();
          }
        }
      }

      const { geometry: { coordinates: [longitude, latitude] } } = lastTrackPoint;

      leg_points.end_location = makePatrolPointFromFeature(
        PATROL_MARKER_KINDS.END,
        [longitude, latitude],
        !lastTrackPointMatchesEndTime,
        stroke,
        lastTrackPoint.properties.time
      );
    }
  }

  if (!leg_points.end_location && !leg_points.start_location) return null;

  return leg_points;
};

// Where a patrol stood still: a pause tracks nothing, so its pin borrows the
// place the leg before it ended, but never that leg's time along with it.
export const extractPausePatrolPoint = (patrolSegment, previousLegEndPoint) => {
  const pauseLocation = patrolSegment.start_location;
  const coordinates = pauseLocation
    ? [pauseLocation.longitude, pauseLocation.latitude]
    : previousLegEndPoint?.geometry.coordinates;

  if (!coordinates) {
    return null;
  }

  return point(coordinates, {
    stroke: previousLegEndPoint?.properties.stroke ?? strokeForPatrolSegmentLeader(patrolSegment.leader),
    time: patrolSegment.time_range?.start_time ?? null,
  });
};

export const finalizeCombinedPatrolPoints = (patrol, patrolPoints, canEstimateEndLocation = true) => {
  const isPatrolDone = calcPatrolState(patrol) === PATROL_UI_STATES.DONE;

  if (!!patrolPoints.start_location && !patrolPoints.end_location && isPatrolDone && canEstimateEndLocation) {
    patrolPoints.end_location = cloneDeep(patrolPoints.start_location);
    patrolPoints.end_location.properties.isEstimated = true;
    patrolPoints.end_location.properties.markerKind = PATROL_MARKER_KINDS.END;
  }

  // One pin cannot be two icons, so a patrol that ended where it started keeps
  // the start pin and says so in its label.
  if (!!patrolPoints.end_location && !!patrolPoints.start_location
    && booleanEqual(
      point(patrolPoints.end_location.geometry.coordinates),
      point(patrolPoints.start_location.geometry.coordinates),
    )) {
    patrolPoints.start_location.properties.isEstimated = patrolPoints.start_location.properties.isEstimated
      || patrolPoints.end_location.properties.isEstimated;
    patrolPoints.start_location.properties.markerKind = PATROL_MARKER_KINDS.START_AND_END;
    delete patrolPoints.end_location;
  }

  return patrolPoints;
};

// From the pins a patrol was planned around to where its track actually begins
// and ends.
const patrolTrackEndConnectors = (patrolPoints, trackData) => {
  const trackPoints = trackData?.points?.features ?? [];

  if (!trackPoints.length) {
    return [];
  }

  const earliestTrackPoint = trackPoints[trackPoints.length - 1];
  const latestTrackPoint = trackPoints[0];

  return [
    ...(patrolPoints.start_location
      ? [[patrolPoints.start_location.geometry.coordinates, earliestTrackPoint.geometry.coordinates]]
      : []),
    ...(patrolPoints.end_location
      ? [[patrolPoints.end_location.geometry.coordinates, latestTrackPoint.geometry.coordinates]]
      : []),
  ];
};

// Across each pause, which the patrol tracked nothing during. A pause next to
// another is a leg between them that left no mark to reach.
const patrolPauseConnectors = (patrolPoints) => (patrolPoints.legMarkers ?? []).flatMap((legMarker, index) => {
  const resumeMarker = patrolPoints.legMarkers[index + 1];

  return legMarker.properties.markerKind === PATROL_MARKER_KINDS.PAUSE
    && !!resumeMarker
    && resumeMarker.properties.markerKind !== PATROL_MARKER_KINDS.PAUSE
    ? [[legMarker.geometry.coordinates, resumeMarker.geometry.coordinates]]
    : [];
});

// One dashed line per colour, skipping the connectors whose two ends stand in
// the same place and would draw nothing.
const connectorLine = (connectors, stroke) => {
  const drawableConnectors = connectors.filter(([fromCoordinates, toCoordinates]) =>
    !booleanEqual(point(fromCoordinates), point(toCoordinates)));

  return drawableConnectors.length ? multiLineString(drawableConnectors, { stroke }) : null;
};

// The dashed lines that hold a patrol's line together where its track does
// not reach: its own colour out to the pins, a pause's across a pause.
export const drawPatrolTrackConnectorLines = (patrolPoints, trackData) => {
  if (!patrolPoints) {
    return null;
  }

  const connectorLines = [
    connectorLine(
      patrolTrackEndConnectors(patrolPoints, trackData),
      (patrolPoints.start_location ?? patrolPoints.end_location)?.properties.stroke
    ),
    connectorLine(patrolPauseConnectors(patrolPoints), colorVariables.patrolPausedThemeColor),
  ].filter(Boolean);

  return connectorLines.length ? featureCollection(connectorLines) : null;
};

// The legacy patrol track is a line or nothing: the start and stop pins ride
// along with that line rather than standing in for it.
export const patrolHasGeoDataToDisplay = (trackData) => !!trackData?.track?.features?.[0]?.geometry;

// Whether any subject the patrol tracks has a track, whether or not the user
// has hidden it: what the track toggle is enabled by.
export const patrolHasTrackData = (patrolTrackData) => !!patrolTrackData?.hasTrackData;

// Its start marker when it has one, and otherwise whatever marker came first.
export const getPatrolLocationCoordinates = (patrolTrackData) =>
  patrolTrackData?.trackData?.points?.features?.[0]?.geometry?.coordinates
    ?? patrolTrackData?.startStopGeometries?.points?.features?.[0]?.geometry?.coordinates
    ?? null;

const locationToCoordinates = (location) => location?.longitude != null && location?.latitude != null
  ? [location.longitude, location.latitude]
  : null;

// The places a leg was planned around. They are not part of the track: a jump
// frames them, a distance and a download leave them out.
const patrolSegmentLocationPoints = (patrolSegment) => [patrolSegment?.start_location, patrolSegment?.end_location]
  .map(locationToCoordinates)
  .filter(Boolean)
  .map((coordinates) => point(coordinates));

// A leg's own slice of selectPatrolSegmentsTrackData, which carries the track
// alone: the start and stop geometries belong to the patrol as a whole.
export const patrolSegmentHasTrackData = (patrolSegmentTrackData) =>
  !!patrolSegmentTrackData?.track?.features?.[0]?.geometry;

// Tracks are stored most recent position first, so index zero is the leg's
// latest known place.
export const getPatrolSegmentLocationCoordinates = (patrolSegment, patrolSegmentTrackData) =>
  patrolSegmentTrackData?.points?.features?.[0]?.geometry?.coordinates
    ?? locationToCoordinates(patrolSegment?.end_location)
    ?? locationToCoordinates(patrolSegment?.start_location)
    ?? null;

// Everything of a leg there is to fit on screen: its track, and the locations
// it was planned around, so a leg that tracked nothing still has bounds.
export const getBoundsForPatrolSegment = (patrolSegment, patrolSegmentTrackData) => {
  const features = [
    ...(patrolSegmentTrackData?.track?.features ?? []).filter((feature) => feature.geometry?.coordinates?.length),
    ...patrolSegmentLocationPoints(patrolSegment),
  ];

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

// Everything of a patrol to fit on screen: its subjects' tracks, markers and
// events, and where its legs were planned. Not where its team stands today.
export const getBoundsForPatrol = (patrol, patrolTrackData) => {
  if (!patrol.patrol_segments?.length) return null;

  const collectionData = concat(
    patrol.patrol_segments.flatMap(({ events }) => (events || []).map(({ geojson }) => geojson)),
    patrol.patrol_segments.flatMap(patrolSegmentLocationPoints),
    patrolTrackData.trackData?.track?.features ?? [],
    patrolTrackData.startStopGeometries?.points?.features ?? [],
  ).filter(item => !!item?.geometry);

  if (!collectionData.length) return null;

  return bbox(featureCollection(collectionData));
};

// A patrol has a track from the moment any leg begins, whatever state it went
// on to reach: one called off halfway still covered ground.
export const patrolStateAllowsTrackDisplay = (patrol) =>
  (patrol.patrol_segments ?? []).some((patrolSegment) => !isSegmentPending(patrolSegment));
