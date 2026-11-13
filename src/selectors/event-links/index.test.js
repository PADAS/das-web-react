import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { snareTypeV1 } from '../../__test-helpers/fixtures/event-types';

import { selectEventLinkPermissions } from './';

describe('selectors - event-links', () => {
  describe('selectEventLinkPermissions', () => {
    const ALL_CATEGORY_PERMISSIONS = ['create', 'read', 'update', 'delete'];

    let event;
    let state;

    beforeEach(() => {
      event = {
        event_type: snareTypeV1.value,
        id: 'event-id',
        is_collection: false,
        is_contained_in: [],
        patrols: [],
      };
      state = {
        data: {
          eventCategories: {},
          eventTypes: [
            { ...snareTypeV1, category: { ...snareTypeV1.category, permissions: ALL_CATEGORY_PERMISSIONS }, version: 1 },
            {
              category: { flag: 'user', permissions: ALL_CATEGORY_PERMISSIONS, value: 'security' },
              is_collection: true,
              value: 'incident_collection',
              version: 1,
            },
          ],
          user: {
            permissions: {
              [PERMISSION_KEYS.EVENT_RELATED_SEGMENTS]: [PERMISSIONS.DELETE],
              [PERMISSION_KEYS.EVENT_RELATIONSHIPS]: [PERMISSIONS.DELETE],
              [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
            },
          },
        },
        view: { systemConfig: { [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true } },
      };
    });

    const linkEventToIncidentAndPatrol = () => {
      event = { ...event, is_contained_in: [{ related_event: { id: 'incident-id' } }], patrols: ['patrol-id'] };
    };

    const setEventCategoryPermissions = (permissions) => {
      state.data.eventTypes[0] = { ...state.data.eventTypes[0], category: { flag: 'user', permissions } };
    };

    test('lets the user add an unlinked event they can edit to a patrol and to an incident', () => {
      expect(selectEventLinkPermissions(state, event)).toEqual({
        canAddToIncident: true,
        canAddToPatrol: true,
        canCreateIncident: true,
        canRemoveFromIncident: false,
        canRemoveFromPatrol: false,
      });
    });

    test('offers to remove an event from its patrol and its incident instead of adding it to others', () => {
      linkEventToIncidentAndPatrol();

      expect(selectEventLinkPermissions(state, event)).toEqual({
        canAddToIncident: false,
        canAddToPatrol: false,
        canCreateIncident: true,
        canRemoveFromIncident: true,
        canRemoveFromPatrol: true,
      });
    });

    test('does not let the user add an event whose category they cannot edit to an incident', () => {
      setEventCategoryPermissions(['read']);

      expect(selectEventLinkPermissions(state, event).canAddToIncident).toBe(false);
    });

    test('lets the user change the patrol of an event whose category they cannot edit', () => {
      setEventCategoryPermissions(['read']);

      expect(selectEventLinkPermissions(state, event).canAddToPatrol).toBe(true);

      linkEventToIncidentAndPatrol();

      expect(selectEventLinkPermissions(state, event).canRemoveFromPatrol).toBe(true);
    });

    test('lets the user remove an event from an incident with the delete permission alone', () => {
      setEventCategoryPermissions(['read']);
      linkEventToIncidentAndPatrol();

      expect(selectEventLinkPermissions(state, event).canRemoveFromIncident).toBe(true);
    });

    test('does not let the user remove an event from an incident without the delete permission', () => {
      linkEventToIncidentAndPatrol();
      delete state.data.user.permissions[PERMISSION_KEYS.EVENT_RELATIONSHIPS];

      expect(selectEventLinkPermissions(state, event).canRemoveFromIncident).toBe(false);
    });

    test('does not let the user remove an event from a patrol without the permission to do so', () => {
      linkEventToIncidentAndPatrol();
      delete state.data.user.permissions[PERMISSION_KEYS.EVENT_RELATED_SEGMENTS];

      expect(selectEventLinkPermissions(state, event).canRemoveFromPatrol).toBe(false);
    });

    test('does not offer patrols when patrol management is off', () => {
      state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT] = false;

      expect(selectEventLinkPermissions(state, event).canAddToPatrol).toBe(false);

      linkEventToIncidentAndPatrol();

      expect(selectEventLinkPermissions(state, event).canRemoveFromPatrol).toBe(false);
    });

    test('does not offer patrols to a user who cannot change them', () => {
      state.data.user.permissions[PERMISSION_KEYS.PATROLS] = [PERMISSIONS.READ];

      expect(selectEventLinkPermissions(state, event).canAddToPatrol).toBe(false);

      linkEventToIncidentAndPatrol();

      expect(selectEventLinkPermissions(state, event).canRemoveFromPatrol).toBe(false);
    });

    test('does not offer patrols to a user who can change them but not view them', () => {
      state.data.user.permissions[PERMISSION_KEYS.PATROLS] = [PERMISSIONS.UPDATE];

      expect(selectEventLinkPermissions(state, event).canAddToPatrol).toBe(false);

      linkEventToIncidentAndPatrol();

      expect(selectEventLinkPermissions(state, event).canRemoveFromPatrol).toBe(false);
    });

    test('does not let the user add an incident to another incident', () => {
      event = { ...event, is_collection: true };

      expect(selectEventLinkPermissions(state, event).canAddToIncident).toBe(false);
    });

    test('does not let the user create an incident without the right to create one', () => {
      state.data.eventTypes[1] = { ...state.data.eventTypes[1], category: { flag: 'user', permissions: ['update'] } };

      expect(selectEventLinkPermissions(state, event).canCreateIncident).toBe(false);
    });

    test('reads the permissions of the active profile', () => {
      state.data.selectedUserProfile = { id: 'profile-id', permissions: {} };

      expect(selectEventLinkPermissions(state, event).canAddToPatrol).toBe(false);
    });

    test('allows nothing but creating an incident when there is no event', () => {
      expect(selectEventLinkPermissions(state, null)).toEqual({
        canAddToIncident: false,
        canAddToPatrol: false,
        canCreateIncident: true,
        canRemoveFromIncident: false,
        canRemoveFromPatrol: false,
      });
    });

    test('returns the same permissions for the same links of an event', () => {
      expect(selectEventLinkPermissions(state, event)).toBe(selectEventLinkPermissions(state, { ...event }));
    });
  });
});
