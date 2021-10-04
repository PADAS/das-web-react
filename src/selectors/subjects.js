import { createSelector } from 'reselect';

import { getTimeSliderState } from './';
import { tracks } from './tracks';

import { FEATURE_FLAGS, PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { createFeatureCollectionFromSubjects, filterInactiveRadiosFromCollection } from '../utils/map';
import { pinMapSubjectsToVirtualPosition, markSubjectFeaturesWithActivePatrols } from '../utils/subjects';

const getMapSubjects = ({ data: { mapSubjects } }) => mapSubjects;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const subjectGroups = ({ data: { subjectGroups } }) => subjectGroups;
export const getSubjectStore = ({ data: { subjectStore } }) => subjectStore;
const showInactiveRadios = ({ view: { showInactiveRadios } }) => showInactiveRadios;
const getSystemConfig = ({ view: { systemConfig } }) => systemConfig;
const getUserPermissions = ({ data: { user, selectedUserProfile } }) => (selectedUserProfile.id ? selectedUserProfile : user).permissions || {};

export const getMapSubjectFeatureCollection = createSelector(
  [getMapSubjects, getSubjectStore, hiddenSubjectIDs, showInactiveRadios],
  (mapSubjects, subjectStore, hiddenSubjectIDs, showInactiveRadios) => {
    const fromStore = mapSubjects.subjects
      .filter(id => !hiddenSubjectIDs.includes(id))
      .map(id => subjectStore[id])
      .filter(item => !!item);

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
  [getMapSubjectFeatureCollection, getSystemConfig, getUserPermissions, (...args) => tracks(...args), (...args) => getTimeSliderState(...args)],
  (mapSubjectFeatureCollection, systemConfig, userPermissions, tracks, timeSliderState) => {
    const patrolsEnabled = !!systemConfig?.[FEATURE_FLAGS.PATROL_MANAGEMENT] && (userPermissions[PERMISSION_KEYS.PATROLS] || []).includes(PERMISSIONS.READ);

    const mapSubjectFeatureCollection_ = patrolsEnabled ? markSubjectFeaturesWithActivePatrols(mapSubjectFeatureCollection) : mapSubjectFeatureCollection;

    const { active: timeSliderActive, virtualDate } = timeSliderState;
    if (!timeSliderActive) {
      return mapSubjectFeatureCollection_;
    }
    return pinMapSubjectsToVirtualPosition(mapSubjectFeatureCollection_, tracks, virtualDate);
  },
);
