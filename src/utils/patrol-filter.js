import isEqual from 'react-fast-compare';

import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';


export const isFilterModified = ({ state, filter: { priority, reported_by, text } }) => (
  !isEqual(INITIAL_FILTER_STATE.state, state)
);