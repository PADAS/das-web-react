import { createSelector, getTimeSliderState } from './';
import { tracks } from './tracks';

import { createFeatureCollectionFromSubjects, filterInactiveRadiosFromCollection } from '../utils/map';
import { getUniqueSubjectGroupSubjects, pinMapSubjectsToVirtualPosition } from '../utils/subjects';
import { calcPatrolCardState, getPatrolsForSubject } from '../utils/patrols';

const getMapSubjects = ({ data: { mapSubjects: { subjects } } }) => subjects;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const subjectGroups = ({ data: { subjectGroups } }) => subjectGroups;
const getSubjectStore = ({ data: { subjectStore } }) => subjectStore;
const getPatrols =  ({ data: { patrols: { results } } }) => results;
const showInactiveRadios = ({ view: { showInactiveRadios } }) => showInactiveRadios;

export const getMapSubjectFeatureCollection = createSelector(
  [getMapSubjects, getSubjectStore, hiddenSubjectIDs, showInactiveRadios],
  (mapSubjects, subjectStore, hiddenSubjectIDs, showInactiveRadios) => {
    const fromStore = mapSubjects
      .filter(id => !hiddenSubjectIDs.includes(id))
      .map(id => subjectStore[id])
      .filter(item => !!item)
    
    const mapSubjectCollection = createFeatureCollectionFromSubjects(fromStore);
    if (showInactiveRadios) return mapSubjectCollection;
    return filterInactiveRadiosFromCollection(mapSubjectCollection);
  });


export const getSubjectGroups = createSelector(
  [subjectGroups, getSubjectStore],
  (subjectGroups, subjectStore) => {
    const hydrateSubjectGroupSubjects = (...groups) => groups.map((group) => {
      const { subgroups, subjects } = group;

      return {
        ...group,
        subgroups: hydrateSubjectGroupSubjects(...subgroups),
        subjects: subjects
          .map(id =>  subjectStore[id])
          .filter(item => !!item),
      };
    });
    return hydrateSubjectGroupSubjects(...subjectGroups);
  }
);


export const allSubjects = createSelector(
  [getSubjectStore],
  subjectStore => Object.values(subjectStore),
);

export const getMapSubjectFeatureCollectionWithVirtualPositioning = createSelector(
  [getMapSubjectFeatureCollection, tracks, getTimeSliderState],
  (mapSubjectFeatureCollection, tracks, timeSliderState) => {
    const { active: timeSliderActive, virtualDate } = timeSliderState;
    if (!timeSliderActive) {
      return mapSubjectFeatureCollection;
    }
    return pinMapSubjectsToVirtualPosition(mapSubjectFeatureCollection, tracks, virtualDate);
  },
);

const filterSubjectFeatureCollectionToActivePatrols = (subjectFeatureCollection, patrols) => {
  return {
    type: 'FeatureCollection',
    features: subjectFeatureCollection.features.filter(
      ({properties: subject}) => {
        const subjectPatrol = getPatrolsForSubject(patrols, subject)[0];
        return subjectPatrol && calcPatrolCardState(subjectPatrol).title === 'Active';
      }
    ),
  };
};

export const getSubjectsOnActivePatrol = createSelector(
  [getMapSubjectFeatureCollection, tracks, getTimeSliderState, getPatrols],
  (mapSubjectFeatureCollection, tracks, timeSliderState, patrols) => {
    const { active: timeSliderActive, virtualDate } = timeSliderState;
    if (!timeSliderActive) {
      return filterSubjectFeatureCollectionToActivePatrols(mapSubjectFeatureCollection, patrols);
    }
    return filterSubjectFeatureCollectionToActivePatrols(
      pinMapSubjectsToVirtualPosition(mapSubjectFeatureCollection, tracks, virtualDate),
      patrols
    );
  },
);
