import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen } from '../../../test-utils';
import { DEFAULT_SHOW_NAMES_IN_MAP_CONFIG } from '../../../constants';
import { GPS_FORMATS } from '../../../utils/location';
import { mockStore } from '../../../__test-helpers/MockStore';

import MapTab from './';

describe('SideBar - SettingsPane - MapTab', () => {
  let store;
  beforeEach(() => {
    store = {
      data: {},
      view: {
        coordinateReferenceSystems: {
          selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
          storedSystems: [],
        },
        mapClusterConfig: {
          data: {
            events: true,
            subjects: true,
          },
          showPolygons: true,
        },
        mapIsLocked: false,
        showInactiveRadios: true,
        showMapNames: DEFAULT_SHOW_NAMES_IN_MAP_CONFIG,
        showTrackTimepoints: true,
        showUserLocation: true,
        simplifyMapDataOnZoom: {
          enabled: false,
        },
        timeSliderState: {
          active: false,
        },
        userLocation: null,
        userPreferences: {
          enable3D: true,
        },
      },
    };
  });

  const renderMapTab = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MapTab {...props} />
    </Provider>
  );

  test('shows the main map settings view by default', async () => {
    renderMapTab();

    expect(screen.getByRole('group', { name: 'General' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Display' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Map markers' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Coordinates' })).toBeNull();
  });

  test('shows the coordinate system settings view when opened', async () => {
    renderMapTab();

    await userEvent.click(screen.getByRole('button', { name: 'Open coordinate system settings' }));

    expect(screen.queryByRole('group', { name: 'General' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Display' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Map markers' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Coordinate Systems' })).toBeVisible();
  });
});
