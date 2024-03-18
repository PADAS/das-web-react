import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../../App';
import MapDrawingToolsContextProvider from '../../MapDrawingTools/ContextProvider';
import { createMapMock } from '../../__test-helpers/mocks';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import LocationSelectorInput from './';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { report } from '../../__test-helpers/fixtures/reports';
import { setModalVisibilityState } from '../../ducks/modals';
import { setIsPickingLocation } from '../../ducks/map-ui';
import { cleanup, render, screen, waitFor } from '../../test-utils';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/events' }),
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

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

describe('LocationSelectorInput', () => {
  const onLocationChange = jest.fn();
  let map, rerender, hideSideBarMock, setIsPickingLocationMock, setModalVisibilityStateMock, showSideBarMock, store;
  beforeEach(() => {
    hideSideBarMock = jest.fn(() => () => { });
    hideSideBar.mockImplementation(hideSideBarMock);
    setModalVisibilityStateMock = jest.fn(() => () => { });
    setModalVisibilityState.mockImplementation(setModalVisibilityStateMock);
    showSideBarMock = jest.fn(() => () => { });
    showSideBar.mockImplementation(showSideBarMock);
    setIsPickingLocationMock = jest.fn(() => () => { });
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

    map = createMapMock();
    store = {
      view: {
        mapLocationSelection: { event: report },
        userPreferences: {},
      },
    };

    const output = render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <MapContext.Provider value={map}>
            <LocationSelectorInput
              label="label"
              map={map}
              onLocationChange={onLocationChange}
            />
          </MapContext.Provider>
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    rerender = output.rerender;
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

    await waitFor(() => {
      expect(hideSideBar).toHaveBeenCalledTimes(0);
    });

    const placeMarkerOnMapButton = await screen.getByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    await waitFor(() => {
      expect(hideSideBar).toHaveBeenCalled();
      expect(setModalVisibilityState).toHaveBeenCalled();
      expect(setModalVisibilityState).toHaveBeenCalledWith(false);
    });
  });

  test('shows the sidebar and modal again if user cancels map selection', async () => {
    const setLocationButton = await screen.getByTestId('set-location-button');
    userEvent.click(setLocationButton);

    const placeMarkerOnMapButton = await screen.getByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    await waitFor(() => {
      expect(hideSideBar).toHaveBeenCalledTimes(1);
      expect(setModalVisibilityState).toHaveBeenCalledWith(false);
    });

    userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(showSideBar).toHaveBeenCalled();
      expect(setModalVisibilityState).toHaveBeenCalledWith(true);
    });
  });

  test('showing a placeholder when no value is present', async () => {
    const displayValue = await screen.getByTestId('locationSelectorInput-displayValue');
    expect(displayValue).toHaveTextContent('Set location');
  });

  test('only showing a "copy to clipboard" button when a value is present', async () => {
    await waitFor(() => {
      expect(screen.queryByTestId('textCopyBtn')).not.toBeInTheDocument();
    });

    rerender(<Provider store={mockStore(store)}>
      <MapDrawingToolsContextProvider>
        <MapContext.Provider value={map}>
          <LocationSelectorInput
            label="label"
            location={[10, 10]}
            map={map}
            onLocationChange={onLocationChange}
          />
        </MapContext.Provider>
      </MapDrawingToolsContextProvider>
    </Provider>);

    await waitFor(() => {
      expect(screen.queryByTestId('textCopyBtn')).toBeInTheDocument();
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
        <MapDrawingToolsContextProvider>
          <MapContext.Provider value={map}>
            <LocationSelectorInput map={map} onLocationChange={onLocationChange} />
          </MapContext.Provider>
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    expect((await screen.findByTestId('locationSelectorInput-label'))).toHaveTextContent('Location:');
  });

});
