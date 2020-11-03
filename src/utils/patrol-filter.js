import isEqual from 'react-fast-compare';
import merge from 'lodash/merge';

import { displayEndTimeForPatrol, displayStartTimeForPatrol, isPatrolCancelled } from './patrols';
import { objectToParamString } from './query';
import { store } from '../';

import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';

export const isFilterModified = ({ state, filter: { priority, reported_by, text } }) => (
  !isEqual(INITIAL_FILTER_STATE.state, state)
);

export const calcPatrolFilterForRequest = (options = {}) => {
  const { data: { patrolFilter } } = store.getState();
  const { params } = options;
  const  filterParams = merge({}, patrolFilter, params);
  return objectToParamString(filterParams);  
};

export const validatePatrolAgainstPatrolFilter = (patrol) => {
  const { data: { patrolFilter } } = store.getState();

  const patrolMatechesDateFilter = () => {
    const { filter: { date_range: { lower, upper } } } = patrolFilter;
    const patrolStart = displayStartTimeForPatrol(patrol);
    const patrolEnd = displayEndTimeForPatrol(patrol);

    const patrolStartDateBeforeUpperRange = () => (upper && patrolStart &&
      (patrolStart.getTime() >= new Date(upper).getTime()));
    
    const patrolEndDateAfterLowerRange = () => (upper && patrolEnd &&
      (patrolEnd.getTime() > new Date(lower).getTime()));

    const patrolEndDateBeforeLowerRange = () => (lower && patrolEnd &&
        (patrolEnd.getTime() < new Date(lower).getTime()));

    const patrolEndDateBeforeToLowerAndNotDoneOrCancelled = () => {
      return patrolEndDateBeforeLowerRange && patrol.state === 'open';
    };

    const patrolEndDateUndefinedAndNotCancelled = () => {
      const cancelled = isPatrolCancelled(patrol);
      return !patrolEnd && !cancelled;
    };

    return patrolStartDateBeforeUpperRange()
      && (patrolEndDateAfterLowerRange() 
      || patrolEndDateBeforeLowerRange() 
      || patrolEndDateBeforeToLowerAndNotDoneOrCancelled()
      || patrolEndDateUndefinedAndNotCancelled());

  };

  return patrolMatechesDateFilter(); 
};
