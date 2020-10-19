import React from 'react';
import timeDistanceInWords from 'date-fns/distance_in_words';
import startOfDay from 'date-fns/start_of_day';
import endOfDay from 'date-fns/end_of_day';
import addMinutes from 'date-fns/add_minutes';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import format from 'date-fns/format';
import { PATROL_CARD_STATES } from '../constants';
import { SHORT_TIME_FORMAT } from '../utils/datetime';

import { store } from '../';
import { addModal } from '../ducks/modals';
import { createPatrol, updatePatrol, addNoteToPatrol, uploadPatrolFile } from '../ducks/patrols';

import { getReporterById } from '../utils/events';

import PatrolModal from '../PatrolModal';
import TimeElapsed from '../TimeElapsed';
import { distanceInWords } from 'date-fns';

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

export const displayTitleForPatrol = (patrol) => {
  const UNKNOWN_MESSAGE = 'Unknown patrol type';

  if (patrol.title) return patrol.title;

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

export const segmentStartTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { time_range: { start_time } } = firstLeg;

  return (start_time) 
    ? new Date(start_time)
    : null;
};


export const displayEndTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { time_range: { end_time } } = firstLeg;

  return end_time
    ? new Date(end_time)
    : null;
};

// todo - replace me
export const currentPatrolDateQuery = () => {
  const current_date = new Date();

  const startTimeTxt = startOfDay(current_date).toISOString();
  const endTimeTxt = endOfDay(current_date).toISOString();

  const timeRangeDict =  {date_range: {lower: startTimeTxt, upper: endTimeTxt}};
  const jsonEndcoded = encodeURI('filter=' + JSON.stringify(timeRangeDict));

  return jsonEndcoded;
};

export const displayDurationForPatrol = (patrol) => {
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
    return <TimeElapsed date={displayStartTime} />;
  }

  return timeDistanceInWords(displayStartTime, displayEndTime);
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

const { READY_TO_START, ACTIVE, DONE, START_OVERDUE, CANCELLED, INVALID} = PATROL_CARD_STATES;

export const displayScheduledStartDate = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { scheduled_start } = firstLeg;

  return scheduled_start
    ? new Date(scheduled_start)
    : null;
};

export const isSegmentOverdue = (patrolSegment) => {
  const { time_range: { start_time }, scheduled_start } = patrolSegment;
  return !start_time
    && !!scheduled_start
    && addMinutes(new Date(scheduled_start).getTime(), DELTA_FOR_OVERDUE) < new Date().getTime(); 
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

export const  isPatrolCancelled = (patrol) => {
  return (patrol.state === 'cancelled');
};

export const displayPatrolOverdueTime = (patrol) => {
  const startTime = displayStartTimeForPatrol(patrol);
  const currentTime = new Date();
  return distanceInWords(startTime, currentTime, { includeSeconds: true });
};

export const displayPatrolDoneTime = (patrol) => {
  const doneTime = displayEndTimeForPatrol(patrol);
  return doneTime ? format(doneTime, SHORT_TIME_FORMAT) : '';
};

export const calcPatrolCardState = (patrol) => {
  if (isPatrolCancelled(patrol)) {
    return CANCELLED; 
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
    return READY_TO_START;
  }
  return INVALID;
};

