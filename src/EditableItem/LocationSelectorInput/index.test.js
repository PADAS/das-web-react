import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../../App';
import { createMapMock } from '../../__test-helpers/mocks';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import LocationSelectorInput from './';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { report } from '../../__test-helpers/fixtures/reports';
import { setModalVisibilityState } from '../../ducks/modals';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/reports' }),
}));

jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { ENABLE_EVENT_GEOMETRY: true },
}));

jest.mock('../../ducks/side-bar', () => ({
  ...jest.requireActual('../../ducks/side-bar'),
  hideSideBar: jest.fn(),
  showSideBar: jest.fn(),
}));

jest.mock('../../ducks/modals', () => ({
  ...jest.requireActual('../../ducks/modals'),
  setModalVisibilityState: jest.fn(),
}));

describe('LocationSelectorInput', () => {
  const onLocationChange = jest.fn();
  let map, hideSideBarMock, setModalVisibilityStateMock, showSideBarMock, store;
  beforeEach(() => {
    hideSideBarMock = jest.fn(() => () => {});
    hideSideBar.mockImplementation(hideSideBarMock);
    setModalVisibilityStateMock = jest.fn(() => () => {});
    setModalVisibilityState.mockImplementation(setModalVisibilityStateMock);
    showSideBarMock = jest.fn(() => () => {});
    showSideBar.mockImplementation(showSideBarMock);

    map = createMapMock();
    store = {
      view: {
        mapLocationSelection: { event: report },
        userPreferences: {},
      },
    };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <LocationSelectorInput label="label" map={map} onLocationChange={onLocationChange} />
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('opens the popover when clicking location', async () => {
    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const setLocationButton = await screen.getByTestId('set-location-button');
    userEvent.click(setLocationButton);

    expect((await screen.findByRole('tooltip'))).toBeDefined();
  });

  test('closes the popover when clicking location again', async () => {
    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const setLocationButton = await screen.getByTestId('set-location-button');
    userEvent.click(setLocationButton);

    expect((await screen.findByRole('tooltip'))).toBeDefined();

    userEvent.click(setLocationButton);

    await waitFor(async () => {
      expect((await screen.queryByRole('tooltip'))).toBeNull();
    });
  });

  test('closes the popover when pressing escape', async () => {
    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const setLocationButton = await screen.getByTestId('set-location-button');
    userEvent.click(setLocationButton);

    expect((await screen.findByRole('tooltip'))).toBeDefined();

    userEvent.keyboard('{Escape}');

    await waitFor(async () => {
      expect((await screen.queryByRole('tooltip'))).toBeNull();
    });
  });

  test('hides the sidebar and the modal when choosing a location in the map', async () => {
    const setLocationButton = await screen.getByTestId('set-location-button');
    userEvent.click(setLocationButton);

    expect(hideSideBar).toHaveBeenCalledTimes(0);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(1);

    const placeMarkerOnMapButton = await screen.getByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    await waitFor(() => {
      expect(hideSideBar).toHaveBeenCalledTimes(1);
      expect(setModalVisibilityState).toHaveBeenCalledTimes(2);
      expect(setModalVisibilityState).toHaveBeenCalledWith(false);
    });
  });

  test('shows the sidebar and modal again if user cancels map selection', async () => {
    const setLocationButton = await screen.getByTestId('set-location-button');
    userEvent.click(setLocationButton);

    const placeMarkerOnMapButton = await screen.getByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    expect(showSideBar).toHaveBeenCalledTimes(1);
    expect(setModalVisibilityState).toHaveBeenCalledTimes(2);

    userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(showSideBar).toHaveBeenCalledTimes(3);
      expect(setModalVisibilityState).toHaveBeenCalledWith(true);
    });
  });

  test('triggers onLocationChange with map coordinates if user chooses a location in map', async () => {
    const setLocationButton = await screen.getByTestId('set-location-button');
    userEvent.click(setLocationButton);

    const placeMarkerOnMapButton = await screen.getByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    map.__test__.fireHandlers('click', { lngLat: { lng: 987, lat: 654 } });

    expect(onLocationChange).toHaveBeenCalledTimes(1);
    expect(onLocationChange).toHaveBeenCalledWith([987, 654]);
    await waitFor(async () => {
      expect((await screen.queryByRole('tooltip'))).toBeNull();
    });
  });

  test('renders the label', async () => {
    expect((await screen.findByTestId('locationSelectorInput-label'))).toHaveTextContent('label');
  });

  test('renders the label default value', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <LocationSelectorInput map={map} onLocationChange={onLocationChange} />
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findByTestId('locationSelectorInput-label'))).toHaveTextContent('Location:');
  });
});
