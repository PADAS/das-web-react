import { createSelector, getTimeSliderState } from './';
import { tracks } from './tracks';

import { createFeatureCollectionFromSubjects, filterInactiveRadiosFromCollection } from '../utils/map';
import { pinMapSubjectsToVirtualPosition } from '../utils/subjects';
import { getActivePatrolsForLeaderId } from '../utils/patrols';

const getMapSubjects = ({ data: { mapSubjects: { subjects } } }) => subjects;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const subjectGroups = ({ data: { subjectGroups } }) => subjectGroups;
const getSubjectStore = ({ data: { subjectStore } }) => subjectStore;
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

export const getMapSubjectFeatureCollectionWithActivePatrols = (mapSubjects) => {
  return {
    ...mapSubjects,
    features: mapSubjects.features
      .map(feature => {
        feature.properties.ticker = Boolean(getActivePatrolsForLeaderId(feature.properties.id).length) ? 'P' : '';
        return feature
      })
  };
};

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
    const mapSubjectFeatureCollection_ = getMapSubjectFeatureCollectionWithActivePatrols(mapSubjectFeatureCollection);

    const { active: timeSliderActive, virtualDate } = timeSliderState;
    if (!timeSliderActive) {
      return mapSubjectFeatureCollection_;
    }
    return pinMapSubjectsToVirtualPosition(mapSubjectFeatureCollection_, tracks, virtualDate);
  },
);
