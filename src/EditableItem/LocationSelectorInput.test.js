import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { hideSideBar, showSideBar } from '../ducks/side-bar';
import LocationSelectorInput from './LocationSelectorInput';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/reports' }),
}));
jest.mock('../ducks/side-bar', () => ({
  ...jest.requireActual('../ducks/side-bar'),
  hideSideBar: jest.fn(),
  showSideBar: jest.fn(),
}));

describe('LocationSelectorInput', () => {
  let map, hideSideBarMock, showSideBarMock, store;
  beforeEach(() => {
    hideSideBarMock = jest.fn(() => () => {});
    hideSideBar.mockImplementation(hideSideBarMock);
    showSideBarMock = jest.fn(() => () => {});
    showSideBar.mockImplementation(showSideBarMock);
    map = createMapMock();
    store = mockStore({ view: { showUserLocation: true, userPreferences: {} } });

    render(
      <Provider store={store}>
        <NavigationWrapper>
          <LocationSelectorInput map={map} />
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('hides the sidebar when choosing a location in the map', async () => {
    const setLocationButton = await screen.getByRole('link');
    userEvent.click(setLocationButton);

    expect(hideSideBar).toHaveBeenCalledTimes(0);

    const placeMarkerOnMapButton = await screen.getByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    expect(hideSideBar).toHaveBeenCalledTimes(1);
  });

  test('shows the sidebar again if user cancels map selection', async () => {
    const setLocationButton = await screen.getByRole('link');
    userEvent.click(setLocationButton);

    const placeMarkerOnMapButton = await screen.getByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    expect(showSideBar).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(showSideBar).toHaveBeenCalled();
    });
  });
});