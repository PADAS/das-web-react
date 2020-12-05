import { createSelector } from './';

const getPatrolStore = ({ data: { patrolStore } }) => patrolStore;
const getPatrolList = ({ data: { patrols } }) => patrols;


export const patrolListFromStore = createSelector(
  [getPatrolStore, getPatrolList], 
  (store, list) => ({
    ...list,
    results: list.results.map(id => store[id]).filter(item => !!item),
  }),
);