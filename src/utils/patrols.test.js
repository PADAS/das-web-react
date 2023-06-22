import addMinutes from 'date-fns/add_minutes';

import { calcPatrolState, createNewPatrolForPatrolType, DELTA_FOR_OVERDUE, sortPatrolList } from './patrols';
import { PATROL_UI_STATES } from '../constants';
import {
  newPatrol,
  readyToStartPatrol,
  scheduledPatrol,
  activePatrol,
  overduePatrol,
  donePatrol,
  cancelledPatrol,
} from '../__test-helpers/fixtures/patrols';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';

const { SCHEDULED, READY_TO_START, ACTIVE, START_OVERDUE, DONE, CANCELLED, INVALID } = PATROL_UI_STATES;

describe('Patrols utils', () => {
  describe('calcPatrolState', () => {
    test('returns scheduled for a patrol that has scheduled_start but no value in time_range properties', () => {
      expect(calcPatrolState(scheduledPatrol)).toBe(SCHEDULED);
    });

    test('returns ready to start for patrols with time range in the same current day but few hours previous current time', () => {
      expect(calcPatrolState(readyToStartPatrol)).toBe(READY_TO_START);
    });

    test('returns ready to start for patrols with scheduled start in the past, before overdue delta', () => {
      const now = new Date();
      readyToStartPatrol.patrol_segments[0].scheduled_start = addMinutes(now, DELTA_FOR_OVERDUE - 1);

      expect(calcPatrolState(readyToStartPatrol)).toBe(READY_TO_START);
    });

    test('returns active for patrols with time range between actual date', () => {
      expect(calcPatrolState(activePatrol)).toBe(ACTIVE);
    });

    test('return overdue for patrols with overdue segment', () => {
      expect(calcPatrolState(overduePatrol)).toBe(START_OVERDUE);
    });

    test('return done for patrols with done as state', () => {
      expect(calcPatrolState(donePatrol)).toBe(DONE);
    });

    test('returns cancelled for patrols with cancelled as state', () => {
      expect(calcPatrolState(cancelledPatrol)).toBe(CANCELLED);
    });

    test('returns invalid for patrols without segments', () => {
      const patrolWithoutSegments = { ...newPatrol, ...{ patrol_segments: [] } };
      expect(calcPatrolState(patrolWithoutSegments)).toBe(INVALID);
    });
  });

  describe('createNewPatrolForPatrolType', () => {
    const data = {
      location: {
        latitude: 0.20972935311753815,
        longitude: 37.414685045175275
      },
      reportedById: 'reportedById',
      time: new Date(2020, 1),
    };

    test('returns a new patrol from a type', () => {
      expect(createNewPatrolForPatrolType(patrolTypes[0], data)).toMatchObject({
        files: [],
        icon_id: 'suspicious_person_rep',
        is_collection: false,
        notes: [],
        patrol_segments: [{
          end_location: null,
          events: [],
          leader: null,
          patrol_type: 'The_Don_Patrol',
          priority: 0,
          scheduled_start: null,
          start_location: {
            latitude: 0.20972935311753815,
            longitude: 37.414685045175275,
          },
          time_range: {
            start_time: new Date(2020, 1),
            end_time: null,
          },
        }],
        priority: 0,
        title: null,
      });
    });

    test('returns a new patrol with automatic start off', () => {
      expect(createNewPatrolForPatrolType(patrolTypes[0], data, false)).toMatchObject({
        patrol_segments: [{
          patrol_type: 'The_Don_Patrol',
          scheduled_start: new Date(2020, 1),
          time_range: { start_time: null },
        }],
      });
    });
  });

  describe('sortPatrolList', () => {
    test('should return patrols in correct sort', async () => {
      const donePatrolUpdate = {
        time: '2023-06-18T22:12:24.207505+00:00'
      };
      const donePatrolWithLatestUpdate = {
        ...donePatrol,
        updates: [donePatrolUpdate]
      };
      const scheduledPatrolUpdate = {
        time: '2023-06-20T22:12:24.207505+00:00'
      };
      const scheduledPatrolWithLatestUpdate = {
        ...scheduledPatrol,
        updates: [scheduledPatrolUpdate]
      };
      const cancelledPatrolUpdate = {
        time: '2023-06-21T22:12:24.207505+00:00'
      };
      const cancelledPatrolWithLatestUpdate = {
        ...cancelledPatrol,
        updates: [cancelledPatrolUpdate]
      };

      const unorderedPatrols = [donePatrol, scheduledPatrol, activePatrol, cancelledPatrol, overduePatrol, readyToStartPatrol, cancelledPatrolWithLatestUpdate, donePatrolWithLatestUpdate, scheduledPatrolWithLatestUpdate ];
      const expectedPatrolStateOrder = [READY_TO_START, START_OVERDUE, ACTIVE, SCHEDULED, SCHEDULED, DONE, DONE, CANCELLED, CANCELLED];
      const sortedPatrols = await sortPatrolList(unorderedPatrols);

      sortedPatrols.forEach((patrol, index) =>
        expect(calcPatrolState(patrol)).toBe(expectedPatrolStateOrder[index])
      );

      const [,,, mostRecentScheduledPatrol,, mostRecentDonePatrol,, mostRecentCancelledPatrol] = sortedPatrols;

      expect(mostRecentScheduledPatrol.updates[0].time).toBe(scheduledPatrolUpdate.time);
      expect(mostRecentDonePatrol.updates[0].time).toBe(donePatrolUpdate.time);
      expect(mostRecentCancelledPatrol.updates[0].time).toBe(cancelledPatrolUpdate.time);
    });
  });
});
