import React from 'react';
import { Provider } from 'react-redux';

import { mockStore } from '../../__test-helpers/MockStore';
import { renderHook } from '../../test-utils';

import { useEventsPermissions, useMessagesPermissions, useObservationsPermissions, usePatrolsPermissions } from '.';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';

describe('usePermissions', () => {
  let store;
  beforeEach(() => {
    store = {
      data: {
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENTS]: [
              PERMISSIONS.CREATE,
              PERMISSIONS.DELETE,
              PERMISSIONS.EXPORT,
              PERMISSIONS.READ,
              PERMISSIONS.UPDATE,
            ],
            [PERMISSION_KEYS.MESSAGES]: [
              PERMISSIONS.CREATE,
              PERMISSIONS.DELETE,
              PERMISSIONS.EXPORT,
              PERMISSIONS.READ,
              PERMISSIONS.UPDATE,
            ],
            [PERMISSION_KEYS.OBSERVATIONS]: [
              PERMISSIONS.CREATE,
              PERMISSIONS.DELETE,
              PERMISSIONS.EXPORT,
              PERMISSIONS.READ,
              PERMISSIONS.UPDATE,
            ],
            [PERMISSION_KEYS.PATROLS]: [
              PERMISSIONS.CREATE,
              PERMISSIONS.DELETE,
              PERMISSIONS.EXPORT,
              PERMISSIONS.READ,
              PERMISSIONS.UPDATE,
            ],
          },
        },
      },
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
          [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
        },
      },
    };
  });

  const wrapper = ({ children }) => <Provider store={mockStore(store)}>
    {children}
  </Provider>;


  describe('useEventsPermissions', () => {
    test('returns the events permissions', async () => {
      const { result } = renderHook(() => useEventsPermissions(), { wrapper });

      expect(result.current).toEqual({
        hasEventsCreatePermission: true,
        hasEventsDeletePermission: true,
        hasEventsExportPermission: true,
        hasEventsReadPermission: true,
        hasEventsUpdatePermission: true,
      });
    });

    test('disables the events permissions if the events feature is disabled', async () => {
      store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
      const { result } = renderHook(() => useEventsPermissions(), { wrapper });

      expect(result.current).toEqual({
        hasEventsCreatePermission: false,
        hasEventsDeletePermission: false,
        hasEventsExportPermission: false,
        hasEventsReadPermission: false,
        hasEventsUpdatePermission: false,
      });
    });
  });

  describe('useMessagesPermissions', () => {
    test('returns the messages permissions', async () => {
      const { result } = renderHook(() => useMessagesPermissions(), { wrapper });

      expect(result.current).toEqual({
        hasMessagesCreatePermission: true,
        hasMessagesDeletePermission: true,
        hasMessagesExportPermission: true,
        hasMessagesReadPermission: true,
        hasMessagesUpdatePermission: true,
      });
    });
  });

  describe('useObservationsPermissions', () => {
    test('returns the observations permissions', async () => {
      const { result } = renderHook(() => useObservationsPermissions(), { wrapper });

      expect(result.current).toEqual({
        hasObservationsCreatePermission: true,
        hasObservationsDeletePermission: true,
        hasObservationsExportPermission: true,
        hasObservationsReadPermission: true,
        hasObservationsUpdatePermission: true,
      });
    });
  });

  describe('usePatrolsPermissions', () => {
    test('returns the patrols permissions', async () => {
      const { result } = renderHook(() => usePatrolsPermissions(), { wrapper });

      expect(result.current).toEqual({
        hasPatrolsCreatePermission: true,
        hasPatrolsDeletePermission: true,
        hasPatrolsExportPermission: true,
        hasPatrolsReadPermission: true,
        hasPatrolsUpdatePermission: true,
      });
    });

    test('disables the patrols permissions if the patrol management feature is disabled', async () => {
      store.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT] = false;
      const { result } = renderHook(() => usePatrolsPermissions(), { wrapper });

      expect(result.current).toEqual({
        hasPatrolsCreatePermission: false,
        hasPatrolsDeletePermission: false,
        hasPatrolsExportPermission: false,
        hasPatrolsReadPermission: false,
        hasPatrolsUpdatePermission: false,
      });
    });
  });
});
