import { PATROL_UI_STATES } from '../../../../constants';

import getPatrolStatusTransition from './';

const { ACTIVE, CANCELLED, DONE, INVALID, PAUSED, READY_TO_START, SCHEDULED, START_OVERDUE } = PATROL_UI_STATES;

describe('SideBar - PatrolsManager - utils - getPatrolStatusTransition', () => {
  test('starts a patrol that has not begun yet', () => {
    expect(getPatrolStatusTransition(SCHEDULED, ACTIVE)).toBe('start');
    expect(getPatrolStatusTransition(READY_TO_START, ACTIVE)).toBe('start');
    expect(getPatrolStatusTransition(START_OVERDUE, ACTIVE)).toBe('start');
  });

  test('resumes a paused patrol', () => {
    expect(getPatrolStatusTransition(PAUSED, ACTIVE)).toBe('resume');
  });

  test('restores a patrol that is over, whichever state reopening it lands on', () => {
    expect(getPatrolStatusTransition(CANCELLED, ACTIVE)).toBe('restore');
    expect(getPatrolStatusTransition(CANCELLED, SCHEDULED)).toBe('restore');
    expect(getPatrolStatusTransition(DONE, READY_TO_START)).toBe('restore');
    expect(getPatrolStatusTransition(DONE, START_OVERDUE)).toBe('restore');
    expect(getPatrolStatusTransition(CANCELLED, DONE)).toBe('restore');
  });

  test('restores a patrol that was ended or called off while it was paused', () => {
    expect(getPatrolStatusTransition(DONE, PAUSED)).toBe('restore');
    expect(getPatrolStatusTransition(CANCELLED, PAUSED)).toBe('restore');
  });

  test('pauses and ends a patrol under way', () => {
    expect(getPatrolStatusTransition(ACTIVE, PAUSED)).toBe('pause');
    expect(getPatrolStatusTransition(ACTIVE, DONE)).toBe('end');
    expect(getPatrolStatusTransition(PAUSED, DONE)).toBe('end');
  });

  test('cancels a patrol that is not over', () => {
    expect(getPatrolStatusTransition(SCHEDULED, CANCELLED)).toBe('cancel');
    expect(getPatrolStatusTransition(ACTIVE, CANCELLED)).toBe('cancel');
    expect(getPatrolStatusTransition(PAUSED, CANCELLED)).toBe('cancel');
  });

  test('reports no transition to the state the patrol is already in', () => {
    expect(getPatrolStatusTransition(ACTIVE, ACTIVE)).toBeNull();
    expect(getPatrolStatusTransition(DONE, DONE)).toBeNull();
  });

  test('reports no transition out of an invalid patrol', () => {
    expect(getPatrolStatusTransition(INVALID, ACTIVE)).toBeNull();
  });
});
