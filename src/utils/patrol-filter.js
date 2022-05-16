import isEqual from 'react-fast-compare';
import merge from 'lodash/merge';
import isSameDay from 'date-fns/is_same_day';
import isSameMonth from 'date-fns/is_same_month';
import format from 'date-fns/format';
import isThisYear from 'date-fns/is_this_year';

import { displayEndTimeForPatrol, displayStartTimeForPatrol, isPatrolCancelled } from './patrols';
import { objectToParamString } from './query';
import store from '../store';

import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';

export const isDateFilterModified = ({ filter: { date_range } }) => !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);

export const calcPatrolFilterForRequest = (options = {}) => {
  const { data: { patrolFilter } } = store.getState();
  const { filter: { patrols_overlap_daterange } } = patrolFilter;
  const { params, format = 'string' } = options;
  const  filterParams = merge({}, patrolFilter, params);
  // only apply current filter settings if it is modified, otherwise allow overlap
  filterParams.filter.patrols_overlap_daterange = isDateFilterModified(patrolFilter) ? patrols_overlap_daterange : true;

  if (format === 'object') return filterParams;
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

export const isFilterModified = ({ status, filter: { patrol_type, text, tracked_by } }) => (
  !isEqual(INITIAL_FILTER_STATE.status, status)
    || !isEqual(INITIAL_FILTER_STATE.filter.patrol_type, patrol_type)
    || !isEqual(INITIAL_FILTER_STATE.filter.text, text)
    || !isEqual(INITIAL_FILTER_STATE.filter.tracked_by, tracked_by)
);
