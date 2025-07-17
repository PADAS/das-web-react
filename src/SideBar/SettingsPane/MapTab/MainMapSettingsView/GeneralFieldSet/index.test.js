import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen } from '../../../../../test-utils';
import { createMapMock } from '../../../../../__test-helpers/mocks';
import { MapContext } from '../../../../../App';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { toggleMapDataSimplificationOnZoom, toggleMapLockState } from '../../../../../ducks/map-ui';
import { updateUserPreferences } from '../../../../../ducks/user-preferences';

import GeneralFieldSet from './';

jest.mock('../../../../../ducks/map-ui', () => ({
  ...jest.requireActual('../../../../../ducks/map-ui'),
  toggleMapDataSimplificationOnZoom: jest.fn(),
  toggleMapLockState: jest.fn(),
}));

jest.mock('../../../../../ducks/user-preferences', () => {
  const actual = jest.requireActual('../../../../../ducks/user-preferences');

  return {
    ...actual,
    __esModule: true,
    default: actual.default,
    updateUserPreferences: jest.fn(),
  };
});

describe('SideBar - SettingsPane - MapTab - MainMapSettingsView - GeneralFieldSet', () => {
  let map, store;
  beforeEach(() => {
    toggleMapDataSimplificationOnZoom.mockImplementation(() => () => {});
    toggleMapLockState.mockImplementation(() => () => {});
    updateUserPreferences.mockImplementation(() => () => {});

    map = createMapMock();

    store = {
      data: {},
      view: {
        mapIsLocked: false,
        simplifyMapDataOnZoom: {
          enabled: false,
        },
        userPreferences: {
          enable3D: true,
        },
      },
    };
  });

  const renderGeneralFieldSet = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MapContext.Provider value={map}>
        <GeneralFieldSet {...props} />
      </MapContext.Provider>
    </Provider>
  );

  test('updates the lock map setting when user interacts with its checkbox', async () => {
    renderGeneralFieldSet();

    expect(toggleMapLockState).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Lock map' }));

    expect(toggleMapLockState).toHaveBeenCalledTimes(1);
  });

  test('updates the 3D map terrain setting when user interacts with its checkbox', async () => {
    renderGeneralFieldSet();

    expect(updateUserPreferences).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: '3D map terrain' }));

    expect(updateUserPreferences).toHaveBeenCalledTimes(1);
    expect(updateUserPreferences).toHaveBeenCalledWith({ enable3D: false });
  });

  test('updates the simplify map data on zoom setting when user interacts with its checkbox', async () => {
    renderGeneralFieldSet();

    expect(toggleMapDataSimplificationOnZoom).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Simplify map data on zoom' }));

    expect(toggleMapDataSimplificationOnZoom).toHaveBeenCalledTimes(1);
  });
});
