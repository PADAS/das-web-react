import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';
import { GPS_FORMATS } from '../utils/location';
import { mockStore } from '../__test-helpers/MockStore';
import { updateUserPreferences } from '../ducks/user-preferences';

import GpsFormatToggle from './';

jest.mock('../ducks/user-preferences', () => ({
  ...jest.requireActual('../ducks/user-preferences'),
  updateUserPreferences: jest.fn(),
}));

describe('GpsFormatToggle', () => {
  let store, updateUserPreferencesMock;
  beforeEach(() => {
    updateUserPreferencesMock = jest.fn(() => () => {});
    updateUserPreferences.mockImplementation(updateUserPreferencesMock);

    store = {
      view: {
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  const renderGpsFormatToggle = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <GpsFormatToggle lat={11.666666} lng={10.012657} name="name" {...props} />
    </Provider>
  );

  test('checks the GPS format option that is currently selected', () => {
    renderGpsFormatToggle();

    expect(screen.getByLabelText(GPS_FORMATS.DEG)).toBeChecked();
    expect(screen.getByText(GPS_FORMATS.DEG)).toHaveClass('active');
    expect(screen.getByLabelText(GPS_FORMATS.DDM)).not.toBeChecked();
    expect(screen.getByText(GPS_FORMATS.DDM)).not.toHaveClass('active');
    expect(screen.getByLabelText(GPS_FORMATS.DMS)).not.toBeChecked();
    expect(screen.getByText(GPS_FORMATS.DMS)).not.toHaveClass('active');
    expect(screen.getByLabelText(GPS_FORMATS.MGRS)).not.toBeChecked();
    expect(screen.getByText(GPS_FORMATS.MGRS)).not.toHaveClass('active');
    expect(screen.getByLabelText(GPS_FORMATS.UTM)).not.toBeChecked();
    expect(screen.getByText(GPS_FORMATS.UTM)).not.toHaveClass('active');
  });

  test('updates the GPS format when clicking an option', () => {
    renderGpsFormatToggle();

    expect(updateUserPreferences).toHaveBeenCalledTimes(0);

    userEvent.click(screen.getByLabelText('DMS'));

    expect(updateUserPreferences).toHaveBeenCalledTimes(1);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.DMS });

    userEvent.click(screen.getByLabelText('UTM'));

    expect(updateUserPreferences).toHaveBeenCalledTimes(2);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.UTM });
  });

  test('shows the GPS string and the copy button if there are valid lat and lng values', () => {
    renderGpsFormatToggle();

    expect(screen.getByText('11.666666°, 10.012657°')).toBeVisible();
    expect(screen.getByLabelText('Copy GPS value to clipboard')).toBeVisible();
  });

  test('does not show either the GPS string nor the copy button if there are not valid lat and lng values set', () => {
    renderGpsFormatToggle({ lat: null, lng: null });

    expect(screen.queryByText('11.666666°, 10.012657°')).toBeNull();
    expect(screen.queryByLabelText('Copy GPS value to clipboard')).toBeNull();
  });

  test('does not show either the GPS string nor the copy button if the showGpsString is false', () => {
    renderGpsFormatToggle({ showGpsString: false });

    expect(screen.queryByText('11.666666°, 10.012657°')).toBeNull();
    expect(screen.queryByLabelText('Copy GPS value to clipboard')).toBeNull();
  });
});
