import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor } from '../test-utils';
import { createMapMock } from '../__test-helpers/mocks';
import { GPS_FORMATS } from '../utils/location';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import { showPopup } from '../ducks/popup';
import useJumpToLocation from '../hooks/useJumpToLocation';

import CursorGpsDisplay from '.';

jest.mock('../ducks/popup', () => ({
  ...jest.requireActual('../ducks/popup'),
  showPopup: jest.fn(),
}));

jest.mock('../hooks/useJumpToLocation', () => jest.fn());

describe('CursorGpsDisplay', () => {
  let map, jumpToLocationMock, showPopupMock, store;
  beforeEach(() => {
    showPopupMock = jest.fn(() => () => {});
    showPopup.mockImplementation(showPopupMock);
    jumpToLocationMock = jest.fn();
    useJumpToLocation.mockImplementation(() => jumpToLocationMock);

    store = {
      data: {},
      view: {
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };

    map = createMapMock();
  });

  const renderCursorGpsDisplay = (props, overrideStore, overrideMap = map) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MapContext.Provider value={overrideMap}>
        <CursorGpsDisplay {...props} />
      </MapContext.Provider>
    </Provider>
  );

  test('does not track the cursor coordinates if the map is not ready', () => {
    renderCursorGpsDisplay(undefined, undefined, null);

    expect(map.on).toHaveBeenCalledTimes(0);
    expect(map.off).toHaveBeenCalledTimes(0);
  });

  test('tracks the cursor coordinates', () => {
    expect(map.on).toHaveBeenCalledTimes(0);

    const { unmount } = renderCursorGpsDisplay();

    expect(map.on).toHaveBeenCalledTimes(1);
    expect(map.on.mock.calls[0][0]).toBe('mousemove');
    expect(map.off).toHaveBeenCalledTimes(0);

    unmount();

    expect(map.off).toHaveBeenCalledTimes(1);
    expect(map.off.mock.calls[0][0]).toBe('mousemove');
  });

  test('shows the cursor GPS display with the cursor coordinates', () => {
    renderCursorGpsDisplay();

    map.__test__.fireHandlers('mousemove', { lngLat: { lng: 10.012657, lat: 11.666666 } });

    expect(screen.getByLabelText('Open the GPS display menu')).toHaveTextContent(('11.666666°, 10.012657°'));
  });

  test('opens the menu', () => {
    renderCursorGpsDisplay();

    expect(screen.queryByRole('presentation')).toBeNull();

    userEvent.click(screen.getByLabelText('Open the GPS display menu'));

    expect(screen.getByRole('presentation')).toBeVisible();
  });

  test('closes the menu', async () => {
    renderCursorGpsDisplay();

    const button = screen.getByLabelText('Open the GPS display menu');
    userEvent.click(button);
    const menu = screen.getByRole('presentation');

    expect(menu).toBeVisible();

    userEvent.click(button);

    await waitFor(() => {
      expect(menu).not.toBeVisible();
    });
  });
});
