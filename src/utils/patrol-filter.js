import { endOfDay, max } from 'date-fns';
import isEqual from 'react-fast-compare';
import merge from 'lodash/merge';

import { objectToParamString } from './query';
import store from '../store';

import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';

export const calcPatrolFilterForRequest = (options = {}) => {
  const { data: { patrolFilter } } = store.getState();
  const { params, format = 'string' } = options;

  const filterParams = merge(
    {
      exclude_empty_patrols: true,
    },
    patrolFilter,
    params
  );
  delete filterParams._persist;

  const dateRange = filterParams.filter.date_range;
  // The API reads a range with no end as reaching every patrol ever scheduled,
  // so it ends today, or on the day it starts when that comes later.
  if (!dateRange.upper) {
    const lastDay = dateRange.lower ? max([new Date(), new Date(dateRange.lower)]) : new Date();

    dateRange.upper = endOfDay(lastDay).toISOString();
  }

  if (format === 'object') return filterParams;
  return objectToParamString(filterParams);
};

export const isFilterModified = ({ status, filter: { patrol_type, text, tracked_by } }) => (
  !isEqual(INITIAL_FILTER_STATE.status, status)
  || !isEqual(INITIAL_FILTER_STATE.filter.patrol_type, patrol_type)
  || !isEqual(INITIAL_FILTER_STATE.filter.text, text)
  || !isEqual(INITIAL_FILTER_STATE.filter.tracked_by, tracked_by)
);
