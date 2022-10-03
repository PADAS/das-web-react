import React from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { addModal } from '../ducks/modals';
import { createMapMock } from '../__test-helpers/mocks';
import { setIsPickingLocation } from '../ducks/map-ui';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { report } from '../__test-helpers/fixtures/reports';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import ReportGeometryDrawer from './';

jest.mock('../ducks/modals', () => ({
  ...jest.requireActual('../ducks/modals'),
  addModal: jest.fn(),
}));

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
  let addModalMock, map, setIsPickingLocationMock, store;
  beforeEach(() => {
    jest.useFakeTimers();

    addModalMock = jest.fn(() => () => {});
    addModal.mockImplementation(addModalMock);
    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

    map = createMapMock();

    store = {
      data: { eventTypes: [], patrolTypes: [] },
      view: { mapLocationSelection: { event: report }, modals: { modals: [] } },
    };

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
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('opens the cancellation confirmation modal when pressing Escape', async () => {
    expect(addModal).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Escape}');

    expect(addModal).toHaveBeenCalledTimes(1);
  });

  test('opens the cancellation confirmation modal when clicking Cancel', async () => {
    expect(addModal).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(addModal).toHaveBeenCalledTimes(1);
  });

  test('shows the information modal', async () => {
    expect((await screen.queryByText('Creating A Report Area'))).toBeNull();

    const informationIcon = await screen.findByText('information.svg');
    userEvent.click(informationIcon);

    expect((await screen.findByText('Creating A Report Area'))).toBeDefined();
  });

  // test('does not trigger setIsPickingLocation if user press escape while a modal is open', async () => {
  //   const informationIcon = await screen.findByText('information.svg');
  //   userEvent.click(informationIcon);

  //   expect(addModal).toHaveBeenCalledTimes(0);

  //   userEvent.keyboard('{Escape}');

  //   expect(addModal).toHaveBeenCalledTimes(0);
  // });

  test('enables the save button if user clicks enter after drawing a valid polygon', async () => {
    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    jest.advanceTimersByTime(60000);

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveClass('disabled');

    userEvent.keyboard('{Enter}');

    expect(saveButton).not.toHaveClass('disabled');
  });

  test('enables the save button if user double clicks the map after drawing a valid polygon', async () => {
    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    jest.advanceTimersByTime(60000);

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

    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 86, lat: 52 } });
    jest.advanceTimersByTime(60000);

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveClass('disabled');

    userEvent.keyboard('{Enter}');

    expect(saveButton).toHaveClass('disabled');
  });

  test('moves the map to geometry bbox if the event has already on', async () => {
    report.geometry = geometryExample;

    cleanup();
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
