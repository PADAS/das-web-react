import React from 'react';
import timeDistanceInWords from 'date-fns/distance_in_words';

import { store } from '../';
import { addModal } from '../ducks/modals';
import { createPatrol, updatePatrol, addNoteToPatrol, uploadPatrolFile } from '../ducks/patrols';

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
        start_location: location ? { lat: location.latitude, lng: location.longitude } : null,
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
  const UKNOWN_TYPE = '';
  
  if (patrol.icon_id) return patrol.icon_id;

  if ( patrol.patrol_segments.length && patrol.patrol_segments[0].icon_id) 
    return patrol.patrol_segments[0].icon_id;

  return UKNOWN_TYPE;
};

export const displayTitleForPatrol = (patrol) => {
  const UKNOWN_MESSAGE = 'Unknown patrol type';
  
  if (patrol.title) return patrol.title;

  if (!patrol.patrol_segments.length
    || !patrol.patrol_segments[0].patrol_type) return UKNOWN_MESSAGE;
  
  const { data: { patrolTypes } } = store.getState();
  const matchingType = (patrolTypes || []).find(t => t.id === patrol.patrol_segments[0].patrol_type);

  if (matchingType) return matchingType.display;

  return UKNOWN_MESSAGE;
};

export const displayStartTimeForPatrol = (patrol) => {
  if (!patrol.patrol_segments.length) return null;
  const [firstLeg] = patrol.patrol_segments;

  const { time_range: { start_time } } = firstLeg;

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

export const PATROL_SAVE_ACTIONS = {
  createPatrol(data) {
    return {
      priority: 300,
      action() {
        return store.dispatch(createPatrol(data));
      },
    };
  },
  updatePatrol(data) {
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
  addReportToPatrol(incident_id) {
    return {
      priority: 150,
      action(patrol_id) {
        //  POST `${apiEndpoint}/activity/event/${patrol_id}/relationships`
        // data:{ to_patrol_id: incident_id, type })
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