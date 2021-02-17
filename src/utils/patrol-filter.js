import isEqual from 'react-fast-compare';
import merge from 'lodash/merge';
import isSameDay from 'date-fns/is_same_day';
import isSameMonth from 'date-fns/is_same_month';
import format from 'date-fns/format';
import isThisYear from 'date-fns/is_this_year';
import cloneDeep from 'lodash/cloneDeep';

import { displayEndTimeForPatrol, displayStartTimeForPatrol, isPatrolCancelled } from './patrols';
import { objectToParamString } from './query';
import { store } from '../';

import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';

export const isFilterModified = ({ state, filter: { priority, reported_by, text } }) => (
  !isEqual(INITIAL_FILTER_STATE.state, state)
);

export const isDateFilterModified = ({ filter: { date_range } }) => !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);

export const calcPatrolFilterForRequest = (options = {}) => {
  const { data: { patrolFilter } } = store.getState();
  const clonedFilter = cloneDeep(patrolFilter);
  const { filter: { overlap }} = clonedFilter;
  delete clonedFilter.filter.overlap;
  clonedFilter.filter.patrols_overlap_daterange = isDateFilterModified(clonedFilter) ? overlap : true;
  const { params } = options;
  const  filterParams = merge({}, clonedFilter, params);
  console.log('patrol filter params', filterParams);
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


export const calcPatrolListTitleFromFilter = (patrolFilter) => {
  const { filter: { date_range: { lower, upper } } } = patrolFilter;
  const dateRangeModified = isDateFilterModified(patrolFilter);
  if (!dateRangeModified) {
    return {
      title: 'Current Patrols',
      details: '00:00 to 23:59',
    };
  }

  const lowerDate = new Date(lower);
  const upperDate = new Date(upper || new Date());

  const returnValue = {
    title: null,
    details: null,
  };

  const rangeIsWithinCurrentYear = isThisYear(lowerDate) && isThisYear(upperDate);
  

  if (isSameDay(lowerDate, upperDate)) {
    const titleDateFormatString = `D MMMM${rangeIsWithinCurrentYear ? '' : ' YYYY'}`;
    const detailsDateFormatString = 'HH:mm';

    returnValue.title = `Patrols: ${format(lowerDate, titleDateFormatString)}`;
    returnValue.details = `${format(lowerDate, detailsDateFormatString)} - ${format(upperDate, detailsDateFormatString)}`;

  } else if (isSameMonth(lowerDate, upperDate)) {
    const titleDateFormatString = `MMMM${rangeIsWithinCurrentYear ? '' : ' YYYY'}`;
    const detailsDateFormatString = 'D MMM HH:mm';

    returnValue.title = `Patrols: ${format(lowerDate, 'D')}-${format(upperDate, 'D')} ${format(lowerDate, titleDateFormatString)}`;
    returnValue.details = `${format(lowerDate, detailsDateFormatString)} - ${format(upperDate, detailsDateFormatString)}`;
  } else if (rangeIsWithinCurrentYear) {
    const titleDateFormatString = 'MMMM';
    const detailsDateFormatString = 'D MMM HH:mm';

    returnValue.title = `Patrols: ${format(lowerDate, titleDateFormatString)} - ${format(upperDate, titleDateFormatString)}`;
    returnValue.details = `${format(lowerDate, detailsDateFormatString)} - ${format(upperDate, detailsDateFormatString)}`;
  } else {
    const titleDateFormatString = 'MMM YYYY';
    const detailsDateFormatString = 'D MMM \'YY HH:mm';

    returnValue.title = `Patrols: ${format(lowerDate, titleDateFormatString)} - ${format(upperDate, titleDateFormatString)}`;
    returnValue.details = `${format(lowerDate, detailsDateFormatString)} - ${format(upperDate, detailsDateFormatString)}`;
  }
  
  return returnValue;
};