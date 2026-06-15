import { createSelector } from 'reselect';
import { featureCollection } from '@turf/turf';

import {
  addDefaultStatusValue,
  isGearSubjectSubtype,
  markSubjectFeaturesWithActivePatrols,
  pinMapSubjectsToVirtualPosition,
  subjectIsStatic,
} from '../../utils/subjects';
import { addPropsToGeoJsonByKey } from '../../utils/map';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';

const selectHiddenSubjectIDs = (state) => state.data.mapLayerFilter.hiddenSubjectIDs;
const selectMapSubjects = (state) => state.data.mapSubjects.subjects;
const selectShowInactiveRadios = (state) => state.view.showInactiveRadios;
const selectSelectedUserProfile = (state) => state.data.selectedUserProfile;
const selectSubjectGroups = (state) => state.data.subjectGroups;
const selectSubjectStore = (state) => state.data.subjectStore;
const selectSystemConfig = (state) => state.view.systemConfig;
const selectTimeSliderState = (state) => state.view.timeSliderState;
const selectTracks = (state) => state.data.tracks;
const selectUser = (state) => state.data.user;

/**
 * Map subject pins (GeoJSON) for the main map. Excludes hidden subjects and ropeless-gear
 * subjects (those use the Gear tab / GearLayer instead).
 */
export const selectMapSubjectsFeatureCollection = createSelector(
  [selectMapSubjects, selectSubjectStore, selectHiddenSubjectIDs, selectShowInactiveRadios],
  (mapSubjects, subjectStore, hiddenSubjectIDs, showInactiveRadios) => {
    const hiddenSubjectIDsSet = new Set(hiddenSubjectIDs);

    const features = [];
    mapSubjects.forEach((subjectId) => {
      const subjectRecord = subjectStore[subjectId];
      if (!hiddenSubjectIDsSet.has(subjectId) && subjectRecord && !isGearSubjectSubtype(subjectRecord)) {
        // The subject is not hidden and exists in the subject store. Get the
        // last position of the subject in GeoJSON format.
        const enrichedSubjectWithLastPosition = addPropsToGeoJsonByKey(subjectRecord, 'last_position');
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

/**
 * Subject groups with hydrated subject records and subgroup last-position times.
 * Gear / ropeless subjects are omitted from group membership lists (same as map subjects).
 */
export const selectHydratedSubjectGroupsWithLastPositionTime = createSelector(
  [selectSubjectGroups, selectSubjectStore],
  (subjectGroups, subjectStore) => {
    const hydrateSubjectGroupSubjects = (...groups) => groups.map((group) => {
      const { subgroups, subjects } = group;

      const hydratedSubGroups = hydrateSubjectGroupSubjects(...subgroups);
      const hydratedSubjects = subjects
        .map((id) => subjectStore[id])
        .filter((subject) => !!subject && !isGearSubjectSubtype(subject));

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
    selectTracks,
    selectTimeSliderState,
  ],
  (mapSubjectsFeatureCollection, systemConfig, patrolsUserPermissions, tracks, timeSliderState) => {
    const patrolsEnabled = !!systemConfig?.[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]
      && (patrolsUserPermissions || []).includes(PERMISSIONS.READ);

    const mapSubjectFeatureCollectionWithVirtualPositioning = patrolsEnabled
      ? markSubjectFeaturesWithActivePatrols(mapSubjectsFeatureCollection)
      : mapSubjectsFeatureCollection;

    if (timeSliderState.active) {
      return pinMapSubjectsToVirtualPosition(
        mapSubjectFeatureCollectionWithVirtualPositioning,
        tracks,
        timeSliderState.virtualDate,
      );
    }
    return mapSubjectFeatureCollectionWithVirtualPositioning;
  },
);
