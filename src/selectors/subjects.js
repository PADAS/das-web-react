import { createSelector } from 'reselect';
import { featureCollection } from '@turf/turf';

import {
  addDefaultStatusValue,
  markSubjectFeaturesWithActivePatrols,
  pinMapSubjectsToVirtualPosition,
  subjectIsStatic,
} from '../utils/subjects';
import { addPropsToGeoJsonByKey } from '../utils/map';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../constants';

const selectHiddenSubjectIDs = (state) => state.data.mapLayerFilter.hiddenSubjectIDs;
const selectMapSubjects = (state) => state.data.mapSubjects.subjects;
const selectShowInactiveRadios = (state) => state.view.showInactiveRadios;
const selectSubjectStore = (state) => state.data.subjectStore;

const subjectGroups = ({ data: { subjectGroups } }) => subjectGroups;
const getSystemConfig = ({ view: { systemConfig } }) => systemConfig;
const getUserPermissions = ({ data: { user, selectedUserProfile } }) => (selectedUserProfile.id ? selectedUserProfile : user).permissions || {};
const selectTracks = (state) => state.data.tracks;
const getTimeSliderState = ({ view: { timeSliderState } }) => timeSliderState;

export const selectMapSubjectsFeatureCollection = createSelector(
  [selectMapSubjects, selectSubjectStore, selectHiddenSubjectIDs, selectShowInactiveRadios],
  (mapSubjects, subjectStore, hiddenSubjectIDs, showInactiveRadios) => {
    const hiddenSubjectIDsSet = new Set(hiddenSubjectIDs);
    const features = [];
    const mapSubjectsLength = mapSubjects.length;

    for (let i = 0; i < mapSubjectsLength; i++) {
      const subjectId = mapSubjects[i];

      if (hiddenSubjectIDsSet.has(subjectId) || !subjectStore[subjectId]) {
        // Subject is hidden or doesn't exist in store, skip it.
        continue;
      }

      const subject = subjectStore[subjectId];

      const enrichedSubjectWithLastPosition = addPropsToGeoJsonByKey(subject, 'last_position');
      const lastPositionGeoJson = enrichedSubjectWithLastPosition['last_position'];

      if (!lastPositionGeoJson) {
        // No last_position feature exists, skip it.
        continue;
      }

      if (lastPositionGeoJson.type === 'FeatureCollection') {
        // Last position is a FeatureCollection, process each feature.
        const collectionFeatures = lastPositionGeoJson.features;
        for (let j = 0; j < collectionFeatures.length; j++) {
          let feature = collectionFeatures[j];

          if (subjectIsStatic(feature)) {
            // Subject is static, add default status value.
            feature = addDefaultStatusValue(feature);
          }

          if (!showInactiveRadios && feature.properties?.radio_state === 'offline') {
            // This subject has an offline radio and inactive radios are
            // hidden, skip it.
            continue;
          }

          features.push(feature);
        }
      } else {
        // Last position is a single Feature, process it.
        let feature = lastPositionGeoJson;

        if (subjectIsStatic(feature)) {
          // Subject is static, add default status value.
          feature = addDefaultStatusValue(feature);
        }

        if (!showInactiveRadios && feature.properties?.radio_state === 'offline') {
          // This subject has an offline radio and inactive radios are hidden,
          // skip it.
          continue;
        }

        features.push(feature);
      }
    }

    return featureCollection(features);
  }
);

export const getSubjectGroups = createSelector(
  [subjectGroups, selectSubjectStore],
  (subjectGroups, subjectStore) => {
    const hydrateSubjectGroupSubjects = (...groups) => groups.map((group) => {
      const { subgroups, subjects } = group;

      const hydratedSubGroups = hydrateSubjectGroupSubjects(...subgroups);
      const hydratedSubjects = subjects.map((id) => subjectStore[id]).filter((subject) => !!subject);

      let lastPositionTime;
      hydratedSubGroups.forEach((subGroup) => {
        if (subGroup.lastPositionTime &&
          (!lastPositionTime || new Date(subGroup.lastPositionTime) > new Date(lastPositionTime))) {
          lastPositionTime = subGroup.lastPositionTime;
        }
      });
      hydratedSubjects.forEach((subject) => {
        const subjectLastPositionTime = subject?.last_position?.properties?.coordinateProperties?.time;
        if (subjectLastPositionTime &&
          (!lastPositionTime || new Date(subjectLastPositionTime) > new Date(lastPositionTime))) {
          lastPositionTime = subjectLastPositionTime;
        }
      });

      return {
        ...group,
        subgroups: hydratedSubGroups,
        subjects: hydratedSubjects,
        lastPositionTime,
      };
    });
    return hydrateSubjectGroupSubjects(...subjectGroups);
  }
);


export const allSubjects = createSelector(
  [selectSubjectStore],
  subjectStore => Object.values(subjectStore),
);

export const getMapSubjectFeatureCollectionWithVirtualPositioning = createSelector(
  [selectMapSubjectsFeatureCollection, getSystemConfig, getUserPermissions, selectTracks, getTimeSliderState],
  (mapSubjectsFeatureCollection, systemConfig, userPermissions, tracks, timeSliderState) => {
    const patrolsEnabled = !!systemConfig?.[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT] && (userPermissions[PERMISSION_KEYS.PATROLS] || []).includes(PERMISSIONS.READ);

    console.log('mapSubjectsFeatureCollection', mapSubjectsFeatureCollection);
    const mapSubjectFeatureCollection_ = patrolsEnabled ? markSubjectFeaturesWithActivePatrols(mapSubjectsFeatureCollection) : mapSubjectsFeatureCollection;

    const { active: timeSliderActive, virtualDate } = timeSliderState;
    if (!timeSliderActive) {
      return mapSubjectFeatureCollection_;
    }
    return pinMapSubjectsToVirtualPosition(mapSubjectFeatureCollection_, tracks, virtualDate);
  },
);
