import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen } from '../../../../test-utils';
import { DEFAULT_SHOW_NAMES_IN_MAP_CONFIG } from '../../../../constants';
import { GPS_FORMATS } from '../../../../utils/location';
import { mockStore } from '../../../../__test-helpers/MockStore';

import MainMapSettingsView from './';

describe('SideBar - SettingsPane - MapTab - MainMapSettingsView', () => {
  const onOpenCoordinateSettingsView = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      data: {},
      view: {
        coordinateReferenceSystems: {
          selectedSystems: Object.values(GPS_FORMATS),
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

  const renderMainMapSettingsView = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MainMapSettingsView onOpenCoordinateSettingsView={onOpenCoordinateSettingsView} {...props} />
    </Provider>
  );

  test('opens the coordinate settings view when the user clicks the coordinates button', async () => {
    renderMainMapSettingsView();

    expect(onOpenCoordinateSettingsView).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Coordinates' }));

    expect(onOpenCoordinateSettingsView).toHaveBeenCalledTimes(1);
  });
});
