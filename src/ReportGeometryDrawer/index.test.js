import React from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { setIsPickingLocation } from '../ducks/map-ui';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { report } from '../__test-helpers/fixtures/reports';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import ReportGeometryDrawer from './';

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

describe('ReportGeometryDrawer', () => {
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

  const setMapDrawingData = jest.fn();
  let map, setIsPickingLocationMock, store;

  beforeEach(() => {
    jest.useFakeTimers();

    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

    map = createMapMock();

    store = {
      data: { eventTypes: [], patrolTypes: [] },
      view: { mapLocationSelection: { event: report }, reportGeometry: { current: { points: [] }, past: [] } },
    };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('triggers setIsPickingLocation with false parameter if user press escape', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
              <ReportGeometryDrawer />
            </MapDrawingToolsContext.Provider>
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Escape}');

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
  });

  test('enables the save button if user clicks enter after drawing a valid polygon', async () => {
    store.view.reportGeometry.current.points = [[87, 84], [88, 54], [88, 55]];

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
              <ReportGeometryDrawer />
            </MapDrawingToolsContext.Provider>
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveClass('disabled');

    userEvent.keyboard('{Enter}');

    expect(saveButton).not.toHaveClass('disabled');
  });

  test('enables the save button if user double clicks the map after drawing a valid polygon', async () => {
    store.view.reportGeometry.current.points = [[87, 84], [88, 54], [88, 55]];

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
              <ReportGeometryDrawer />
            </MapDrawingToolsContext.Provider>
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveClass('disabled');

    map.__test__.fireHandlers('dblclick', { lngLat: { lng: 87, lat: 55 } });
    jest.advanceTimersByTime(60000);

    await waitFor(() => {
      expect(saveButton).not.toHaveClass('disabled');
    });
  });

  test('disables the save button if user closes an invalid polygon', async () => {
    map.queryRenderedFeatures.mockImplementation(() => []);

    store.view.reportGeometry.current.points = [[87, 84], [88, 54], [88, 55], [86, 52]];

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
              <ReportGeometryDrawer />
            </MapDrawingToolsContext.Provider>
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveClass('disabled');

    userEvent.keyboard('{Enter}');

    expect(saveButton).toHaveClass('disabled');
  });

  test('moves the map to geometry bbox if the event has already on', async () => {
    report.geometry = geometryExample;

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
              <ReportGeometryDrawer />
            </MapDrawingToolsContext.Provider>
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.fitBounds.mock.calls[0][0]).toEqual([-40.668725, -13.74975, 6.657425, 9.301125]);
  });
});
