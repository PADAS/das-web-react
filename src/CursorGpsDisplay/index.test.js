import React from 'react';
import merge from 'lodash/merge';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { GPS_FORMATS } from '../utils/location';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { showPopup } from '../ducks/popup';
import useJumpToLocation from '../hooks/useJumpToLocation';

import CursorGpsDisplay from '../CursorGpsDisplay';

jest.mock('../ducks/popup', () => ({
  ...jest.requireActual('../ducks/popup'),
  showPopup: jest.fn(),
}));

jest.mock('../hooks/useJumpToLocation', () => jest.fn());

describe('CursorGpsDisplay', () => {
  let map, jumpToLocationMock, showPopupMock, store;

  const renderCursorGpsDisplay = (props = {}, overrideStore = {}, overrideMap = map) => render(
    <Provider store={mockStore(merge(store, overrideStore))}>
      <NavigationWrapper>
        <MapContext.Provider value={overrideMap}>
          <CursorGpsDisplay {...props} />
        </MapContext.Provider>
      </NavigationWrapper>
    </Provider>
  );

  beforeEach(() => {
    showPopupMock = jest.fn(() => () => {});
    showPopup.mockImplementation(showPopupMock);
    jumpToLocationMock = jest.fn();
    useJumpToLocation.mockImplementation(() => jumpToLocationMock);

    store = {
      data: {},
      view: {
        userPreferences: {
          gpsFormat: Object.values(GPS_FORMATS)[0],
        },
      },
    };

    jest.useFakeTimers();
    map = createMapMock();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('does not bind events if map is not ready', () => {
    renderCursorGpsDisplay(undefined, undefined, null);

    expect(map.on).toHaveBeenCalledTimes(0);
    expect(map.off).toHaveBeenCalledTimes(0);
  });

  test('binds and unbinds mousemove events to the map', () => {
    expect(map.on).toHaveBeenCalledTimes(0);

    const { unmount } = renderCursorGpsDisplay();

    expect(map.on).toHaveBeenCalledTimes(1);
    expect(map.on.mock.calls[0][0]).toBe('mousemove');
    expect(map.off).toHaveBeenCalledTimes(0);

    unmount();

    expect(map.off).toHaveBeenCalledTimes(1);
    expect(map.off.mock.calls[0][0]).toBe('mousemove');
  });

  test('does not render until there are valid cursor coordinates', async () => {
    renderCursorGpsDisplay();

    expect(screen.queryByTestId('cursorGpsDisplay-dropdown')).toBeNull();
  });

  test('renders the dropdown component and the coordinates once there are valid cursor coordinates', async () => {
    renderCursorGpsDisplay();

    map.__test__.fireHandlers('mousemove', { lngLat: { lng: 10.012657, lat: 11.666666 } });

    expect(screen.getByTestId('cursorGpsDisplay-dropdown')).toBeDefined();
    expect(screen.getByText('11.666666°, 10.012657°')).toBeDefined();
  });

  test('jumps to searched coordinates location and shows a marker popup when clicking the search button', () => {
    renderCursorGpsDisplay();

    map.__test__.fireHandlers('mousemove', { lngLat: { lng: 10.012657, lat: 11.666666 } });

    const toggleButton = screen.getByRole('button');
    userEvent.click(toggleButton);
    const input = screen.getByRole('textbox');
    userEvent.type(input, '10.3524°, 10.0022');

    expect(jumpToLocationMock).toHaveBeenCalledTimes(0);
    expect(showPopup).toHaveBeenCalledTimes(0);

    const searchButton = screen.getAllByRole('button')[1];
    userEvent.click(searchButton);

    jest.advanceTimersByTime(50);

    expect(jumpToLocationMock).toHaveBeenCalledTimes(1);
    expect(jumpToLocationMock).toHaveBeenCalledWith([10.0022, 10.3524]);
    expect(showPopup).toHaveBeenCalledTimes(1);
    expect(showPopup).toHaveBeenCalledWith('dropped-marker', {
      coordinates: [10.0022, 10.3524],
      location: { lat: 10.3524, lng: 10.0022 },
      popupAttrsOverride: { offset: [0, 0] },
    });
  });

  test('jumps to searched coordinates location and shows a marker popup when pressing enter', () => {
    renderCursorGpsDisplay();

    map.__test__.fireHandlers('mousemove', { lngLat: { lng: 10.012657, lat: 11.666666 } });

    const toggleButton = screen.getByRole('button');
    userEvent.click(toggleButton);

    expect(jumpToLocationMock).toHaveBeenCalledTimes(0);
    expect(showPopup).toHaveBeenCalledTimes(0);

    const input = screen.getByRole('textbox');
    userEvent.type(input, '10.3524°, 10.0022{enter}');

    jest.advanceTimersByTime(50);

    expect(jumpToLocationMock).toHaveBeenCalledTimes(1);
    expect(jumpToLocationMock).toHaveBeenCalledWith([10.0022, 10.3524]);
    expect(showPopup).toHaveBeenCalledTimes(1);
    expect(showPopup).toHaveBeenCalledWith('dropped-marker', {
      coordinates: [10.0022, 10.3524],
      location: { lat: 10.3524, lng: 10.0022 },
      popupAttrsOverride: { offset: [0, 0] },
    });
  });

  test('does not try to jump or show popup if search bar is empty', () => {
    renderCursorGpsDisplay();

    map.__test__.fireHandlers('mousemove', { lngLat: { lng: 10.012657, lat: 11.666666 } });

    const toggleButton = screen.getByRole('button');
    userEvent.click(toggleButton);

    expect(jumpToLocationMock).toHaveBeenCalledTimes(0);
    expect(showPopup).toHaveBeenCalledTimes(0);

    const input = screen.getByRole('textbox');
    userEvent.type(input, '{enter}');

    jest.advanceTimersByTime(50);

    expect(jumpToLocationMock).toHaveBeenCalledTimes(0);
    expect(showPopup).toHaveBeenCalledTimes(0);

    const searchButton = screen.getAllByRole('button')[1];
    userEvent.click(searchButton);

    jest.advanceTimersByTime(50);

    expect(jumpToLocationMock).toHaveBeenCalledTimes(0);
    expect(showPopup).toHaveBeenCalledTimes(0);
  });

  test('closes the dropdown when clicking outside', async () => {
    renderCursorGpsDisplay();

    map.__test__.fireHandlers('mousemove', { lngLat: { lng: 10.012657, lat: 11.666666 } });

    const toggleButton = screen.getByRole('button');
    userEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    userEvent.click(document.body);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});
