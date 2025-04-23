import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen } from '../test-utils';
import { GPS_FORMATS } from '../utils/location';
import { mockStore } from '../__test-helpers/MockStore';
import { updateUserPreferences } from '../ducks/user-preferences';

import GpsInput from './';

jest.mock('../ducks/user-preferences', () => ({
  ...jest.requireActual('../ducks/user-preferences'),
  updateUserPreferences: jest.fn(),
}));

describe('GpsInput', () => {
  const onChange = jest.fn();

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

  const renderGpsInput = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <GpsInput id="gpsInput" onChange={onChange} {...props} />
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the value by default in the input formatted to the current GPS location', async () => {
    renderGpsInput({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    expect(screen.getByLabelText('GPS location')).toHaveValue('10.000000°,  10.000000°');
  });

  test('updates the displayed value to the new GPS format when the user changes the toggle', async () => {
    const { rerender } = renderGpsInput({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    const gpsInput = screen.getByLabelText('GPS location');

    expect(gpsInput).toHaveValue('10.000000°,  10.000000°');

    store.view.userPreferences.gpsFormat = GPS_FORMATS.DDM;
    rerender(
      <Provider store={mockStore({ ...store })}>
        <GpsInput id="gpsInput" onChange={onChange} value={{ latitude: 10, longitude: 10 }} />
      </Provider>
    );

    expect(gpsInput).toHaveValue('10° 00.000000′ N, 010° 00.000000′ E');
  });

  test('focuses the text input if the user presses enter from the GPS format toggle', async () => {
    renderGpsInput();

    await userEvent.click(screen.getByLabelText(GPS_FORMATS.DMS));
    const gpsInput = screen.getByLabelText('GPS location');

    expect(gpsInput).not.toHaveFocus();

    await userEvent.keyboard('{Enter}');

    expect(gpsInput).toHaveFocus();
  });

  test('updates the input', async () => {
    renderGpsInput();

    const gpsInput = screen.getByLabelText('GPS location');

    expect(gpsInput).toHaveValue('');

    await userEvent.type(gpsInput, '123');

    expect(gpsInput).toHaveValue('123');
  });

  test('notifies a change when the user clears the input', async () => {
    renderGpsInput({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    const gpsInput = screen.getByLabelText('GPS location');

    expect(gpsInput).toHaveValue('10.000000°,  10.000000°');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.clear(gpsInput);

    expect(gpsInput).toHaveValue('');
    expect(gpsInput).not.toHaveAccessibleErrorMessage();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  test('does not notify a change and shows an error if the user types an invalid value', async () => {
    renderGpsInput();

    const gpsInput = screen.getByLabelText('GPS location');

    expect(gpsInput).toHaveValue('');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(gpsInput, 'a');

    expect(gpsInput).toHaveValue('a');
    expect(gpsInput).toHaveAccessibleErrorMessage('Invalid location');
    expect(onChange).not.toHaveBeenCalled();

    const errorMessage = screen.getByText('Invalid location');

    expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    expect(errorMessage).toHaveClass('error');
  });

  test('notifies a change when the user types a valid GPS value', async () => {
    renderGpsInput();

    const gpsInput = screen.getByLabelText('GPS location');

    expect(gpsInput).toHaveValue('');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(gpsInput, '10, 10');

    expect(gpsInput).toHaveValue('10, 10');
    expect(gpsInput).not.toHaveAccessibleErrorMessage();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith({ latitude: 10, longitude: 10 });
  });

  test('sets the value in the input on blur', async () => {
    renderGpsInput({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    const gpsInput = screen.getByLabelText('GPS location');

    expect(gpsInput).toHaveValue('10.000000°,  10.000000°');

    await userEvent.clear(gpsInput);
    await userEvent.type(gpsInput, 'a');

    expect(gpsInput).toHaveValue('a');
    expect(gpsInput).toHaveAccessibleErrorMessage();

    fireEvent.blur(gpsInput);

    expect(gpsInput).toHaveValue('10.000000°,  10.000000°');
    expect(gpsInput).not.toHaveAccessibleErrorMessage();
  });

  test('sets a default placeholder to the input', async () => {
    store.view.userPreferences.gpsFormat = null;
    renderGpsInput();

    expect(screen.getByLabelText('GPS location')).toHaveAttribute('placeholder', 'Location');
  });

  test('sets a placeholder based on the GPS format', async () => {
    renderGpsInput();

    expect(screen.getByLabelText('GPS location')).toHaveAttribute('placeholder', 'Latitude, Longitude');
  });

  test('renders a button', async () => {
    renderGpsInput({ renderButton: () => <button data-testid="button">Button</button> });

    expect(screen.getByTestId('button')).toBeVisible();
  });

  test('shows an input description based on the GPS format', async () => {
    renderGpsInput();

    expect(screen.getByLabelText('GPS location')).toHaveAccessibleDescription('Example: -0.15293, 37.30906');

    const description = screen.getByText('Example: -0.15293, 37.30906');

    expect(description).toHaveAttribute('aria-live', 'off');
    expect(description).not.toHaveClass('error');
  });
});
