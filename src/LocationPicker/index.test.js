import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen, waitFor } from '../test-utils';
import { GPS_FORMATS } from '../utils/location';
import useJumpToLocation from '../hooks/useJumpToLocation';
import { mockStore } from '../__test-helpers/MockStore';

import LocationPicker from './';

jest.mock('../hooks/useJumpToLocation', () => jest.fn());

describe('LocationPicker', () => {
  const onChange = jest.fn();

  let jumpToLocationMock, store;
  beforeEach(() => {
    jumpToLocationMock = jest.fn();
    useJumpToLocation.mockImplementation(() => jumpToLocationMock);

    store = {
      view: {
        showUserLocation: false,
        userLocation: null,
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderLocationPicker = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <LocationPicker data-testid="locationPicker" id="locationPicker" onChange={onChange} value={null} {...props} />
    </Provider>
  );

  test('adds a custom class name', () => {
    renderLocationPicker({ className: 'className' });

    expect(screen.getByTestId('locationPicker')).toHaveClass('className');
  });

  test('does not disable the location picker', () => {
    renderLocationPicker({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    const locationPicker = screen.getByTestId('locationPicker');

    expect(locationPicker).not.toHaveClass('disabled');
    expect(screen.getByLabelText('Open the location picker menu to set a value')).not.toBeDisabled();
    expect(screen.getByLabelText('Location')).not.toBeDisabled();
    expect(screen.getByLabelText('Copy location to clipboard')).not.toBeDisabled();
    expect(screen.getByLabelText('Jump to location')).not.toBeDisabled();
  });

  test('disables the location picker', () => {
    renderLocationPicker({
      disabled: true,
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    const locationPicker = screen.getByTestId('locationPicker');

    expect(locationPicker).toHaveClass('disabled');
    expect(screen.getByLabelText('Open the location picker menu to set a value')).toBeDisabled();
    expect(screen.getByLabelText('Location')).toBeDisabled();
    expect(screen.getByLabelText('Copy location to clipboard')).toBeDisabled();
    expect(screen.getByLabelText('Jump to location')).toBeDisabled();
  });

  test('sets the name to an input with the location picker value', () => {
    renderLocationPicker({
      name: 'location-picker-name',
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    const locationPickerInput = screen.getByTestId('locationPicker-input');

    expect(locationPickerInput).toHaveAttribute('name', 'location-picker-name');
    expect(locationPickerInput).toHaveValue('15,10');
  });

  test('blurs the location picker', () => {
    const onBlur = jest.fn();

    renderLocationPicker({ onBlur });

    const locationPicker = screen.getByTestId('locationPicker');
    userEvent.click(locationPicker);

    expect(onBlur).not.toHaveBeenCalled();

    fireEvent.blur(locationPicker);

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('focuses the location picker when focusing one of the inner elements', () => {
    const onFocus = jest.fn();

    renderLocationPicker({ onFocus });

    expect(onFocus).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open the location picker menu to set a value'));

    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  test('shows a default placeholder', () => {
    renderLocationPicker();

    expect(screen.getByLabelText('Location')).toHaveAttribute('placeholder', 'Set Location');
  });

  test('shows a custom placeholder', () => {
    renderLocationPicker({ placeholder: 'placeholder' });

    expect(screen.getByLabelText('Location')).toHaveAttribute('placeholder', 'placeholder');
  });

  test('does not set the location picker as read only', () => {
    renderLocationPicker();

    expect(screen.getByLabelText('Open the location picker menu to set a value')).not.toHaveClass('readOnly');
    expect(screen.getByLabelText('Open the location picker menu to set a value')).not.toBeDisabled();
    expect(screen.getByLabelText('Location')).not.toHaveClass('readOnly');
  });

  test('sets the location picker as read only', () => {
    renderLocationPicker({ readOnly: true });

    expect(screen.getByLabelText('Open the location picker menu to set a value')).toHaveClass('readOnly');
    expect(screen.getByLabelText('Open the location picker menu to set a value')).toBeDisabled();
    expect(screen.getByLabelText('Location')).toHaveClass('readOnly');
  });

  test('does not set the location picker as required', () => {
    renderLocationPicker();

    expect(screen.getByLabelText('Location')).not.toBeRequired();
  });

  test('sets the location picker as required', () => {
    renderLocationPicker({ required: true });

    expect(screen.getByLabelText('Location')).toBeRequired();
  });

  test('forwards the focusing of the input to the set location button', () => {
    renderLocationPicker();

    fireEvent.focus(screen.getByLabelText('Location'));

    expect(screen.getByLabelText('Open the location picker menu to set a value')).toHaveFocus();
  });

  test('shows a display value in the input', () => {
    renderLocationPicker({
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    expect(screen.getByLabelText('Location')).toHaveValue('15.000000°,  10.000000°');
  });

  test('does not show a text copy button if there is no value yet', () => {
    renderLocationPicker();

    expect(screen.queryByLabelText('Copy location to clipboard')).toBeNull();
  });

  test('shows a text copy button if there is a value', () => {
    renderLocationPicker({
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    expect(screen.getByLabelText('Copy location to clipboard')).toBeVisible();
  });

  test('disables the jump to location button if there is no value yet', () => {
    renderLocationPicker();

    expect(screen.getByLabelText('Jump to location')).toBeDisabled();
  });

  test('enables the jump to location button if there is a value', () => {
    renderLocationPicker({
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    expect(screen.getByLabelText('Jump to location')).toBeEnabled();
  });

  test('jumps to the location in the value when the user clicks the jump to location button', () => {
    renderLocationPicker({
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    expect(jumpToLocationMock).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Jump to location'));

    expect(jumpToLocationMock).toHaveBeenCalledTimes(1);
    expect(jumpToLocationMock).toHaveBeenCalledWith([10, 15]);
  });

  test('opens the menu popover', () => {
    renderLocationPicker();

    const setLocationButton = screen.getByLabelText('Open the location picker menu to set a value');

    expect(setLocationButton).toHaveAttribute('aria-expanded', 'false');

    userEvent.click(setLocationButton);

    expect(screen.getByRole('presentation')).toBeVisible();
    expect(setLocationButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('closes the menu popover', async () => {
    renderLocationPicker();

    const setLocationButton = screen.getByLabelText('Open the location picker menu to set a value');
    userEvent.click(setLocationButton);
    const menuPopover = screen.getByRole('presentation');

    expect(menuPopover).toBeVisible();
    expect(setLocationButton).toHaveAttribute('aria-expanded', 'true');

    userEvent.click(setLocationButton);

    expect(setLocationButton).toHaveAttribute('aria-expanded', 'false');

    await waitFor(() => {
      expect(menuPopover).not.toBeVisible();
    });
  });
});
