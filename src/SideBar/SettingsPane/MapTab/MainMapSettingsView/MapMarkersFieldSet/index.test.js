import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen, within } from '../../../../../test-utils';
import { DEFAULT_SHOW_NAMES_IN_MAP_CONFIG } from '../../../../../constants';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { toggleDisplayUserLocation, toggleMapNamesState } from '../../../../../ducks/map-ui';

import MapMarkersFieldSet from './';

jest.mock('../../../../../ducks/map-ui', () => ({
  ...jest.requireActual('../../../../../ducks/map-ui'),
  toggleDisplayUserLocation: jest.fn(),
  toggleMapNamesState: jest.fn(),
}));

describe('SideBar - SettingsPane - MapTab - MainMapSettingsView - MapMarkersFieldSet', () => {
  let store;
  beforeEach(() => {
    toggleDisplayUserLocation.mockImplementation(() => () => {});
    toggleMapNamesState.mockImplementation(() => () => {});

    store = {
      data: {},
      view: {
        showMapNames: DEFAULT_SHOW_NAMES_IN_MAP_CONFIG,
        showUserLocation: true,
        userLocation: null,
      },
    };
  });

  const renderMapMarkersFieldSet = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MapMarkersFieldSet {...props} />
    </Provider>
  );

  test('shows the marker names all checkbox as indeterminate if the marker names are partially checked', async () => {
    renderMapMarkersFieldSet();

    expect(
      within(
        screen.getByRole('group', { name: 'Show names on map markers for' })
      ).getByRole('checkbox', { name: 'All' }).indeterminate
    ).toBe(true);
  });

  test('updates the marker names all setting when user interacts with its checkbox', async () => {
    renderMapMarkersFieldSet();

    expect(toggleMapNamesState).not.toHaveBeenCalled();

    await userEvent.click(
      within(
        screen.getByRole('group', { name: 'Show names on map markers for' })
      ).getByRole('checkbox', { name: 'All' })
    );

    expect(toggleMapNamesState).toHaveBeenCalledTimes(1);
    expect(toggleMapNamesState).toHaveBeenCalledWith({
      event_symbols: { key: 'reports', enabled: true },
      patrol_symbols: { key: 'patrols', enabled: true },
      static_sensor: { key: 'stationary_subjects', enabled: true },
      'subject-symbol-layer': { key: 'subjects', enabled: true },
    });
  });

  test('updates the marker names subjects setting when user interacts with its checkbox', async () => {
    renderMapMarkersFieldSet();

    expect(toggleMapNamesState).not.toHaveBeenCalled();

    await userEvent.click(
      within(
        screen.getByRole('group', { name: 'Show names on map markers for' })
      ).getByRole('checkbox', { name: 'Subjects' })
    );

    expect(toggleMapNamesState).toHaveBeenCalledTimes(1);
    expect(toggleMapNamesState).toHaveBeenCalledWith({
      event_symbols: { key: 'reports', enabled: true },
      patrol_symbols: { key: 'patrols', enabled: true },
      static_sensor: { key: 'stationary_subjects', enabled: false },
      'subject-symbol-layer': { key: 'subjects', enabled: false },
    });
  });

  test('updates the marker names stationary subjects setting when user interacts with its checkbox', async () => {
    renderMapMarkersFieldSet();

    expect(toggleMapNamesState).not.toHaveBeenCalled();

    await userEvent.click(
      within(
        screen.getByRole('group', { name: 'Show names on map markers for' })
      ).getByRole('checkbox', { name: 'Stationary Subjects' })
    );

    expect(toggleMapNamesState).toHaveBeenCalledTimes(1);
    expect(toggleMapNamesState).toHaveBeenCalledWith({
      event_symbols: { key: 'reports', enabled: true },
      patrol_symbols: { key: 'patrols', enabled: true },
      static_sensor: { key: 'stationary_subjects', enabled: true },
      'subject-symbol-layer': { key: 'subjects', enabled: true },
    });
  });

  test('updates the marker names events setting when user interacts with its checkbox', async () => {
    renderMapMarkersFieldSet();

    expect(toggleMapNamesState).not.toHaveBeenCalled();

    await userEvent.click(
      within(
        screen.getByRole('group', { name: 'Show names on map markers for' })
      ).getByRole('checkbox', { name: 'Events' })
    );

    expect(toggleMapNamesState).toHaveBeenCalledTimes(1);
    expect(toggleMapNamesState).toHaveBeenCalledWith({
      event_symbols: { key: 'reports', enabled: false },
      patrol_symbols: { key: 'patrols', enabled: true },
      static_sensor: { key: 'stationary_subjects', enabled: false },
      'subject-symbol-layer': { key: 'subjects', enabled: true },
    });
  });

  test('updates the marker names patrols setting when user interacts with its checkbox', async () => {
    renderMapMarkersFieldSet();

    expect(toggleMapNamesState).not.toHaveBeenCalled();

    await userEvent.click(
      within(
        screen.getByRole('group', { name: 'Show names on map markers for' })
      ).getByRole('checkbox', { name: 'Patrols' })
    );

    expect(toggleMapNamesState).toHaveBeenCalledTimes(1);
    expect(toggleMapNamesState).toHaveBeenCalledWith({
      event_symbols: { key: 'reports', enabled: true },
      patrol_symbols: { key: 'patrols', enabled: false },
      static_sensor: { key: 'stationary_subjects', enabled: false },
      'subject-symbol-layer': { key: 'subjects', enabled: true },
    });
  });

  test('does not show the show user location checkbox if user location is not provided', async () => {
    renderMapMarkersFieldSet();

    expect(screen.queryByRole('checkbox', { name: 'Show my current location' })).toBeNull();
  });

  test('shows the show user location checkbox if user location is provided', async () => {
    store.view.userLocation = {};
    renderMapMarkersFieldSet();

    expect(screen.getByRole('checkbox', { name: 'Show my current location' })).toBeVisible();
  });

  test('updates the show user location setting when user interacts with its checkbox', async () => {
    store.view.userLocation = {};
    renderMapMarkersFieldSet();

    expect(toggleDisplayUserLocation).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Show my current location' }));

    expect(toggleDisplayUserLocation).toHaveBeenCalledTimes(1);
  });
});
