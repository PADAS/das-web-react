import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen } from '../../../../test-utils';
import { GPS_FORMATS } from '../../../../utils/location';
import { mockStore } from '../../../../__test-helpers/MockStore';

import CoordinateSettingsView from './';

describe('SideBar - SettingsPane - MapTab - CoordinateSettingsView', () => {
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
      },
    };
  });

  const renderCoordinateSettingsView = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <CoordinateSettingsView onOpenMainMapSettingsView={onOpenMainMapSettingsView} {...props} />
    </Provider>
  );

  test('closes the coordinate settings view when the user clicks the back button', async () => {
    renderCoordinateSettingsView();

    expect(onOpenMainMapSettingsView).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Go back to main map settings' }));

    expect(onOpenMainMapSettingsView).toHaveBeenCalledTimes(1);
  });
});
