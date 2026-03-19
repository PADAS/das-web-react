import { createSelector } from 'reselect';
import { featureCollection } from '@turf/turf';

import {
  addDefaultStatusValue,
  markSubjectFeaturesWithActivePatrols,
  pinMapSubjectsToVirtualPosition,
  subjectIsStatic,
} from '../../utils/subjects';
import { addPropsToGeoJsonByKey } from '../../utils/map';
import { FRESH_SUBJECT_WINDOW_MS, PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';

const selectHiddenSubjectIDs = (state) => state.data.mapLayerFilter.hiddenSubjectIDs;
const selectMapSubjects = (state) => state.data.mapSubjects.subjects;
const selectShowInactiveRadios = (state) => state.view.showInactiveRadios;
const selectSelectedUserProfile = (state) => state.data.selectedUserProfile;
const selectSubjectGroups = (state) => state.data.subjectGroups;
const selectSubjectStore = (state) => state.data.subjectStore;
const selectSystemConfig = (state) => state.view.systemConfig;
const selectTimeSliderState = (state) => state.view.timeSliderState;
const selectSubjectPositionTimeSeriesState = (state) => state.data.subjectPositionTimeSeries ?? {
  bySubject: {},
  unknownSubjectIds: [],
  truncatedSubjectIds: [],
};
const selectUser = (state) => state.data.user;

export const selectMapSubjectsFeatureCollection = createSelector(
  [selectMapSubjects, selectSubjectStore, selectHiddenSubjectIDs, selectShowInactiveRadios],
  (mapSubjects, subjectStore, hiddenSubjectIDs, showInactiveRadios) => {
    const hiddenSubjectIDsSet = new Set(hiddenSubjectIDs);

    // Calculate the subject features to show on the map.
    const features = [];
    mapSubjects.forEach((subjectId) => {
      if (!hiddenSubjectIDsSet.has(subjectId) && subjectStore[subjectId]) {
        // The subject is not hidden and exists in the subject store. Get the
        // last position of the subject in GeoJSON format.
        const enrichedSubjectWithLastPosition = addPropsToGeoJsonByKey(subjectStore[subjectId], 'last_position');
        const lastPositionGeoJson = enrichedSubjectWithLastPosition['last_position'];
        if (lastPositionGeoJson) {
          if (lastPositionGeoJson.type === 'FeatureCollection') {
            // Last position is a FeatureCollection, process each feature.
            lastPositionGeoJson.features.forEach((feature) => {
              if (showInactiveRadios || feature.properties?.radio_state !== 'offline') {
                // The radio can be shown.
                if (subjectIsStatic(feature)) {
                  // Subject is static, add default status value.
                  features.push(addDefaultStatusValue(feature));
                } else {
                  features.push(feature);
                }
              }
            });
          } else {
            // Last position is a single Feature, process it.
            if (showInactiveRadios || lastPositionGeoJson.properties?.radio_state !== 'offline') {
              // The radio can be shown.
              if (subjectIsStatic(lastPositionGeoJson)) {
                // Subject is static, add default status value.
                features.push(addDefaultStatusValue(lastPositionGeoJson));
              } else {
                features.push(lastPositionGeoJson);
              }
            }
          }
        }
      }
    });

    // Return the feature collection of the subject features.
    return featureCollection(features);
  }
);

export const selectHydratedSubjectGroupsWithLastPositionTime = createSelector(
  [selectSubjectGroups, selectSubjectStore],
  (subjectGroups, subjectStore) => {
    // Hydrate a subject group subjects recursively and calculate the group's
    // last position time.
    const hydrateSubjectGroupSubjects = (...groups) => groups.map((group) => {
      const { subgroups, subjects } = group;

      const hydratedSubGroups = hydrateSubjectGroupSubjects(...subgroups);
      const hydratedSubjects = subjects.map((id) => subjectStore[id]).filter((subject) => !!subject);

      let lastPositionTime;
      hydratedSubGroups.forEach((subGroup) => {
        if (subGroup.lastPositionTime &&
          (!lastPositionTime || new Date(subGroup.lastPositionTime) > new Date(lastPositionTime))) {
          // The last position time of the subgroup is the most recent.
          lastPositionTime = subGroup.lastPositionTime;
        }
      });
      hydratedSubjects.forEach((subject) => {
        const subjectLastPositionTime = subject?.last_position?.properties?.coordinateProperties?.time;
        if (subjectLastPositionTime &&
          (!lastPositionTime || new Date(subjectLastPositionTime) > new Date(lastPositionTime))) {
          // The last position time of the subject is the most recent.
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
  (subjectStore) => Object.values(subjectStore),
);

const selectPatrolsUserPermissions = createSelector(
  [selectUser, selectSelectedUserProfile],
  (user, selectedUserProfile) => {
    const userPermissions = (selectedUserProfile.id ? selectedUserProfile : user).permissions;

    return userPermissions?.[PERMISSION_KEYS.PATROLS];
  },
);

export const getMapSubjectFeatureCollectionWithVirtualPositioning = createSelector(
  [
    selectMapSubjectsFeatureCollection,
    selectSystemConfig,
    selectPatrolsUserPermissions,
    selectSubjectPositionTimeSeriesState,
    selectTimeSliderState,
  ],
  (mapSubjectsFeatureCollection, systemConfig, patrolsUserPermissions, timelineState, timeSliderState) => {
    const patrolsEnabled = !!systemConfig?.[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]
      && (patrolsUserPermissions || []).includes(PERMISSIONS.READ);

    const mapSubjectFeatureCollectionWithVirtualPositioning = patrolsEnabled
      ? markSubjectFeaturesWithActivePatrols(mapSubjectsFeatureCollection)
      : mapSubjectsFeatureCollection;

    if (timeSliderState.active) {
      return pinMapSubjectsToVirtualPosition(
        mapSubjectFeatureCollectionWithVirtualPositioning,
        timeSliderState.virtualDate,
        timelineState.bySubject,
      );
    }
    return mapSubjectFeatureCollectionWithVirtualPositioning;
  },
);

/**
 * Returns an array of subject IDs whose last known position is within the last
 * hour.  These "fresh" subjects are rendered via the GeoJSON SubjectsLayer and
 * must be excluded from the vector-tile SubjectTileLayer to avoid duplicates.
 */
export const selectFreshSubjectIds = createSelector(
  [selectSubjectStore],
  (subjectStore) => {
    const cutoff = Date.now() - FRESH_SUBJECT_WINDOW_MS;
    return Object.values(subjectStore)
      .filter((subject) => {
        const time = subject.last_position?.properties?.coordinateProperties?.time;
        return time && new Date(time).getTime() > cutoff;
      })
      .map((subject) => subject.id);
  },
);

/**
 * Feature collection containing only "fresh" subjects (position within last
 * hour).  Derives directly from the base feature collection — intentionally
 * bypasses the timeslider/virtual-positioning chain which will be rewritten
 * for vector tiles.  Used by the GeoJSON SubjectsLayer so that stale subjects
 * are exclusively rendered from vector tiles.
 */
export const selectFreshMapSubjectsFeatureCollection = createSelector(
  [selectMapSubjectsFeatureCollection, selectFreshSubjectIds],
  (fc, freshIds) => {
    const freshSet = new Set(freshIds);
    return featureCollection(
      fc.features.filter((f) => freshSet.has(f.properties.id)),
    );
  },
);
