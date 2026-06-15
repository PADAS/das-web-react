import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { act, cleanup, render, screen, waitFor } from '../test-utils';
import { createMapMock } from '../__test-helpers/mocks';
import { setIsPickingLocation } from '../ducks/map-ui';
import { MapContext } from '../MapContext';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import { mockStore } from '../__test-helpers/MockStore';
import { report } from '../__test-helpers/fixtures/reports';
import ReportGeometryDrawer from './';

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Popup: class {
    addTo() {}
    on() {}
    remove() {}
    setDOMContent() {}
    setLngLat() {}
    setOffset() {}
  },
}));

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

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

describe('ReportGeometryDrawer', () => {
  const setMapDrawingData = jest.fn();
  let map, setIsPickingLocationMock, store;
  beforeEach(() => {
    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

    map = createMapMock();
    map.queryRenderedFeatures.mockImplementation(() => []);

    store = {
      data: { eventStore: { [report.id]: report }, eventTypes: [], patrolTypes: [] },
      view: { mapLocationSelection: { event: report }, modals: { modals: [] } },
    };

    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
            <ReportGeometryDrawer />
          </MapDrawingToolsContext.Provider>
        </MapContext.Provider>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the information modal', async () => {
    expect((await screen.queryByText('Creating A Report Area'))).toBeNull();

    const informationIcon = await screen.findByTestId('information-icon');
    await userEvent.click(informationIcon);

    expect((await screen.findByText('Creating An Event Area'))).toBeDefined();
  });

  test('opens the cancellation confirmation modal when pressing Escape if user made a change', async () => {
    jest.useFakeTimers();

    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());

    jest.useRealTimers();

    expect((await screen.queryByText('Discard Changes'))).toBeNull();

    await userEvent.keyboard('{Escape}');

    expect((await screen.findByText('Discard Changes'))).toBeDefined();
  });

  test('opens the cancellation confirmation modal when clicking Cancel if user made a change', async () => {
    jest.useFakeTimers();

    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());

    jest.useRealTimers();

    expect((await screen.queryByText('Discard Changes'))).toBeNull();

    const cancelButton = await screen.findByText('Cancel');
    await userEvent.click(cancelButton);

    expect((await screen.findByText('Discard Changes'))).toBeDefined();
  });

  test('does not open the cancellation confirmation modal if user did not make a change', async () => {
    expect((await screen.queryByText('Discard Changes'))).toBeNull();
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);

    await userEvent.keyboard('{Escape}');

    expect((await screen.queryByText('Discard Changes'))).toBeNull();
    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
  });

  test('does not open the cancellation confirmation modal if there is another modal showing', async () => {
    const informationIcon = await screen.findByTestId('information-icon');
    await userEvent.click(informationIcon);

    expect((await screen.queryByText('Discard Changes'))).toBeNull();

    await userEvent.keyboard('{Escape}');

    expect((await screen.queryByText('Discard Changes'))).toBeNull();
  });

  test('disables the save button while the user has not close the polygon', async () => {
    expect((await screen.findByText('Save'))).toHaveClass('disabled');
  });

  test('enables the save button if user clicks enter after drawing a polygon', async () => {
    jest.useFakeTimers();

    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    act(() => jest.runOnlyPendingTimers());

    jest.useRealTimers();

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveClass('disabled');

    await userEvent.keyboard('{Enter}');

    expect(saveButton).not.toHaveClass('disabled');
  });

  test('enables the save button if user double clicks the map after drawing a polygon', async () => {
    jest.useFakeTimers();

    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    act(() => jest.runOnlyPendingTimers());

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveClass('disabled');

    map.__test__.fireHandlers('dblclick', { lngLat: { lng: 87, lat: 55 } });
    act(() => jest.runOnlyPendingTimers());

    await waitFor(() => {
      expect(saveButton).not.toHaveClass('disabled');
    });

    jest.useRealTimers();
  });

  test('enables the save button if user clicks the initial point after drawing a polygon', async () => {
    jest.useFakeTimers();

    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    act(() => jest.runOnlyPendingTimers());

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveClass('disabled');

    map.queryRenderedFeatures.mockImplementation(() => [{ properties: { pointIndex: 0 } }]);
    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());

    await waitFor(() => {
      expect(saveButton).not.toHaveClass('disabled');
    });

    jest.useRealTimers();
  });

  test('disables the save button if user closes an invalid polygon', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
            <ReportGeometryDrawer />
          </MapDrawingToolsContext.Provider>
        </MapContext.Provider>
      </Provider>
    );

    jest.useFakeTimers();

    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 86, lat: 52 } });
    act(() => jest.runOnlyPendingTimers());

    jest.useRealTimers();

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveClass('disabled');

    await userEvent.keyboard('{Enter}');

    expect(saveButton).toHaveClass('disabled');
  });

  test('sets to false the pickingLocation flag when saving', async () => {
    jest.useFakeTimers();

    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    act(() => jest.runOnlyPendingTimers());
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    act(() => jest.runOnlyPendingTimers());

    jest.useRealTimers();

    await userEvent.keyboard('{Enter}');

    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    await userEvent.click(saveButton);

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
  });

  test('moves the map to geometry bbox if the event has already one', async () => {
    report.geometry = geometryExample;

    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
            <ReportGeometryDrawer />
          </MapDrawingToolsContext.Provider>
        </MapContext.Provider>
      </Provider>
    );

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.fitBounds.mock.calls[0][0]).toEqual([-40.668725, -13.74975, 6.657425, 9.301125]);

    report.geometry = null;
  });
});
