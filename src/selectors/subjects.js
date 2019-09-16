import { createSelector, getTimeSliderState } from './';
import { tracks } from './tracks';

import { createFeatureCollectionFromSubjects } from '../utils/map';
import { getUniqueSubjectGroupSubjects, pinMapSubjectsToVirtualPosition } from '../utils/subjects';

const mapSubjects = ({ data: { mapSubjects: { subjects } } }) => subjects;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const getSubjectGroups = ({ data: { subjectGroups } }) => subjectGroups;

export const getMapSubjectFeatureCollection = createSelector(
  [mapSubjects, hiddenSubjectIDs],
  (mapSubjects, hiddenSubjectIDs) => createFeatureCollectionFromSubjects(mapSubjects.filter(item => !hiddenSubjectIDs.includes(item.id)))
);


export const allSubjects = createSelector(
  [getSubjectGroups],
  subjectGroups => getUniqueSubjectGroupSubjects(...subjectGroups),
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

