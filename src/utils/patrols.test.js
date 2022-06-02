import { calcPatrolState, sortPatrolList } from './patrols';
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

const { SCHEDULED, READY_TO_START, ACTIVE, START_OVERDUE, DONE, CANCELLED, INVALID } = PATROL_UI_STATES;

describe('Patrols utils', () => {
  describe('calcPatrolState', () => {
    test('returns scheduled for a patrol that has scheduled_start but no value in time_range properties', () => {
      expect(calcPatrolState(scheduledPatrol)).toBe(SCHEDULED);
    });

    test('returns ready to start for patrols with time range in the same current day but few hours previous current time', () => {
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
  describe('sortPatrolList', () => {
    test('should return patrols in correct sort', async () => {

      const unorderedPatrols = [donePatrol, scheduledPatrol, activePatrol, cancelledPatrol, overduePatrol, readyToStartPatrol ];
      const sortedPatrols = await sortPatrolList(unorderedPatrols);

      expect(calcPatrolState(sortedPatrols[0])).toBe(READY_TO_START);
      expect(calcPatrolState(sortedPatrols[1])).toBe(START_OVERDUE);
      expect(calcPatrolState(sortedPatrols[2])).toBe(ACTIVE);
      expect(calcPatrolState(sortedPatrols[3])).toBe(SCHEDULED);
      expect(calcPatrolState(sortedPatrols[4])).toBe(DONE);
      expect(calcPatrolState(sortedPatrols[5])).toBe(CANCELLED);
    });
  });
});
