import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import merge from 'lodash/merge';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { GPS_FORMATS } from '../utils/location';
import { mockStore } from '../__test-helpers/MockStore';
import { updateUserPreferences } from '../ducks/user-preferences';

import GpsFormatToggle from '../GpsFormatToggle';

jest.mock('../ducks/user-preferences', () => ({
  ...jest.requireActual('../ducks/user-preferences'),
  updateUserPreferences: jest.fn(),
}));

describe('GpsFormatToggle', () => {
  let store, updateUserPreferencesMock;

  const renderGpsFormatToggle = (props = {}, overrideStore = {}) => render(
    <Provider store={mockStore(merge(store, overrideStore))}>
      <GpsFormatToggle lat={11.666666} lng={10.012657} {...props} />
    </Provider>
  );

  beforeEach(() => {
    updateUserPreferencesMock = jest.fn(() => () => {});
    updateUserPreferences.mockImplementation(updateUserPreferencesMock);

    store = {
      data: {},
      view: {
        userPreferences: {
          gpsFormat: Object.values(GPS_FORMATS)[0],
        },
      },
    };
  });

  test('updates the GPS format in the user preferences when clicking one', () => {
    renderGpsFormatToggle();

    expect(updateUserPreferences).toHaveBeenCalledTimes(0);

    const gpsDMSFormatItem = screen.getByText('DMS');
    userEvent.click(gpsDMSFormatItem);

    expect(updateUserPreferences).toHaveBeenCalledTimes(1);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.DMS });

    const gpsUTMFormatItem = screen.getByText('UTM');
    userEvent.click(gpsUTMFormatItem);

    expect(updateUserPreferences).toHaveBeenCalledTimes(2);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.UTM });
  });

  test('does not show the GPS string', () => {
    renderGpsFormatToggle({ showGpsString: false });

    const gpsString = screen.queryByTestId('gpsFormatToggle-gpsString');

    expect(gpsString).toBeNull();
  });

  test('shows the GPS string with the given coordinates in the specified format', () => {
    renderGpsFormatToggle();

    let gpsString = screen.getByTestId('gpsFormatToggle-gpsString');

    expect(gpsString).toHaveTextContent('11.666666°, 10.012657°');

    cleanup();
    renderGpsFormatToggle(undefined, {
      view: {
        userPreferences: {
          gpsFormat: Object.values(GPS_FORMATS)[2],
        },
      },
    });

    gpsString = screen.getByTestId('gpsFormatToggle-gpsString');

    expect(gpsString).toHaveTextContent('11° 39.999960′ N, 010° 00.759420′ E');
  });

  test('does not show the copy button', () => {
    renderGpsFormatToggle({ showCopyControl: false });

    const copyButton = screen.queryByTestId('textCopyBtn');

    expect(copyButton).toBeNull();
  });

  test('shows the copy button', () => {
    renderGpsFormatToggle();

    const copyButton = screen.getByTestId('textCopyBtn');

    expect(copyButton).toBeDefined();
  });
});
