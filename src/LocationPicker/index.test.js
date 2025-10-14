import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen, waitFor } from '../test-utils';
import { epsg5367 } from '../__test-helpers/fixtures/location';
import { createMapMock } from '../__test-helpers/mocks';
import { GPS_FORMATS } from '../utils/location';
import useJumpToLocation from '../hooks/useJumpToLocation';
import { mockStore } from '../__test-helpers/MockStore';

import { MapContext } from '../App';

import LocationPicker from './';

jest.mock('../hooks/useJumpToLocation', () => jest.fn());

describe('LocationPicker', () => {
  const onChange = jest.fn();

  let map;

  let jumpToLocationMock, store;
  beforeEach(() => {
    map = createMapMock();
    jumpToLocationMock = jest.fn();
    useJumpToLocation.mockImplementation(() => jumpToLocationMock);

    store = {
      view: {
        coordinateReferenceSystems: {
          selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
          storedSystems: [],
        },
        mapLocationSelection: {
          isPickingLocation: false,
        },
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
      <MapContext.Provider value={map}>
        <LocationPicker data-testid="locationPicker" id="locationPicker" onChange={onChange} value={null} {...props} />
      </MapContext.Provider>
    </Provider>
  );

  test('adds a custom class name', async () => {
    renderLocationPicker({ className: 'className' });

    expect(screen.getByTestId('locationPicker')).toHaveClass('className');
  });

  test('does not disable the location picker', async () => {
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

  test('disables the location picker', async () => {
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

  test('sets the name to an input with the location picker value', async () => {
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

  test('blurs the location picker', async () => {
    const onBlur = jest.fn();

    renderLocationPicker({ onBlur });

    const locationPicker = screen.getByTestId('locationPicker');
    await userEvent.click(locationPicker);

    expect(onBlur).not.toHaveBeenCalled();

    fireEvent.blur(locationPicker);

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('focuses the location picker when focusing one of the inner elements', async () => {
    const onFocus = jest.fn();

    renderLocationPicker({ onFocus });

    expect(onFocus).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Open the location picker menu to set a value'));

    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  test('shows a default placeholder', async () => {
    renderLocationPicker();

    expect(screen.getByLabelText('Location')).toHaveAttribute('placeholder', 'Set Location');
  });

  test('shows a custom placeholder', async () => {
    renderLocationPicker({ placeholder: 'placeholder' });

    expect(screen.getByLabelText('Location')).toHaveAttribute('placeholder', 'placeholder');
  });

  test('does not set the location picker as read only', async () => {
    renderLocationPicker();

    expect(screen.getByLabelText('Open the location picker menu to set a value')).not.toHaveClass('readOnly');
    expect(screen.getByLabelText('Open the location picker menu to set a value')).not.toBeDisabled();
    expect(screen.getByLabelText('Location')).not.toHaveClass('readOnly');
  });

  test('sets the location picker as read only', async () => {
    renderLocationPicker({ readOnly: true });

    expect(screen.getByLabelText('Open the location picker menu to set a value')).toHaveClass('readOnly');
    expect(screen.getByLabelText('Open the location picker menu to set a value')).toBeDisabled();
    expect(screen.getByLabelText('Location')).toHaveClass('readOnly');
  });

  test('does not set the location picker as required', async () => {
    renderLocationPicker();

    expect(screen.getByLabelText('Location')).not.toBeRequired();
  });

  test('sets the location picker as required', async () => {
    renderLocationPicker({ required: true });

    expect(screen.getByLabelText('Location')).toBeRequired();
  });

  test('forwards the focusing of the input to the set location button', async () => {
    renderLocationPicker();

    fireEvent.focus(screen.getByLabelText('Location'));

    expect(screen.getByLabelText('Open the location picker menu to set a value')).toHaveFocus();
  });

  test('shows a display value in the input', async () => {
    renderLocationPicker({
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    expect(screen.getByLabelText('Location')).toHaveValue('15.000000°, 10.000000°');
  });

  test('shows the coordinates in DEG format and a warning tooltip if the coordinates representation is a CRS and the value is outside the BBOX', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.userPreferences.gpsFormat = '5367';
    renderLocationPicker({
      value: {
        latitude: 11.666666,
        longitude: 10.012657,
      },
    });

    const input = screen.getByLabelText('Location');
    const coordinatesOutsideBboxTooltip = screen.getByTestId('locationPicker-valueOutsideBboxTooltip');

    expect(input).toHaveValue('11.666666°, 10.012657°');
    expect(input)
      .toHaveAccessibleDescription('Click the button to set a value from the location picker menu. Location is displayed in DEG format. EPSG:5367 CR05 / CRTM05 is not supported at this location.');
    expect(coordinatesOutsideBboxTooltip).toBeVisible();

    await userEvent.hover(coordinatesOutsideBboxTooltip);

    expect(screen.getByRole('tooltip', {
      name: 'Location is displayed in DEG format. EPSG:5367 CR05 / CRTM05 is not supported at this location.',
    })).toBeVisible();
  });

  test('does not show a text copy button if there is no value yet', async () => {
    renderLocationPicker();

    expect(screen.queryByLabelText('Copy location to clipboard')).toBeNull();
  });

  test('shows a text copy button if there is a value', async () => {
    renderLocationPicker({
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    expect(screen.getByLabelText('Copy location to clipboard')).toBeVisible();
  });

  test('disables the jump to location button if there is no value yet', async () => {
    renderLocationPicker();

    expect(screen.getByLabelText('Jump to location')).toBeDisabled();
  });

  test('enables the jump to location button if there is a value', async () => {
    renderLocationPicker({
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    expect(screen.getByLabelText('Jump to location')).toBeEnabled();
  });

  test('jumps to the location in the value when the user clicks the jump to location button', async () => {
    renderLocationPicker({
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    expect(jumpToLocationMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Jump to location'));

    expect(jumpToLocationMock).toHaveBeenCalledTimes(1);
    expect(jumpToLocationMock).toHaveBeenCalledWith([10, 15], undefined);
  });

  test('jumps to the location with a custom zoom', async () => {
    renderLocationPicker({
      jumpToLocationButtonZoom: 20,
      value: {
        latitude: 15,
        longitude: 10,
      },
    });

    expect(jumpToLocationMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Jump to location'));

    expect(jumpToLocationMock).toHaveBeenCalledTimes(1);
    expect(jumpToLocationMock).toHaveBeenCalledWith([10, 15], 20);
  });

  test('opens the menu popover', async () => {
    renderLocationPicker();

    const setLocationButton = screen.getByLabelText('Open the location picker menu to set a value');

    expect(setLocationButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(setLocationButton);

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(setLocationButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('closes the menu popover', async () => {
    renderLocationPicker();

    const setLocationButton = screen.getByLabelText('Open the location picker menu to set a value');
    await userEvent.click(setLocationButton);
    const menuPopover = screen.getByRole('dialog');

    expect(menuPopover).toBeVisible();
    expect(setLocationButton).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(setLocationButton);

    expect(setLocationButton).toHaveAttribute('aria-expanded', 'false');

    await waitFor(() => {
      expect(menuPopover).not.toBeVisible();
    });
  });
});
