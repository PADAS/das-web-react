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

import { calcSpriteSvgUrl } from './img';
import { format, getCurrentLocale, SHORT_TIME_FORMAT } from './datetime';
import { PATROL_UI_STATES, PATROL_API_STATES } from '../constants';

import TimeAgo from '../TimeAgo';

import store from '../store';
import { createPatrol, updatePatrol, addNoteToPatrol, uploadPatrolFile } from '../ducks/patrols';

import { getReporterById } from './events';

import * as colorVariables from '../common/styles/vars/colors.module.scss';

const DEFAULT_STROKE = '#FF0080';
export const DELTA_FOR_OVERDUE = 30; //minutes till we say something is overdue
export const READY_TO_START_WINDOW_HOURS = 1; // hours before its start a patrol counts as ready to start

const PATROL_STATUS_THEME_COLOR_MAP = {
  [PATROL_UI_STATES.SCHEDULED.status]: {
    base: colorVariables.patrolReadyThemeColor,
    background: colorVariables.patrolReadyThemeBgColor,
  },
  [PATROL_UI_STATES.READY_TO_START.status]: {
    base: colorVariables.patrolReadyThemeColor,
    background: colorVariables.patrolReadyThemeBgColor,
  },
  [PATROL_UI_STATES.ACTIVE.status]: {
    base: colorVariables.patrolActiveThemeColor,
    background: colorVariables.patrolActiveThemeBgColor,
  },
  [PATROL_UI_STATES.PAUSED.status]: {
    base: colorVariables.patrolPausedThemeColor,
    background: colorVariables.patrolPausedThemeBgColor,
  },
  [PATROL_UI_STATES.DONE.status]: {
    base: colorVariables.patrolDoneThemeColor,
    background: colorVariables.patrolDoneThemeBgColor,
  },
  [PATROL_UI_STATES.START_OVERDUE.status]: {
    base: colorVariables.patrolOverdueThemeColor,
    background: colorVariables.patrolOverdueThemeBgColor,
  },
  [PATROL_UI_STATES.CANCELLED.status]: {
    base: colorVariables.patrolCancelledThemeColor,
    background: colorVariables.patrolCancelledThemeBgColor,
    fontColor: colorVariables.patrolCancelledThemeFontColor,
  },
  [PATROL_UI_STATES.INVALID.status]: {
    base: colorVariables.patrolCancelledThemeColor,
    background: colorVariables.patrolCancelledThemeBgColor,
    fontColor: colorVariables.patrolCancelledThemeFontColor,
  },
};

