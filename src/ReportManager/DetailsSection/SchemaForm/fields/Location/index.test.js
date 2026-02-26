import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../test-utils';
import { GPS_FORMATS } from '../../../../../utils/location';
import { createMapMock } from '../../../../../__test-helpers/mocks';
import { mockStore } from '../../../../../__test-helpers/MockStore';

import Location from './';
import { MapContext } from '../../../../../App';

jest.mock('../../../../../hooks/useJumpToLocation', () => () => () => { });

describe('ReportManager - DetailsSection - SchemaForm - fields - Location', () => {
  const blurLocationMarker = jest.fn();
  const focusLocationMarker = jest.fn();
  const onFieldChange = jest.fn();

  let details, store, map;
  beforeEach(() => {
    map = createMapMock();
    details = {
      description: 'Location 1 Description',
      isRequired: false,
      label: 'Location 1 Label',
      value: 'location-1',
    };

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

  const renderLocationField = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MapContext.Provider value={map}>
        <Location
          blurLocationMarker={blurLocationMarker}
          details={details}
          error={undefined}
          focusLocationMarker={focusLocationMarker}
          id="location-1"
          onFieldChange={onFieldChange}
          value={undefined}
          {...props}
        />
      </MapContext.Provider>
    </Provider>
  );

  test('shows a non read only location field', () => {
    renderLocationField();

    expect(screen.getByRole('group')).not.toHaveClass('readOnly');
  });

  test('shows a read only location field', () => {
    renderLocationField({ readOnly: true });

    expect(screen.getByRole('group')).toHaveClass('readOnly');
  });

  test('shows a non required location field', () => {
    renderLocationField();

    expect(screen.getByText('Location 1 Label')).toBeVisible();
    expect(screen.getByLabelText('Location 1 Label')).not.toBeRequired();
  });

  test('shows a required location field', () => {
    details.isRequired = true;
    renderLocationField();

    expect(screen.getByText('Location 1 Label *')).toBeVisible();
    expect(screen.getByLabelText('Location 1 Label *')).toBeRequired();
  });

  test('does not show an error state in the label if the value is valid', () => {
    renderLocationField();

    expect(screen.getByText('Location 1 Label')).not.toHaveClass('error');
  });

  test('shows an error state in the label if the value is invalid', () => {
    renderLocationField({ error: { message: 'Error' } });

    expect(screen.getByText('Location 1 Label')).toHaveClass('error');
  });

  test('does not show the description', () => {
    details.description = '';
    renderLocationField();

    expect(screen.queryByText('Location 1 Description')).toBeNull();
    expect(screen.getByLabelText('Location 1 Label')).not.toHaveAccessibleDescription();
  });

  test('shows the description', () => {
    renderLocationField();

    const description = screen.getByText('Location 1 Description');

    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'off');
    expect(description).not.toHaveClass('error');
    expect(screen.getByLabelText('Location 1 Label')).toHaveAccessibleDescription('Location 1 Description');
  });

  test('shows a valid input when there are no errors', () => {
    renderLocationField();

    const locationPicker = screen.getByLabelText('Location 1 Label');

    expect(locationPicker).toBeValid();
    expect(locationPicker).not.toHaveAccessibleErrorMessage();
  });

  test('shows an invalid input when there are errors', () => {
    renderLocationField({ error: { message: 'Error' } });

    const locationPicker = screen.getByLabelText('Location 1 Label');
    const description = screen.getByText('Error');

    expect(locationPicker).toBeInvalid();
    expect(locationPicker).toHaveAccessibleErrorMessage('Error');
    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'assertive');
    expect(description).toHaveClass('error');
  });

  test('focuses the corresponding location marker when the user focuses the location picker', async () => {
    renderLocationField({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    expect(focusLocationMarker).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Jump to location'));

    expect(focusLocationMarker).toHaveBeenCalledTimes(1);
    expect(focusLocationMarker).toHaveBeenCalledWith('location-1');
  });

  test('updates the form data when the user does changes to the input', async () => {
    details.defaultInput = '';
    renderLocationField();

    await userEvent.click(screen.getByLabelText('Open the location picker menu to set a value'));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search location in DEG format' }), '10,10');

    expect(onFieldChange).toHaveBeenCalledTimes(2);
    expect(onFieldChange).toHaveBeenCalledWith('location-1', { latitude: 10, longitude: 10 });
  });

  test('blurs the location marker when the user blurs the location picker', async () => {
    renderLocationField({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    await userEvent.click(screen.getByLabelText('Jump to location'));

    expect(blurLocationMarker).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Location 1 Description'));

    expect(blurLocationMarker).toHaveBeenCalledTimes(1);
  });

  test('blurs the location marker when component unmounts', async () => {
    const { unmount } = renderLocationField({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    expect(blurLocationMarker).not.toHaveBeenCalled();

    unmount();

    expect(blurLocationMarker).toHaveBeenCalledTimes(1);
  });
});
