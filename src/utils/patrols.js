import React, { lazy } from 'react';
import {
  addMinutes,
  isToday,
  isThisYear,
  isAfter,
  isWithinInterval as isWithinRange,
  formatDistance as distanceInWords,
} from 'date-fns';

import concat from 'lodash/concat';
import orderBy from 'lodash/orderBy';
import cloneDeep from 'lodash/cloneDeep';
import isUndefined from 'lodash/isUndefined';
import isNil from 'lodash/isNil';
import booleanEqual from '@turf/boolean-equal';
import bbox from '@turf/bbox';

import { DAS_HOST, PATROL_UI_STATES, PERMISSION_KEYS, PERMISSIONS, PATROL_API_STATES, DATE_LOCALES } from '../constants';
import { format, SHORT_TIME_FORMAT } from './datetime';
import { featureCollection, point, multiLineString } from '@turf/helpers';
import TimeAgo from '../TimeAgo';

import store from '../store';
import { addModal } from '../ducks/modals';
import { createPatrol, updatePatrol, addNoteToPatrol, uploadPatrolFile } from '../ducks/patrols';

import { getReporterById } from './events';

import colorVariables from '../common/styles/vars/colors.module.scss';

const PatrolModal = lazy(() => import('../PatrolModal'));

const defaultDatesLang = 'en-US';
const DEFAULT_STROKE = '#FF0080';
export const DELTA_FOR_OVERDUE = 30; //minutes till we say something is overdue

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

export const openModalForPatrol = (patrol, map, config = {}) => {
  const { onSaveSuccess, onSaveError, relationshipButtonDisabled } = config;

  const state = store.getState();

  const permissionSource = state.data.selectedUserProfile?.id ? state.data.selectedUserProfile : state.data.user;
  const patrolPermissions = permissionSource?.permissions?.[PERMISSION_KEYS.PATROLS] || [];

  const canEdit = patrolPermissions.includes(PERMISSIONS.UPDATE);

  return store.dispatch(
    addModal({
      content: PatrolModal,
      patrol,
      map,
      onSaveSuccess,
      onSaveError,
      relationshipButtonDisabled,
      modalProps: {
        className: `patrol-form-modal ${canEdit ? '' : 'readonly'}`,
        // keyboard: false,
      },
    }));
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

  if (patrol.patrol_segments.length && patrol.patrol_segments[0].icon_id)
    return patrol.patrol_segments[0].icon_id;

  return UNKNOWN_TYPE;
};

export const displayTitleForPatrol = (patrol, leader, includeLeaderName = true) => {
  const UNKNOWN_MESSAGE = 'Unknown patrol type';
  if (patrol.title) return patrol.title;

  if (includeLeaderName && leader && leader.name) {
    return leader.name;
  }


  if (!patrol.patrol_segments.length
    || !patrol.patrol_segments[0].patrol_type) return UNKNOWN_MESSAGE;

  const { data: { patrolTypes } } = store.getState();
  const matchingType = (patrolTypes || []).find(t =>
    (t.value === patrol.patrol_segments[0].patrol_type)
    || (t.id === patrol.patrol_segments[0].patrol_type)
  );

  if (matchingType) return matchingType.display;

  return UNKNOWN_MESSAGE;
};

export const displayStartTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { time_range: { start_time } = {}, scheduled_start } = firstLeg;

  return (start_time || scheduled_start)
    ? new Date((start_time || scheduled_start))
    : null;
};

export const actualStartTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { time_range: { start_time } = {} } = firstLeg;

  return start_time
    ? new Date(start_time)
    : null;
};

export const getReportsForPatrol = (patrol) => patrol?.patrol_segments?.[0]?.events ?? [];

export const displayEndTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { scheduled_end, time_range: { end_time } = {} } = firstLeg;

  const value = end_time || scheduled_end;

  return value
    ? new Date(value)
    : null;
};

