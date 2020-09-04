import isEqual from 'react-fast-compare';

import { INITIAL_FILTER_STATE } from '../ducks/event-filter';


export const isFilterModified = (state, priority, text, reported_by) => (
  !isEqual(INITIAL_FILTER_STATE.state, state)
    || !isEqual(INITIAL_FILTER_STATE.filter.priority, priority)
    || !isEqual(INITIAL_FILTER_STATE.filter.text, text)
    || !isEqual(INITIAL_FILTER_STATE.filter.reported_by, reported_by)
);
