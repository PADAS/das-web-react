import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen } from '../../../../test-utils';
import { GPS_FORMATS } from '../../../../utils/location';
import { mockStore } from '../../../../__test-helpers/MockStore';

import CoordinateSystemSettingsView from './';

describe('SideBar - SettingsPane - MapTab - CoordinateSystemSettingsView', () => {
  const onOpenMainMapSettingsView = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      data: {},
      view: {
        coordinateReferenceSystems: {
          selectedSystems: Object.values(GPS_FORMATS),
          storedSystems: [],
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  const renderCoordinateSystemSettingsView = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <CoordinateSystemSettingsView onOpenMainMapSettingsView={onOpenMainMapSettingsView} {...props} />
    </Provider>
  );

  test('closes the coordinate system settings view when the user clicks the back button', async () => {
    renderCoordinateSystemSettingsView();

    expect(onOpenMainMapSettingsView).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Go back to main map settings' }));

    expect(onOpenMainMapSettingsView).toHaveBeenCalledTimes(1);
  });
});
