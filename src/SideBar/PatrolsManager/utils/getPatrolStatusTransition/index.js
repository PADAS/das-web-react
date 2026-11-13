import { PATROL_UI_STATES } from '../../../../constants';

const { ACTIVE, CANCELLED, DONE, PAUSED, READY_TO_START, SCHEDULED, START_OVERDUE } = PATROL_UI_STATES;

// Reopening a patrol that is over lands it on whichever state its own times put
// it in, and reaching any of them is a restore.
const REOPEN_TRANSITIONS = {
  [ACTIVE.key]: 'restore',
  [DONE.key]: 'restore',
  [PAUSED.key]: 'restore',
  [READY_TO_START.key]: 'restore',
  [SCHEDULED.key]: 'restore',
  [START_OVERDUE.key]: 'restore',
};

const NOT_STARTED_TRANSITIONS = { [ACTIVE.key]: 'start', [CANCELLED.key]: 'cancel' };

const TRANSITIONS_BY_PATROL_STATE = {
  [ACTIVE.key]: { [CANCELLED.key]: 'cancel', [DONE.key]: 'end', [PAUSED.key]: 'pause' },
  [CANCELLED.key]: REOPEN_TRANSITIONS,
  [DONE.key]: REOPEN_TRANSITIONS,
  [PAUSED.key]: { [ACTIVE.key]: 'resume', [CANCELLED.key]: 'cancel', [DONE.key]: 'end' },
  [READY_TO_START.key]: NOT_STARTED_TRANSITIONS,
  [SCHEDULED.key]: NOT_STARTED_TRANSITIONS,
  [START_OVERDUE.key]: NOT_STARTED_TRANSITIONS,
};

// What moving a patrol between two states is called depends on the state it is
// leaving: a paused patrol resumes where a scheduled one starts. Staying where
// it is names no move, which is how a state that is already its own reads.
const getPatrolStatusTransition = (patrolState, nextState) => patrolState === nextState
  ? null
  : TRANSITIONS_BY_PATROL_STATE[patrolState.key]?.[nextState.key] ?? null;

export default getPatrolStatusTransition;
