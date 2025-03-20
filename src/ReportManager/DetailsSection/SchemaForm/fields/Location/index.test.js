import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../test-utils';
import { GPS_FORMATS } from '../../../../../utils/location';
import { mockStore } from '../../../../../__test-helpers/MockStore';

import Location from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Location', () => {
  const onFieldChange = jest.fn();

  let details, store;
  beforeEach(() => {
    details = {
      description: 'Location 1 Description',
      isRequired: false,
      label: 'Location 1 Label',
      value: 'location-1',
    };

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

  const renderLocationField = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <Location
        details={details}
        error={undefined}
        id="location-1"
        onFieldChange={onFieldChange}
        value={undefined}
        {...props}
      />
    </Provider>
  );

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

  test('updates the form data when the user does changes to the input', async () => {
    details.defaultInput = '';
    renderLocationField();

    await userEvent.click(screen.getByLabelText('Open the location picker menu to set a value'));
    await userEvent.type(screen.getByLabelText('GPS location'), '10,10');

    expect(onFieldChange).toHaveBeenCalledTimes(2);
    expect(onFieldChange).toHaveBeenCalledWith('location-1', { latitude: 10, longitude: 10 });
  });
});
