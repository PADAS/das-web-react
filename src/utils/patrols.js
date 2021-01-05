import React from 'react';
import addMinutes from 'date-fns/add_minutes';
import isToday from 'date-fns/is_today';
import isThisYear from 'date-fns/is_this_year';
import format from 'date-fns/format';
import { PATROL_CARD_STATES } from '../constants';
import { SHORT_TIME_FORMAT, normalizeDate } from '../utils/datetime';
import merge from 'lodash/merge';
import orderBy from 'lodash/orderBy';
import booleanEqual from '@turf/boolean-equal';
import bbox from '@turf/bbox';
import { featureCollection, point, multiLineString } from '@turf/helpers';
import { default as TimeAgo } from 'react-timeago';

import { store } from '../';
import { addModal } from '../ducks/modals';
import { createPatrol, updatePatrol, addNoteToPatrol, uploadPatrolFile } from '../ducks/patrols';

import { getReporterById } from './events';

import PatrolModal from '../PatrolModal';
import distanceInWords from 'date-fns/distance_in_words';
import isAfter from 'date-fns/is_after';
import { objectToParamString } from './query';

const DEFAULT_STROKE = '#FF0080';
const DELTA_FOR_OVERDUE = 30; //minutes till we say something is overdue

export const openModalForPatrol = (patrol, map, config = {}) => {
  const { onSaveSuccess, onSaveError, relationshipButtonDisabled } = config;

  return store.dispatch(
    addModal({
      content: PatrolModal,
      patrol,
      map,
      onSaveSuccess,
      onSaveError,
      relationshipButtonDisabled,
      modalProps: {
        className: 'patrol-form-modal',
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

  return {
    ...categoryObject,
    types: patrolTypes.map(type => ({
      ...type,
      category: { ...categoryObject },
    })),
  };
};

export const createNewPatrolForPatrolType = ({ value: patrol_type, icon_id, default_priority: priority = 0 }, data) => {
  const location = data && data.location;
  const reportedById = data && data.reportedById;
  const time = data && data.time;

  const trackingSubject = reportedById && getReporterById(reportedById);

  const leader = trackingSubject ? trackingSubject : null;

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
        reports: [],
        scheduled_start: null,
        leader,
        start_location: location ? { ...location } : null,
        time_range: {
          start_time: time ? new Date(time) : new Date(),
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

  const { time_range: { start_time }, scheduled_start } = firstLeg;

  return (start_time || scheduled_start) 
    ? new Date((start_time || scheduled_start))
    : null;
};

export const getReportsForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  // this is only grabbibng the first segment for now
  const [firstLeg] = patrol.patrol_segments;
  const { events } = firstLeg;
  return events || [];
};

export const displayEndTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { scheduled_end, time_range: { end_time } } = firstLeg;

  const value = end_time || scheduled_end;

  return value
    ? new Date(value)
    : null;
};

export const getLeaderForPatrol = (patrol, subjectStore) => {
  if (!patrol.patrol_segments.length) return null;
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
      return calcPatrolCardState(item) === PATROL_CARD_STATES.ACTIVE;
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
  const patrolState = calcPatrolCardState(patrol);

  if (patrolState === PATROL_CARD_STATES.READY_TO_START
    || patrolState === PATROL_CARD_STATES.SCHEDULED
    || patrolState === PATROL_CARD_STATES.START_OVERDUE) {
    return '0:00';
  }
  
  const now = new Date();
  const nowTime = now.getTime();

  const displayStartTime = displayStartTimeForPatrol(patrol);
  const displayEndTime = displayEndTimeForPatrol(patrol);

  const hasStarted = !!displayStartTime
    && (displayStartTime.getTime() < nowTime);

  if (!hasStarted) return '0s';

  const hasEnded = !!displayEndTime
    && (displayEndTime.getTime() <= nowTime);

  if (!hasEnded) {
    const formatter = (val, unit, _suffix) => `${val} ${unit}${val > 1 ? 's' : ''}`;
    return <TimeAgo date={displayStartTime} formatter={formatter} />;
  }

  return distanceInWords(displayStartTime, displayEndTime);
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

const { READY_TO_START, ACTIVE, DONE, START_OVERDUE, CANCELLED, INVALID, SCHEDULED } = PATROL_CARD_STATES;

export const displayPatrolSegmentId = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;
  const { id } = firstLeg;
  return id || null;
};
export const isSegmentOverdue = (patrolSegment) => {
  const { time_range: { start_time }, scheduled_start } = patrolSegment;
  return !start_time
    && !!scheduled_start
    && addMinutes(new Date(scheduled_start).getTime(), DELTA_FOR_OVERDUE) < new Date().getTime(); 
};

export const isSegmentOverdueToEnd = (patrolSegment) => {
  const { time_range: { end_time }, scheduled_end } = patrolSegment;
  return !end_time
    && !!scheduled_end
    && addMinutes(new Date(scheduled_end).getTime(), DELTA_FOR_OVERDUE) < new Date().getTime(); 
};
export const isSegmentPending = (patrolSegment) => {
  const { time_range: { start_time } } = patrolSegment;

  return !start_time
  || (!!start_time && addMinutes(new Date(start_time), DELTA_FOR_OVERDUE).getTime() > new Date().getTime());
};

export const isSegmentActive = (patrolSegment) => {
  const { time_range: { start_time, end_time } } = patrolSegment;
  const nowTime = new Date().getTime();

  return !!start_time
    && new Date(start_time).getTime() < nowTime
    && (
      !end_time
      || (!!end_time && new Date(end_time).getTime() > nowTime)
    );   
};

export const isSegmentFinished = (patrolSegment) => {
  const { time_range: { end_time } } = patrolSegment;
  return !!end_time && new Date(end_time).getTime() < new Date().getTime();
};

export const isSegmentEndScheduled = (patrolSegment) => {
  const { time_range: { end_time }, scheduled_end } = patrolSegment;
  return !end_time && !!scheduled_end;
};


export const  isPatrolCancelled = (patrol) => {
  return (patrol.state === 'cancelled');
};

export const isPatrolDone = (patrol) => {
  return (patrol.state === 'done'); 
};

export const patrolStateDetailsOverdueStartTime = (patrol) => {
  const startTime = displayStartTimeForPatrol(patrol);
  const currentTime = new Date();
  return distanceInWords(startTime, currentTime, { includeSeconds: true });
};

const formatPatrolCardStateTitleDate = (date) => {
  const otherYearFormat = 'D MMM \'YY HH:mm';
  const defaultFormat = 'D MMM HH:mm';

  if (!date) return '';

  if (isToday(date)) {
    return format(date, SHORT_TIME_FORMAT);
  }

  if (!isThisYear(date)) {
    return format(date, otherYearFormat);
  }

  return format(date, defaultFormat);
};
export const displayPatrolEndOverdueTime = (patrol) => {
  const endTime = displayEndTimeForPatrol(patrol);
  const currentTime = new Date();
  return distanceInWords(currentTime, endTime, { includeSeconds: true });
};

export const patrolStateDetailsStartTime = patrol =>
  formatPatrolCardStateTitleDate(
    displayStartTimeForPatrol(patrol)
  );

export const patrolStateDetailsEndTime = patrol =>
  formatPatrolCardStateTitleDate(
    displayEndTimeForPatrol(patrol)
  );

export const calcPatrolCardState = (patrol) => {
  if (isPatrolCancelled(patrol)) {
    return CANCELLED; 
  }
  if (isPatrolDone(patrol)) {
    return DONE; 
  }
  const { patrol_segments } = patrol;
  if (!patrol_segments.length) return INVALID;

  const [segment]  = patrol_segments;
  if(isSegmentFinished(segment)) {
    return DONE;
  }
  if(isSegmentOverdue(segment)) {
    return START_OVERDUE;
  }
  if(isSegmentActive(segment)) {
    return ACTIVE;
  }
  if(isSegmentPending(segment)) {
    const happensToday = isToday(displayStartTimeForPatrol(patrol));
    return happensToday ? READY_TO_START : SCHEDULED;
  }
  return INVALID;
};

export const canStartPatrol = (patrol) => {
  const patrolState = calcPatrolCardState(patrol);
  return (patrolState === PATROL_CARD_STATES.READY_TO_START
      || PATROL_CARD_STATES.SCHEDULED
      || patrolState === PATROL_CARD_STATES.START_OVERDUE);
};

export const canEndPatrol = (patrol) => {
  const patrolState = calcPatrolCardState(patrol);
  return patrolState === PATROL_CARD_STATES.ACTIVE;
};
// look to calcEventFilterForRequest as this grows
export const calcPatrolFilterForRequest = (options = {}) => {
  const { data: { patrolFilter } } = store.getState();
  const { params } = options;
  const  filterParams = merge({}, patrolFilter, params);
  return objectToParamString(filterParams);  
};

export const sortPatrolCards = (patrols) => {
  const { READY_TO_START, SCHEDULED, ACTIVE, DONE, START_OVERDUE, CANCELLED } = PATROL_CARD_STATES;
  
  const sortFunc = (patrol) => {
    const cardState = calcPatrolCardState(patrol);

    if (cardState === START_OVERDUE) return 1;
    if (cardState === READY_TO_START || cardState === SCHEDULED) return 2;
    if (cardState === ACTIVE) return 3;
    if (cardState === DONE) return 4;
    if (cardState === CANCELLED) return 5;
    return 6;
  };

  const patrolDisplayTitleFunc = (patrol) => displayTitleForPatrol(patrol, patrol.leader).toLowerCase();

  return orderBy(patrols, [sortFunc, patrolDisplayTitleFunc], ['asc', 'asc']);
};

export const makePatrolPointFromFeature = (label, coordinates, icon_id, stroke, time) => {

  const properties = {
    stroke,
    image: `${process.env.REACT_APP_DAS_HOST}/static/sprite-src/${icon_id}.svg`,
    name: label,
    title: label,
    time: time,
  };

  return point(coordinates, properties);
};


export const extractPatrolPointsFromTrackData = ({ leader, patrol, trackData }) => {
  const { patrol_segments: [firstLeg] } = patrol;
  const { icon_id, start_location, end_location, time_range: { start_time, end_time } } = firstLeg;

  const hasFeatures = !!trackData && !!trackData.points && !!trackData.points.features.length;

  const features = hasFeatures && trackData.points.features;

  const isPatrolActive = calcPatrolCardState(patrol).title === PATROL_CARD_STATES.ACTIVE.title;
  const stroke = hasFeatures
    ? features[0].properties.stroke
    : (!!leader && !!leader.additional && !!leader.additional.rgb && `rgb(${leader.additional.rgb})`);
  
  const pointColor = stroke || DEFAULT_STROKE;

  

  let patrol_points = {
    start_location: null,
    end_location: null,
  };

  const endTime = normalizeDate(end_time);
  const startTime = normalizeDate(start_time);

  if (start_location) {
    patrol_points.start_location = makePatrolPointFromFeature('Patrol Start', [start_location.longitude, start_location.latitude], icon_id, pointColor, start_time);

  } else if (hasFeatures) {
    const firstTrackPoint = features[features.length - 1];
    const firstTrackPointMatchesStartTime = normalizeDate(firstTrackPoint.properties.time) === startTime;

    const { geometry: { coordinates: [longitude, latitude] } } = firstTrackPoint;

    patrol_points.start_location = makePatrolPointFromFeature(`Patrol Start${firstTrackPointMatchesStartTime ? '' : ' (Est)'}`, [longitude, latitude], icon_id, pointColor, firstTrackPoint.properties.time);
  }

  if (!isPatrolActive) {
    if (end_location) {
      patrol_points.end_location = makePatrolPointFromFeature('Patrol End', [end_location.longitude, end_location.latitude], icon_id, pointColor, end_time);

    } else if (hasFeatures) {
      const lastTrackPoint = features[0];
      const lastTrackPointMatchesEndTime = normalizeDate(lastTrackPoint.properties.time) === endTime;

      const { geometry: { coordinates: [longitude, latitude] } } = lastTrackPoint;

      patrol_points.end_location = makePatrolPointFromFeature(`Patrol End${lastTrackPointMatchesEndTime ? '' : ' (Est)'}`, [longitude, latitude], icon_id, pointColor, lastTrackPoint.properties.time);
    }
  }

  if (!!patrol_points.end_location 
    && booleanEqual(
      point(patrol_points.end_location.geometry.coordinates),
      point(patrol_points.start_location.geometry.coordinates)
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

export const getBoundsForPatrol = ((patrolData) => {
  const { leader, trackData, patrol } = patrolData;
  
  const hasSegments = !!patrol.patrol_segments && !!patrol.patrol_segments.length;
  if (!hasSegments) return null;

  const [firstLeg] = patrol.patrol_segments;
  
  const hasEvents = !!firstLeg.events && !!firstLeg.events.length;
  const hasLeaderPosition = !!leader && !!leader.last_position;

  const patrolEvents = hasEvents && firstLeg.events.map(({ geojson }) => geojson);
  const patrolLeaderPosition = hasLeaderPosition && leader.last_position;
  const patrolTrack = !!trackData && trackData.track;

  const collectionData = [...patrolEvents, patrolLeaderPosition, ...patrolTrack.features]
    .filter(item => !!item);

  
  if (!collectionData.length) return null;

  return bbox(
    featureCollection(collectionData),
  );
});