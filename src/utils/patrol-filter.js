import isEqual from 'react-fast-compare';
import merge from 'lodash/merge';

import { objectToParamString } from './query';
import store from '../store';

import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';

export const isDateFilterModified = ({ filter: { date_range } }) => !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);

export const calcPatrolFilterForRequest = (options = {}) => {
  const { data: { patrolFilter } } = store.getState();
  const { filter: { patrols_overlap_daterange } } = patrolFilter;
  const { params, format = 'string' } = options;

  const filterParams = merge(
    {
      exclude_empty_patrols: true,
    },
    patrolFilter,
    params
  );
  delete filterParams._persist;
  // only apply current filter settings if it is modified, otherwise allow overlap
  filterParams.filter.patrols_overlap_daterange = isDateFilterModified(patrolFilter) ? patrols_overlap_daterange : true;

  if (format === 'object') return filterParams;
  return objectToParamString(filterParams);
};

export const isFilterModified = ({ status, filter: { patrol_type, text, tracked_by } }) => (
  !isEqual(INITIAL_FILTER_STATE.status, status)
  || !isEqual(INITIAL_FILTER_STATE.filter.patrol_type, patrol_type)
  || !isEqual(INITIAL_FILTER_STATE.filter.text, text)
  || !isEqual(INITIAL_FILTER_STATE.filter.tracked_by, tracked_by)
);
