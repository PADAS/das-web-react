import { createSelector } from 'reselect';

const getEventTypes = ({ data: { eventTypes } }) => eventTypes;
const getPatrolTypes = ({ data: { patrolTypes } }) => patrolTypes;

export const displayEventTypes = createSelector(
  [getEventTypes, getPatrolTypes],
  (eventTypes, patrolTypes) => {
    return [...eventTypes, ...patrolTypes];
  }
);