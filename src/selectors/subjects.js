import { createSelector, getTimeSliderState } from './';
import { getMapSubjectTracksFeatureCollection } from './tracks';

import { createFeatureCollectionFromSubjects } from '../utils/map';

import { getUniqueSubjectGroupSubjects, pinMapSubjectsToLastKnownTrackPosition } from '../utils/subjects';

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
  [getMapSubjectFeatureCollection, getMapSubjectTracksFeatureCollection, getTimeSliderState],
  (mapSubjectFeatureCollection, trimmedTracks, timeSliderState) => {
    const { active:timeSliderActive } = timeSliderState;
    if (!timeSliderActive) {
      return mapSubjectFeatureCollection;
    }
    return pinMapSubjectsToLastKnownTrackPosition(mapSubjectFeatureCollection, trimmedTracks);
    
  },
);