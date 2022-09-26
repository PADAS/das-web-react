import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../../App';
import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { createMapMock } from '../../__test-helpers/mocks';
import { hideSideBar, showSideBar } from '../../ducks/side-bar';
import LocationSelectorInput from './';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { report } from '../../__test-helpers/fixtures/reports';
import { setModalVisibilityState } from '../../ducks/modals';
import { setIsPickingLocation } from '../../ducks/map-ui';

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

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

describe('LocationSelectorInput', () => {
  const geometryExample = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [6.657425, 9.301125],
          [-40.668725, 5.047775],
          [5.0602, -13.74975]
        ]
      ]
    }
  };

  const onLocationChange = jest.fn(), onGeometryChange = jest.fn();
  let map, hideSideBarMock, setIsPickingLocationMock, setModalVisibilityStateMock, showSideBarMock, store;
  beforeEach(() => {
    hideSideBarMock = jest.fn(() => () => {});
    hideSideBar.mockImplementation(hideSideBarMock);
    setModalVisibilityStateMock = jest.fn(() => () => {});
    setModalVisibilityState.mockImplementation(setModalVisibilityStateMock);
    showSideBarMock = jest.fn(() => () => {});
    showSideBar.mockImplementation(showSideBarMock);
    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

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
          <MapDrawingToolsContextProvider>
            <MapContext.Provider value={map}>
              <LocationSelectorInput
                label="label"
                map={map}
                onGeometryChange={onGeometryChange}
                onLocationChange={onLocationChange}
              />
            </MapContext.Provider>
          </MapDrawingToolsContextProvider>
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
          <MapDrawingToolsContextProvider>
            <MapContext.Provider value={map}>
              <LocationSelectorInput map={map} onLocationChange={onLocationChange} />
            </MapContext.Provider>
          </MapDrawingToolsContextProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findByTestId('locationSelectorInput-label'))).toHaveTextContent('Location:');
  });

  test('sets is picking location to true if user starts to create an area', async () => {
    const setLocationButton = await screen.getByTestId('set-location-button');
    userEvent.click(setLocationButton);

    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);

    const placeGeometryOnMapButton = await screen.getByTitle('Place geometry on map');
    userEvent.click(placeGeometryOnMapButton);

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
  });

  test('deletes the report area if user clicks delete area button', async () => {
    report.geometry = geometryExample;

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapDrawingToolsContextProvider>
            <MapContext.Provider value={map}>
              <LocationSelectorInput
                map={map}
                onGeometryChange={onGeometryChange}
                onLocationChange={onLocationChange}
              />
            </MapContext.Provider>
          </MapDrawingToolsContextProvider>
        </NavigationWrapper>
      </Provider>
    );

    const setLocationButton = await screen.getByTestId('set-location-button');
    userEvent.click(setLocationButton);

    expect(onGeometryChange).toHaveBeenCalledTimes(0);

    const deleteAreaButton = await screen.getByTitle('Delete area button');
    userEvent.click(deleteAreaButton);

    expect(onGeometryChange).toHaveBeenCalledTimes(1);
    expect(onGeometryChange).toHaveBeenCalledWith(null);
  });

  test('saves the report area if user is not picking location and there is data in the drawing map context', async () => {
    const fillPolygon = { type: 'Feature' };
    const setMapDrawingData = jest.fn();

    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapDrawingToolsContext.Provider value={{ mapDrawingData: { fillPolygon }, setMapDrawingData }}>
            <MapContext.Provider value={map}>
              <LocationSelectorInput
                map={map}
                onGeometryChange={onGeometryChange}
                onLocationChange={onLocationChange}
              />
            </MapContext.Provider>
          </MapDrawingToolsContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(onGeometryChange).toHaveBeenCalledTimes(1);
    expect(onGeometryChange).toHaveBeenCalledWith(fillPolygon);
    expect(setMapDrawingData).toHaveBeenCalledTimes(1);
    expect(setMapDrawingData).toHaveBeenCalledWith(null);
  });
});