export const calcColorThemeForPatrolState = (patrolState) => {

  return PATROL_STATUS_THEME_COLOR_MAP[patrolState.status];
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

export const getReportsForPatrol = (patrol) => {
  const patrolReportsById = new Map((patrol?.patrol_segments ?? [])
    .flatMap((segment) => segment.events ?? [])
    .map((event) => [event.id, event]));

  return [...patrolReportsById.values()];
};

export const displayEndTimeForPatrolSegment = (patrolSegment) => {
  const { scheduled_end, time_range: { end_time } = {} } = patrolSegment;

  const value = end_time || scheduled_end;

  return value
    ? new Date(value)
    : null;
};

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

// TODO: Include the leg's team members and tracked assets once they're part of the data model.
export const getTrackedSubjectsForPatrolSegment = (patrolSegment) => patrolSegment.leader ? [patrolSegment.leader] : [];

// TODO: Recognize pause legs by their own flag once the data model supports it.
const isPatrolSegmentAPause = () => false;

const getElapsedTimeForPatrolSegment = (patrolSegment, fallbackEndTime) => {
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
      ? totalPausedTime + getElapsedTimeForPatrolSegment(patrolSegment, endTime)
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

const { READY_TO_START, ACTIVE, DONE, START_OVERDUE, CANCELLED, INVALID, SCHEDULED } = PATROL_UI_STATES;

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
    const patrolStartDate = new Date(scheduled_start);
    const patrolStartOverdueDate = addMinutes(patrolStartDate.getTime(), DELTA_FOR_OVERDUE);
    const now = new Date();

    return patrolStartOverdueDate < now.getTime();
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

  let isPatrolStartDateInTheFuture = false;
  if (start_time) {
    const patrolStartDate = new Date(start_time);
    const now = new Date();

    isPatrolStartDateInTheFuture = patrolStartDate > now.getTime();
  }

  return !start_time || isPatrolStartDateInTheFuture;
};

// A patrol has begun once one of its legs really started.
export const hasPatrolBegun = (patrol) => (patrol.patrol_segments ?? [])
  .some((patrolSegment) => !isSegmentPending(patrolSegment));

// The leg the patrol is on: the one running, the last one to have run, or its
// first while none has begun.
export const governingPatrolSegment = (patrol) => {
  const patrolSegments = patrol.patrol_segments ?? [];

  return patrolSegments.findLast(isSegmentActive)
    ?? patrolSegments.findLast((patrolSegment) => !isSegmentPending(patrolSegment))
    ?? patrolSegments[0]
    ?? null;
};

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
  if (!patrol.patrol_segments.length) {
    return INVALID;
  }

  const [firstSegment] = patrol.patrol_segments;

  if (isSegmentFinished(patrol.patrol_segments.at(-1))) {
    return DONE;
  }
  if (hasPatrolBegun(patrol)) {
    return ACTIVE;
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

export const canEndPatrol = (patrol) => {
  const patrolState = calcPatrolState(patrol);
  return patrolState === PATROL_UI_STATES.ACTIVE;
};

// A patrol that is over has nothing left to run, and one running from the
// mobile app cannot be given new legs from here.
export const canPatrolTakeNewLegs = (patrol, patrolState) => patrolState !== PATROL_UI_STATES.CANCELLED
  && patrolState !== PATROL_UI_STATES.DONE
  && !(getIsMobilePatrol(patrol) && patrolState === PATROL_UI_STATES.ACTIVE);

const withPatrolSegmentTimeRange = (patrolSegment, timeRange) => ({
  ...patrolSegment,
  time_range: { ...patrolSegment.time_range, ...timeRange },
});

// A leg that never ran keeps the times it was given as the plan they always
// were, and takes the patrol's end as its own.
const withPatrolSegmentClosedUnrun = (patrolSegment, endTime) => ({
  ...patrolSegment,
  scheduled_end: patrolSegment.scheduled_end ?? patrolSegment.time_range?.end_time ?? null,
  scheduled_start: patrolSegment.scheduled_start ?? patrolSegment.time_range?.start_time ?? null,
  time_range: { end_time: endTime, start_time: null },
});

export const buildPatrolEndUpdate = (patrol) => {
  const endTime = new Date().toISOString();

  return {
    patrol_segments: patrol.patrol_segments.map((patrolSegment) => {
      if (isSegmentFinished(patrolSegment)) {
        return patrolSegment;
      }

      return isSegmentPending(patrolSegment)
        ? withPatrolSegmentClosedUnrun(patrolSegment, endTime)
        : withPatrolSegmentTimeRange(patrolSegment, { end_time: endTime });
    }),
    state: PATROL_API_STATES.DONE,
  };
};

export const buildPatrolReopenUpdate = (patrol) => {
  // Ending the patrol closed every leg still running or waiting to at one
  // instant, and that instant is what tells them from the legs that had
  // really ended by themselves.
  const closingEndTime = patrol.patrol_segments.at(-1)?.time_range?.end_time ?? null;

  return {
    patrol_segments: patrol.patrol_segments.map((patrolSegment) =>
      closingEndTime && patrolSegment.time_range?.end_time === closingEndTime
        ? withPatrolSegmentTimeRange(patrolSegment, { end_time: null })
        : patrolSegment),
    state: PATROL_API_STATES.OPEN,
  };
};

export const buildPatrolStartUpdate = (patrol) => {
  const [firstSegment] = patrol.patrol_segments;
  const startTime = new Date().toISOString();

  return {
    patrol_segments: patrol.patrol_segments.map((patrolSegment) => patrolSegment === firstSegment
      ? withPatrolSegmentTimeRange(patrolSegment, { end_time: null, start_time: startTime })
      : patrolSegment),
    state: PATROL_API_STATES.OPEN,
  };
};

export const sortPatrolList = (patrols) => {
  const { READY_TO_START, SCHEDULED, ACTIVE, DONE, START_OVERDUE, CANCELLED } = PATROL_UI_STATES;

  const sortFunc = (patrol) => {
    const patrolState = calcPatrolState(patrol);

    if (patrolState === READY_TO_START) return 1;
    if (patrolState === START_OVERDUE) return 2;
    if (patrolState === ACTIVE) return 3;
    if (patrolState === SCHEDULED) return 4;
    if (patrolState === DONE) return 5;
    if (patrolState === CANCELLED) return 6;
    return 6;
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

export const patrolStateAllowsTrackDisplay = (patrol) => {
  const vizualizablePatrolStates = [PATROL_UI_STATES.ACTIVE, PATROL_UI_STATES.DONE];
  const patrolState = calcPatrolState(patrol);

  return vizualizablePatrolStates.includes(patrolState);
};
