import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { subjectStore } from '../../__test-helpers/fixtures/subjects';

import {
  allSubjects,
  getMapSubjectFeatureCollectionWithVirtualPositioning,
  selectMapSubjectsFeatureCollection,
  selectHydratedSubjectGroupsWithLastPositionTime,
} from './';

jest.mock('../../utils/subjects', () => ({
  ...jest.requireActual('../../utils/subjects'),
  markSubjectFeaturesWithActivePatrols: jest.fn((mapSubjects) => ({
    ...mapSubjects,
    features: mapSubjects.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        ticker: 'P',
      },
    })),
  })),
  pinMapSubjectsToVirtualPosition: jest.fn((mapSubjects) => mapSubjects),
}));

describe('Selectors - Subjects', () => {
  let state;
  beforeEach(() => {
    state = {
      data: {
        mapLayerFilter: {
          hiddenSubjectIDs: [],
        },
        mapSubjects: {
          subjects: [],
        },
        selectedUserProfile: {},
        subjectGroups: [],
        subjectStore: {},
        tracks: {},
        user: {
          permissions: {},
        },
      },
      view: {
        showInactiveRadios: false,
        systemConfig: {},
        timeSliderState: {
          active: false,
          virtualDate: null,
        },
      },
    };
  });

  describe('selectMapSubjectsFeatureCollection', () => {
    test('returns an empty feature collection when there are no map subjects', () => {
      expect(selectMapSubjectsFeatureCollection(state)).toEqual({
        type: 'FeatureCollection',
        features: [],
      });
    });

    test('returns a feature collection with subjects that are not hidden and exist in the store', () => {
      state.data.mapSubjects.subjects = ['0f36c930-bb2e-416e-a943-ef610eb1e04e'];
      state.data.subjectStore = subjectStore;

      const result = selectMapSubjectsFeatureCollection(state);
      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties.id).toBe('0f36c930-bb2e-416e-a943-ef610eb1e04e');
    });

    test('excludes hidden subjects from the feature collection', () => {
      state.data.mapSubjects.subjects = [
        '0f36c930-bb2e-416e-a943-ef610eb1e04e',
        '666420-bb2e-416e-a943-ef610eb1e04e',
      ];
      state.data.mapLayerFilter.hiddenSubjectIDs = ['0f36c930-bb2e-416e-a943-ef610eb1e04e'];
      state.data.subjectStore = subjectStore;

      const result = selectMapSubjectsFeatureCollection(state);
      expect(result.features).toHaveLength(0);
    });

    test('excludes subjects that do not exist in the subject store', () => {
      state.data.mapSubjects.subjects = ['non-existent-id'];
      state.data.subjectStore = subjectStore;

      const result = selectMapSubjectsFeatureCollection(state);
      expect(result.features).toHaveLength(0);
    });

    test('excludes offline radios when showInactiveRadios is false', () => {
      state.data.mapSubjects.subjects = ['0f36c930-bb2e-416e-a943-ef610eb1e04e'];
      state.data.subjectStore = {
        '0f36c930-bb2e-416e-a943-ef610eb1e04e': {
          ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'],
          last_position: {
            ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'].last_position,
            properties: {
              ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'].last_position.properties,
              radio_state: 'offline',
            },
          },
        },
      };
      state.view.showInactiveRadios = false;

      const result = selectMapSubjectsFeatureCollection(state);
      expect(result.features).toHaveLength(0);
    });

    test('includes offline radios when showInactiveRadios is true', () => {
      state.data.mapSubjects.subjects = ['0f36c930-bb2e-416e-a943-ef610eb1e04e'];
      state.data.subjectStore = {
        '0f36c930-bb2e-416e-a943-ef610eb1e04e': {
          ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'],
          last_position: {
            ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'].last_position,
            properties: {
              ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'].last_position.properties,
              radio_state: 'offline',
            },
          },
        },
      };
      state.view.showInactiveRadios = true;

      const result = selectMapSubjectsFeatureCollection(state);
      expect(result.features).toHaveLength(1);
    });

    test('handles subjects with FeatureCollection last_position', () => {
      state.data.mapSubjects.subjects = ['0f36c930-bb2e-416e-a943-ef610eb1e04e'];
      state.data.subjectStore = {
        '0f36c930-bb2e-416e-a943-ef610eb1e04e': {
          ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'],
          last_position: {
            type: 'FeatureCollection',
            features: [
              subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'].last_position,
            ],
          },
        },
      };

      const result = selectMapSubjectsFeatureCollection(state);
      expect(result.features).toHaveLength(1);
    });

    test('excludes subjects without last_position', () => {
      state.data.mapSubjects.subjects = ['666420-bb2e-416e-a943-ef610eb1e04e'];
      state.data.subjectStore = subjectStore;

      const result = selectMapSubjectsFeatureCollection(state);
      expect(result.features).toHaveLength(0);
    });
  });

  describe('selectHydratedSubjectGroupsWithLastPositionTime', () => {
    test('returns an empty array when there are no subject groups', () => {
      expect(selectHydratedSubjectGroupsWithLastPositionTime(state)).toEqual([]);
    });

    test('hydrates subject groups with subjects from the store', () => {
      state.data.subjectGroups = [
        {
          id: 'group1',
          name: 'Group 1',
          subgroups: [],
          subjects: ['0f36c930-bb2e-416e-a943-ef610eb1e04e'],
        },
      ];
      state.data.subjectStore = subjectStore;

      const result = selectHydratedSubjectGroupsWithLastPositionTime(state);
      expect(result).toHaveLength(1);
      expect(result[0].subjects).toHaveLength(1);
      expect(result[0].subjects[0].id).toBe('0f36c930-bb2e-416e-a943-ef610eb1e04e');
    });

    test('calculates last position time from subjects', () => {
      state.data.subjectGroups = [
        {
          id: 'group1',
          name: 'Group 1',
          subgroups: [],
          subjects: ['0f36c930-bb2e-416e-a943-ef610eb1e04e'],
        },
      ];
      state.data.subjectStore = subjectStore;

      const result = selectHydratedSubjectGroupsWithLastPositionTime(state);
      expect(result[0].lastPositionTime).toBe('2020-10-04T11:24:41+00:00');
    });

    test('calculates last position time from nested subgroups', () => {
      const laterDate = '2020-10-05T11:24:41+00:00';

      state.data.subjectGroups = [
        {
          id: 'group1',
          name: 'Group 1',
          subgroups: [
            {
              id: 'subgroup1',
              name: 'Subgroup 1',
              subgroups: [],
              subjects: ['0f36c930-bb2e-416e-a943-ef610eb1e04e'],
            },
          ],
          subjects: [],
        },
      ];
      state.data.subjectStore = {
        '0f36c930-bb2e-416e-a943-ef610eb1e04e': {
          ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'],
          last_position: {
            ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'].last_position,
            properties: {
              ...subjectStore['0f36c930-bb2e-416e-a943-ef610eb1e04e'].last_position.properties,
              coordinateProperties: {
                time: laterDate,
              },
            },
          },
        },
      };

      const result = selectHydratedSubjectGroupsWithLastPositionTime(state);
      expect(result[0].lastPositionTime).toBe(laterDate);
      expect(result[0].subgroups[0].lastPositionTime).toBe(laterDate);
    });

    test('filters out subjects that do not exist in the store', () => {
      state.data.subjectGroups = [
        {
          id: 'group1',
          name: 'Group 1',
          subgroups: [],
          subjects: ['non-existent-id', '0f36c930-bb2e-416e-a943-ef610eb1e04e'],
        },
      ];
      state.data.subjectStore = subjectStore;

      const result = selectHydratedSubjectGroupsWithLastPositionTime(state);
      expect(result[0].subjects).toHaveLength(1);
      expect(result[0].subjects[0].id).toBe('0f36c930-bb2e-416e-a943-ef610eb1e04e');
    });

    test('handles groups without last position time', () => {
      state.data.subjectGroups = [
        {
          id: 'group1',
          name: 'Group 1',
          subgroups: [],
          subjects: ['666420-bb2e-416e-a943-ef610eb1e04e'],
        },
      ];
      state.data.subjectStore = subjectStore;

      const result = selectHydratedSubjectGroupsWithLastPositionTime(state);
      expect(result[0].lastPositionTime).toBeUndefined();
    });
  });

  describe('allSubjects', () => {
    test('returns an empty array when the subject store is empty', () => {
      expect(allSubjects(state)).toEqual([]);
    });

    test('returns all subjects from the subject store', () => {
      state.data.subjectStore = subjectStore;

      const result = allSubjects(state);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toContain('0f36c930-bb2e-416e-a943-ef610eb1e04e');
      expect(result.map((s) => s.id)).toContain('666420-bb2e-416e-a943-ef610eb1e04e');
    });
  });

  describe('getMapSubjectFeatureCollectionWithVirtualPositioning', () => {
    beforeEach(() => {
      state.data.mapSubjects.subjects = ['0f36c930-bb2e-416e-a943-ef610eb1e04e'];
      state.data.subjectStore = subjectStore;
    });

    test('returns the map subjects feature collection when patrols are not enabled', () => {
      state.view.systemConfig = {};

      const result = getMapSubjectFeatureCollectionWithVirtualPositioning(state);
      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
    });

    test('marks subjects with active patrols when patrols are enabled and user has read permission', () => {
      const { markSubjectFeaturesWithActivePatrols } = require('../../utils/subjects');
      state.view.systemConfig = {
        [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
      };
      state.data.user.permissions = {
        [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ],
      };

      getMapSubjectFeatureCollectionWithVirtualPositioning(state);
      expect(markSubjectFeaturesWithActivePatrols).toHaveBeenCalled();
    });

    test('does not mark subjects with active patrols when user lacks read permission', () => {
      const { markSubjectFeaturesWithActivePatrols } = require('../../utils/subjects');
      state.view.systemConfig = {
        [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
      };
      state.data.user.permissions = {
        [PERMISSION_KEYS.PATROLS]: [],
      };

      getMapSubjectFeatureCollectionWithVirtualPositioning(state);
      expect(markSubjectFeaturesWithActivePatrols).not.toHaveBeenCalled();
    });

    test('uses selected user profile permissions when available', () => {
      const { markSubjectFeaturesWithActivePatrols } = require('../../utils/subjects');
      state.view.systemConfig = {
        [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
      };
      state.data.user.permissions = {
        [PERMISSION_KEYS.PATROLS]: [],
      };
      state.data.selectedUserProfile = {
        id: 'profile-id',
        permissions: {
          [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ],
        },
      };

      getMapSubjectFeatureCollectionWithVirtualPositioning(state);
      expect(markSubjectFeaturesWithActivePatrols).toHaveBeenCalled();
    });

    test('pins subjects to virtual position when time slider is active', () => {
      const { pinMapSubjectsToVirtualPosition } = require('../../utils/subjects');
      state.view.timeSliderState = {
        active: true,
        virtualDate: '2020-10-05T00:00:00.000Z',
      };
      state.data.tracks = {
        '0f36c930-bb2e-416e-a943-ef610eb1e04e': {
          track: {
            features: [
              {
                geometry: {
                  coordinates: [[-122.38420717, 47.52167737]],
                },
                properties: {
                  coordinateProperties: {
                    times: ['2020-10-04T11:24:41+00:00'],
                  },
                },
              },
            ],
          },
        },
      };

      getMapSubjectFeatureCollectionWithVirtualPositioning(state);
      expect(pinMapSubjectsToVirtualPosition).toHaveBeenCalled();
    });

    test('does not pin subjects to virtual position when time slider is inactive', () => {
      const { pinMapSubjectsToVirtualPosition } = require('../../utils/subjects');
      state.view.timeSliderState = {
        active: false,
        virtualDate: null,
      };

      getMapSubjectFeatureCollectionWithVirtualPositioning(state);
      expect(pinMapSubjectsToVirtualPosition).not.toHaveBeenCalled();
    });
  });
});
