import { createSelector, getTimeSliderState } from './';
import { tracks } from './tracks';

import { createFeatureCollectionFromSubjects, filterInactiveRadiosFromCollection } from '../utils/map';
import { getUniqueSubjectGroupSubjects, pinMapSubjectsToVirtualPosition } from '../utils/subjects';
import { getLeaderForPatrol } from '../utils/patrols';

const getPatrols = ({ data: { patrols: { results } }}) => results;
const getMapSubjects = ({ data: { mapSubjects: { subjects } } }) => subjects;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const subjectGroups = ({ data: { subjectGroups } }) => subjectGroups;
const getSubjectStore = ({ data: { subjectStore } }) => subjectStore;
const showInactiveRadios = ({ view: { showInactiveRadios } }) => showInactiveRadios;

const getPatrolsForSubject = (patrols, subject) => {
  return patrols.filter(patrol => {
    return getLeaderForPatrol(patrol)?.id === subject.id
  });
}

export const getMapSubjectFeatureCollection = createSelector(
  [getMapSubjects, getSubjectStore, hiddenSubjectIDs, showInactiveRadios, getPatrols],
  (mapSubjects, subjectStore, hiddenSubjectIDs, showInactiveRadios, patrols) => {
    const fromStore = mapSubjects
      .filter(id => !hiddenSubjectIDs.includes(id))
      .map(id => subjectStore[id])
      .filter(item => !!item)
      .map(
        subject => {
          const subjectPatrols = getPatrolsForSubject(patrols, subject);
          subject.is_on_patrol = Boolean(subjectPatrols.length);
          return subject;
        }
      )
    
    const mapSubjectCollection = createFeatureCollectionFromSubjects(fromStore);
    console.log({mapSubjectCollection});
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

