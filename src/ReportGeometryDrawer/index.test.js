import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { setIsPickingLocation } from '../ducks/map-ui';
import { MapContext } from '../App';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { report } from '../__test-helpers/fixtures/reports';
import ReportGeometryDrawer from './';
import { setGeometryPoints } from '../ducks/report-geometry';
import { reset, undo } from '../reducers/undoable';

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

jest.mock('../ducks/report-geometry', () => ({
  ...jest.requireActual('../ducks/report-geometry'),
  setGeometryPoints: jest.fn(),
}));

jest.mock('../reducers/undoable', () => ({
  ...jest.requireActual('../reducers/undoable'),
  __esModule: true,
  reset: jest.fn(),
  undo: jest.fn(),
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
  let map, resetMock, setIsPickingLocationMock, setGeometryPointsMock, store, undoMock;

  beforeEach(() => {
    jest.useFakeTimers();

    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);
    setGeometryPointsMock = jest.fn(() => () => {});
    setGeometryPoints.mockImplementation(setGeometryPointsMock);
    resetMock = jest.fn(() => () => {});
    reset.mockImplementation(resetMock);
    undoMock = jest.fn(() => () => {});
    undo.mockImplementation(undoMock);

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

  test('moves the map to geometry bbox if the event has already one', async () => {
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

  test('cleans the polygon if user clicks discard', async () => {
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

    expect(setGeometryPoints).toHaveBeenCalledTimes(1);

    const discardButton = await screen.findByText('Discard');
    userEvent.click(discardButton);

    expect(setGeometryPoints).toHaveBeenCalledTimes(2);
    expect(setGeometryPoints).toHaveBeenCalledWith([]);
  });

  test('triggers undo', async () => {
    store.view.reportGeometry.current.points = [[87, 84], [88, 54], [88, 55]];
    store.view.reportGeometry.past = [{ points: [[87, 84], [88, 54]] }];

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

    expect(undo).toHaveBeenCalledTimes(0);

    const undoButton = await screen.findByText('Undo');
    userEvent.click(undoButton);

    expect(undo).toHaveBeenCalledTimes(1);
  });

  test('triggers undo if user clicks backspace while drawing', async () => {
    map.queryRenderedFeatures.mockImplementation(() => []);

    report.geometry = null;

    store.view.reportGeometry.current.points = [[87, 84], [88, 54], [88, 55]];
    store.view.reportGeometry.past = [{ points: [[87, 84], [88, 54]] }];

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

    expect(undo).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Backspace}');

    expect(undo).toHaveBeenCalledTimes(1);
  });
});