export const actualEndTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { time_range: { end_time } = {} } = firstLeg;

  const value = end_time;

  return value
    ? new Date(value)
    : null;
};

export const getLeaderForPatrol = (patrol, subjectStore) => {
  if (!patrol?.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;
  const { leader }  = firstLeg;
  if (!leader) return null;

  return subjectStore[leader.id] || leader;
};

export const getPatrolsForSubject = (patrols, subject) => {
  return patrols.filter(patrol => {
    return getLeaderForPatrol(patrol)?.id === subject.id;
  });
};

export const getReportIdsForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return [];
  // this is only grabbibng the first segment for now
  const [firstLeg] = patrol.patrol_segments;
  const { events } = firstLeg;
  const eventIds =
    events?.reduce((accumulator, { id }) =>
      id
        ? [...accumulator, id]
        : accumulator, []
    );
  return eventIds || [];
};

export const getPatrolsForLeaderId = (leaderId) => {
  const { data: { patrolStore } } = store.getState();

  return Object.values(patrolStore).filter(patrol =>
    !!patrol.patrol_segments.length
    &&  !!patrol.patrol_segments[0].leader
    && patrol.patrol_segments[0].leader.id === leaderId
  );
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

export const displayDurationForPatrol = (patrol, lang = defaultDatesLang) => {
  const patrolState = calcPatrolState(patrol);

  if (patrolState === PATROL_UI_STATES.READY_TO_START
    || patrolState === PATROL_UI_STATES.SCHEDULED
    || patrolState === PATROL_UI_STATES.START_OVERDUE) {
    return '0:00';
  }

  const now = new Date();
  const nowTime = now.getTime();
  const locale = DATE_LOCALES[lang];

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

  return distanceInWords(displayStartTime, displayEndTime, { locale });
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
        return store.dispatch(uploadPatrolFile(patrol_id, file));
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

export const isSegmentEndScheduled = (patrolSegment) => {
  const { time_range: { end_time } = {}, scheduled_end } = patrolSegment;
  const time = end_time || scheduled_end;

  return !!time && new Date(time).getTime() > new Date().getTime();
};


export const isPatrolCancelled = (patrol) => patrol.state === 'cancelled';

export const isPatrolDone = (patrol) => patrol.state === 'done';

export const isSegmentFinished = (patrolSegment) => {
  const { time_range: { end_time } = {} } = patrolSegment;

  if (!!end_time) {
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

  if (!!start_time) {
    const patrolStartDate = new Date(start_time);
    const now = new Date();
    if (patrolStartDate.getTime() < now.getTime()) {
      const patrolEndDate = !!end_time && new Date(end_time);

      return !patrolEndDate || patrolEndDate.getTime() > now.getTime();
    }
  }
  return false;
};

export const isSegmentPending = (patrolSegment) => {
  const { time_range: { start_time } = {} } = patrolSegment;

  let isPatrolStartDateInTheFuture = false;
  if (!!start_time) {
    const patrolStartDate = new Date(start_time);
    const now = new Date();

    isPatrolStartDateInTheFuture = patrolStartDate > now.getTime();
  }

  return !start_time || isPatrolStartDateInTheFuture;
};

export const isSegmentOverdueToEnd = (patrolSegment) => {
  const { time_range: { end_time } = {}, scheduled_end } = patrolSegment;

  if (!end_time && !!scheduled_end) {
    const patrolEndDate = new Date(scheduled_end);
    const patrolEndOverdueDate = addMinutes(patrolEndDate.getTime(), DELTA_FOR_OVERDUE);
    const now = new Date();

    return patrolEndOverdueDate < now.getTime();
  }
  return false;
};

export const patrolStateDetailsOverdueStartTime = (patrol, lang = defaultDatesLang) => {
  const startTime = displayStartTimeForPatrol(patrol);
  const currentTime = new Date();
  const locale = DATE_LOCALES[lang];
  return distanceInWords(startTime, currentTime, { includeSeconds: true, locale });
};

export const formatPatrolStateTitleDate = (date, lang = defaultDatesLang) => {
  const otherYearFormat = 'd MMM YY HH:mm';
  const defaultFormat = 'd MMM HH:mm';
  const locale = DATE_LOCALES[lang];

  if (!date) return '';

  if (isToday(date)) {
    return format(date, SHORT_TIME_FORMAT, { locale });
  }

  if (!isThisYear(date)) {
    return format(date, otherYearFormat, { locale });
  }

  return format(date, defaultFormat, { locale });
};

export const displayPatrolEndOverdueTime = (patrol) => {
  const endTime = displayEndTimeForPatrol(patrol);
  const currentTime = new Date();
  return distanceInWords(currentTime, endTime, { includeSeconds: true });
};

export const patrolStateDetailsStartTime = (patrol, lang) =>
  formatPatrolStateTitleDate(
    displayStartTimeForPatrol(patrol),
    lang
  );

export const patrolStateDetailsEndTime = (patrol, lang) =>
  formatPatrolStateTitleDate(
    displayEndTimeForPatrol(patrol),
    lang
  );

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

  const [segment] = patrol.patrol_segments;

  if (isSegmentFinished(segment)) {
    return DONE;
  }
  if (isSegmentOverdue(segment)) {
    return START_OVERDUE;
  }
  if (isSegmentActive(segment)) {
    return ACTIVE;
  }
  if (isSegmentPending(segment)) {
    const now = new Date();
    const nextHour = now.setHours(now.getHours() + 1);
    const patrolStartDate = displayStartTimeForPatrol(patrol);
    const happensTheNextHour = isWithinRange(patrolStartDate, now, nextHour);
    const isPatrolInOverdueDelta = patrolStartDate.getTime() < now.getTime();

    return happensTheNextHour || isPatrolInOverdueDelta ? READY_TO_START : SCHEDULED;
  }
  return INVALID;
};

export const canStartPatrol = (patrol) => {
  const patrolState = calcPatrolState(patrol);
  return (patrolState === PATROL_UI_STATES.READY_TO_START
      || patrolState === PATROL_UI_STATES.SCHEDULED
      || patrolState === PATROL_UI_STATES.START_OVERDUE);
};

export const canEndPatrol = (patrol) => {
  const patrolState = calcPatrolState(patrol);
  return patrolState === PATROL_UI_STATES.ACTIVE;
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

  const patrolGetLastUpdateTime = ({ patrol_segments }) => {
    return patrol_segments?.[0]?.updates?.[0]?.time ? new Date(patrol_segments[0].updates[0].time) : 0;
  };

  return orderBy(patrols, [sortFunc, patrolGetLastUpdateTime], ['asc', 'desc']);
};

export const makePatrolPointFromFeature = (label, coordinates, icon_id, stroke, time) => {

  const properties = {
    stroke,
    image: `${DAS_HOST}/static/sprite-src/${icon_id}.svg`,
    name: label,
    title: label,
    time: time,
  };

  return point(coordinates, properties);
};


export const extractPatrolPointsFromTrackData = ({ leader, patrol, trackData }, rawTrack) => {
  const { patrol_segments: [firstLeg] } = patrol;
  const { icon_id, start_location, end_location, time_range: { start_time, end_time } = {} } = firstLeg;

  const hasFeatures = !!trackData?.points?.features?.length;
  const features = hasFeatures && trackData.points.features;
  const isPatrolActive = calcPatrolState(patrol) === PATROL_UI_STATES.ACTIVE;
  const isPatrolDone = calcPatrolState(patrol) === PATROL_UI_STATES.DONE;

  const stroke = features?.[0]?.properties?.stroke
    || leader?.last_position?.properties?.stroke
    || (!!leader && !!leader.additional && !!leader.additional.rgb && `rgb(${leader.additional.rgb})`)
    || DEFAULT_STROKE;

  let patrol_points = {
    start_location: null,
    end_location: null,
  };

  const endTime = new Date(end_time);
  const startTime = new Date(start_time);

  if (start_location) {
    patrol_points.start_location = makePatrolPointFromFeature('Patrol Start', [start_location.longitude, start_location.latitude], icon_id, stroke, start_time);

  } else if (hasFeatures) {
    const firstTrackPoint = features[features.length - 1];
    const firstTrackPointMatchesStartTime = new Date(firstTrackPoint.properties.time).getTime() === startTime.getTime();

    const { geometry: { coordinates: [longitude, latitude] } } = firstTrackPoint;

    patrol_points.start_location = makePatrolPointFromFeature(`Patrol Start${firstTrackPointMatchesStartTime ? '' : ' (Est)'}`, [longitude, latitude], icon_id, stroke, firstTrackPoint.properties.time);
  }

  if (!isPatrolActive) {
    if (end_location) {
      patrol_points.end_location = makePatrolPointFromFeature('Patrol End', [end_location.longitude, end_location.latitude], icon_id, stroke, end_time);

    } else if (hasFeatures) {
      let lastTrackPoint = features[0];
      let lastTrackPointMatchesEndTime = new Date(lastTrackPoint.properties.time).getTime() === endTime.getTime();

      if (!lastTrackPointMatchesEndTime
        && !!trackData.indices
        && !isUndefined(trackData.indices.until)
        && trackData.indices.until > 0) {
        const nextPointAfterTrimmedData = rawTrack.points.features[trackData.indices.until - 1];

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

      patrol_points.end_location = makePatrolPointFromFeature(`Patrol End${lastTrackPointMatchesEndTime ? '' : ' (Est)'}`, [longitude, latitude], icon_id, stroke, lastTrackPoint.properties.time);
    }
  }

  if (!!patrol_points.start_location && !patrol_points.end_location &&
  isPatrolDone) {
    patrol_points.end_location = cloneDeep(patrol_points.start_location);
    patrol_points.end_location.properties.title = 'Patrol End (Est)';
  }

  if (!!patrol_points.end_location && !!patrol_points.start_location
    && booleanEqual(
      point(patrol_points.end_location.geometry.coordinates),
      point(patrol_points.start_location.geometry.coordinates),
    )) {
    patrol_points.start_location.properties.title += ` & ${patrol_points.end_location.properties.title}`;
    delete patrol_points.end_location;
  };

  if (!patrol_points.end_location && !patrol_points.start_location) return null;

  return patrol_points;
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

export const patrolTimeRangeIsValid = (patrol) => {
  const startTime = displayStartTimeForPatrol(patrol);
  const endTime = displayEndTimeForPatrol(patrol);

  if (startTime && !endTime) {
    return true;
  } else if (startTime && endTime && isAfter(endTime, startTime)) {
    return true;
  }

  return false;

};


export const patrolHasGeoDataToDisplay = (trackData, startStopGeometries) => !!trackData?.track?.features?.[0]?.geometry || !!startStopGeometries;

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

export const getBoundsForPatrol = ((patrolData) => {
  const { leader, trackData, patrol, startStopGeometries } = patrolData;

  const hasSegments = !!patrol.patrol_segments && !!patrol.patrol_segments.length;
  const hasGeoData = patrolHasGeoDataToDisplay(trackData, startStopGeometries);

  if (!hasSegments || !hasGeoData) return null;

  const [firstLeg] = patrol.patrol_segments;

  const hasEvents = !!firstLeg.events && !!firstLeg.events.length;
  const hasLeaderPosition = !!leader && !!leader.last_position;

  const { start_location: patrolStartPoint, end_location: patrolEndPoint } = startStopGeometries?.points || {};
  const patrolEvents = hasEvents && firstLeg.events.map(({ geojson }) => geojson);
  const patrolLeaderPosition = hasLeaderPosition && leader.last_position;
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