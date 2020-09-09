import React from 'react';
import timeDistanceInWords from 'date-fns/distance_in_words';

import { store } from '../';
import { addModal } from '../ducks/modals';

import { getReporterById } from '../utils/events';

import PatrolModal from '../PatrolModal';
import TimeElapsed from '../TimeElapsed';

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

  const sources = trackingSubject ? [trackingSubject] : [];

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
        sources,
        start_location: location ? { lat: location.latitude, lng: location.longitude } : null,
        start_time: time ? new Date(time) : new Date(),
        end_time: null,
        end_location: null,
      },
    ],
    files: [],
    notes: [],
    title: null,
  };
};

export const displayTitleForPatrol = (patrol) => {
  console.log('calculating for patrol', patrol);
  
  if (patrol.title) return patrol.title;

  if (!patrol.patrol_segments.length
  || !patrol.patrol_segments[0].patrol_type) return 'Unknown patrol type';
  
  const { data: { patrolTypes } } = store.getState();
  const matchingType = (patrolTypes || []).find(t => t.value === patrol.patrol_segments[0].patrol_type);

  if (matchingType) return matchingType.display;

  return patrol.patrol_segments[0].patrol_type;
};

export const displayStartTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { start_time } = firstLeg;

  return start_time
    ?  new Date(start_time)
    : null;
};

export const displayEndTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { end_time } = firstLeg;

  return end_time
    ?  new Date(end_time)
    : null;
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