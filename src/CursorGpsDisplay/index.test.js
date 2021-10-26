import React from 'react';
import { Provider } from 'react-redux';

import { GPS_FORMATS } from '../utils/location';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import { within } from '@testing-library/dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CursorGpsDisplay from '../CursorGpsDisplay';
import { MapContext } from '../App';


let store = mockStore({ view: { userPreferences: { gpsFormat: Object.values(GPS_FORMATS)[0] } } });
let map;

beforeEach(() => {
  jest.useFakeTimers();
  map = createMapMock();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('rendering without crashing', () => {
  render(<Provider store={store}>
    <CursorGpsDisplay />
  </Provider>);
});

test('binding events to the map', () => {
  render(<Provider store={store}>
    <MapContext.Provider value={map}>
      <CursorGpsDisplay />
    </MapContext.Provider>
  </Provider>);

  expect(map.on).toHaveBeenCalledTimes(1);

  expect(map.on.mock.calls[0][0]).toBe('mousemove');
});

test('showing coordinates on mouse move', async () => {
  render(<Provider store={store}>
    <MapContext.Provider value={map}>
      <CursorGpsDisplay />
    </MapContext.Provider>
  </Provider>);

  act(() => {
    map.__test__.fireHandlers('mousemove', { lngLat: { lng: 10.012657, lat: 11.666666 } });
  });
  await screen.findByText('11.666666°, 10.012657°');
});

test('showing the GPS format toggler on click', async () => {
  render(<Provider store={store}>
    <MapContext.Provider value={map}>
      <CursorGpsDisplay />
    </MapContext.Provider>
  </Provider>);

  act(() => {
    map.__test__.fireHandlers('mousemove', { lngLat: { lng: 10.012, lat: 11.666 } });
  });

  const toggleBtn = await screen.findByRole('button');
  userEvent.click(toggleBtn);

  const gpsFormatList = await screen.findByRole('list');
  const gpsFormatListItems = await within(gpsFormatList).findAllByRole('listitem');

  expect(gpsFormatListItems.length).toBe(Object.values(GPS_FORMATS).length);
});

