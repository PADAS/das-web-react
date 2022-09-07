import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { setIsPickingLocation } from '../ducks/map-ui';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { report } from '../__test-helpers/fixtures/reports';
import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import ReportGeometryDrawer from './';

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

describe('ReportGeometryDrawer', () => {
  const setMapDrawingData = jest.fn();
  let map, setIsPickingLocationMock, store;

  beforeEach(() => {
    jest.useFakeTimers();

    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

    map = createMapMock();

    store = {
      data: { eventTypes: [], patrolTypes: [] },
      view: { mapLocationSelection: { event: report } },
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

  test('triggers setIsPickingLocation with false parameter if user press escape', async () => {
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Escape}');

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
  });

  test('enables the save button if user clicks enter after drawing a valid polygon', async () => {
    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    jest.advanceTimersByTime(60000);

    const saveButton = await screen.findByText('Save');

    expect(saveButton).toHaveAttribute('disabled');

    userEvent.keyboard('{Enter}');

    expect(saveButton).not.toHaveAttribute('disabled');
  });

  test('sets the map drawing data in context when user clicks save', async () => {
    map.__test__.fireHandlers('click', { lngLat: { lng: 87, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 54 } });
    jest.advanceTimersByTime(60000);
    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });
    jest.advanceTimersByTime(60000);

    userEvent.keyboard('{Enter}');

    expect(setMapDrawingData).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(setMapDrawingData).toHaveBeenCalledTimes(1);
    expect(setMapDrawingData.mock.calls[0][0]).toHaveProperty('drawnLinePoints');
  });
});
