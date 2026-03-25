import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fetchForwardGeocoding } from '../utils/location';
import { fireEvent, render, screen, waitFor, within } from '../test-utils';
import { epsg5367 } from '../__test-helpers/fixtures/location';
import { GPS_FORMATS } from '../utils/location';
import { mockStore } from '../__test-helpers/MockStore';
import { updateUserPreferences } from '../ducks/user-preferences';

import GpsInput from './';

jest.mock('../utils/location', () => ({
  ...jest.requireActual('../utils/location'),
  fetchForwardGeocoding: jest.fn(() => []),
}));

jest.mock('../ducks/user-preferences', () => ({
  ...jest.requireActual('../ducks/user-preferences'),
  updateUserPreferences: jest.fn(),
}));

describe('GpsInput', () => {
  const onChange = jest.fn();

  let store, updateUserPreferencesMock;
  beforeEach(() => {
    fetchForwardGeocoding.mockImplementation(() => [
      {
        coordinates: {
          latitude: 19.432630,
          longitude: -99.133178,
        },
        name_preferred: 'Mexico City',
        place_formatted: 'Mexico',
      },
      {
        coordinates: {
          latitude: 20.674793,
          longitude: -103.359410,
        },
        name_preferred: 'Guadalajara',
        place_formatted: 'Jalisco, Mexico',
      },
    ]);
    updateUserPreferencesMock = jest.fn(() => () => {});
    updateUserPreferences.mockImplementation(updateUserPreferencesMock);

    store = {
      view: {
        coordinateReferenceSystems: {
          selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
          storedSystems: [],
        },
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

    expect(screen.getByRole('searchbox', { name: 'Search location in DEG format' }))
      .toHaveValue('10.000000°, 10.000000°');
  });

  test('sets the input value as N/A and shows an error if the current coordinates are outside of the BBOX of the current CRS', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.userPreferences.gpsFormat = '5367';
    renderGpsInput({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    const errorMessage = screen.getByText('EPSG:5367 CR05 / CRTM05 is not supported at this location.');

    expect(screen.getByRole('searchbox', { name: 'Search location in CR05 / CRTM05 format' })).toHaveValue('N/A');
    expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    expect(errorMessage).toHaveClass('error');
  });

  test('does not enable the text search', async () => {
    renderGpsInput();

    expect(screen.queryByRole('radio', { name: 'Search by name' })).toBeNull();
  });

  test('enables the text search', async () => {
    renderGpsInput({ showTextSearchOption: true });

    expect(screen.getByRole('radio', { name: 'Search by name' })).toBeVisible();
  });

  test('checks the text search option', async () => {
    renderGpsInput({ showTextSearchOption: true });

    const textSearchOption = screen.getByRole('radio', { name: 'Search by name' });
    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

    expect(textSearchOption).not.toBeChecked();
    expect(gpsInput).not.toHaveAttribute('aria-autocomplete');
    expect(gpsInput).not.toHaveAttribute('aria-controls');
    expect(gpsInput).not.toHaveAttribute('aria-expanded');
    expect(gpsInput).not.toHaveAttribute('role');

    await userEvent.click(textSearchOption);

    expect(textSearchOption).toBeChecked();
    expect(gpsInput).toHaveAttribute('aria-autocomplete', 'list');
    expect(gpsInput).toHaveAttribute('aria-controls');
    expect(gpsInput).toHaveAttribute('aria-expanded', 'false');
    expect(gpsInput).toHaveAttribute('role', 'combobox');
  });

  test('updates the displayed value to the new GPS format when the user changes the toggle', async () => {
    const { rerender } = renderGpsInput({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

    expect(gpsInput).toHaveValue('10.000000°, 10.000000°');

    store.view.userPreferences.gpsFormat = GPS_FORMATS.DDM;
    rerender(
      <Provider store={mockStore({ ...store })}>
        <GpsInput id="gpsInput" onChange={onChange} value={{ latitude: 10, longitude: 10 }} />
      </Provider>
    );

    expect(gpsInput).toHaveValue('10° 00.000000′ N, 010° 00.000000′ E');
  });

  test('clears the displayed value when the user checks the text search option if there was not a selected place yet', async () => {
    renderGpsInput({
      showTextSearchOption: true,
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

    expect(gpsInput).toHaveValue('10.000000°, 10.000000°');

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));

    expect(gpsInput).toHaveValue('');
  });

  test('focuses the text input if the user presses enter from the GPS format toggle', async () => {
    renderGpsInput();

    await userEvent.click(screen.getByLabelText(GPS_FORMATS.DMS));
    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

    expect(gpsInput).not.toHaveFocus();

    await userEvent.keyboard('{Enter}');

    expect(gpsInput).toHaveFocus();
  });

  test('updates the input', async () => {
    renderGpsInput();

    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

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

    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

    expect(gpsInput).toHaveValue('10.000000°, 10.000000°');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.clear(gpsInput);

    expect(gpsInput).toHaveValue('');
    expect(gpsInput).not.toHaveAccessibleErrorMessage();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  test('does not notify a change and shows an error if the user types an invalid value', async () => {
    renderGpsInput();

    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

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

    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

    expect(gpsInput).toHaveValue('');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(gpsInput, '10, 10');

    expect(gpsInput).toHaveValue('10, 10');
    expect(gpsInput).not.toHaveAccessibleErrorMessage();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith({ latitude: 10, longitude: 10 });
  });

  test('fetches the places from the search text when the user types in the input and the text search option is checked', async () => {
    renderGpsInput({ showTextSearchOption: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));
    const gpsInput = screen.getByRole('combobox', { name: 'Search location by name' });

    expect(screen.queryByRole('listbox', { name: 'Location search results' })).toBeNull();
    expect(gpsInput).toHaveAttribute('aria-expanded', 'false');

    await userEvent.type(gpsInput, 'mexico');
    const placesFromSearchTextList = await screen.findByRole('listbox', { name: 'Location search results' });

    expect(placesFromSearchTextList).toBeVisible();
    expect(within(placesFromSearchTextList).getByRole('option', { name: 'Mexico City - Mexico' })).toBeVisible();
    expect(within(placesFromSearchTextList).getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' }))
      .toBeVisible();
    expect(gpsInput).toHaveAttribute('aria-expanded', 'true');
  });

  test('sets the value in the input on blur if the text search option is not checked', async () => {
    renderGpsInput({
      value: {
        latitude: 10,
        longitude: 10,
      },
    });

    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

    expect(gpsInput).toHaveValue('10.000000°, 10.000000°');

    await userEvent.clear(gpsInput);
    await userEvent.type(gpsInput, 'a');

    expect(gpsInput).toHaveValue('a');
    expect(gpsInput).toHaveAccessibleErrorMessage();

    fireEvent.blur(gpsInput);

    expect(gpsInput).toHaveValue('10.000000°, 10.000000°');
    expect(gpsInput).not.toHaveAccessibleErrorMessage();
  });

  test('leaves the input values as is on blur if the text search option is checked', async () => {
    renderGpsInput({ showTextSearchOption: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));
    const gpsInput = screen.getByRole('combobox', { name: 'Search location by name' });
    await userEvent.type(gpsInput, 'mexico');

    expect(gpsInput).toHaveValue('mexico');

    fireEvent.blur(gpsInput);

    expect(gpsInput).toHaveValue('mexico');
  });

  test('sets a default placeholder and label to the input', async () => {
    store.view.userPreferences.gpsFormat = null;
    renderGpsInput();

    expect(screen.getByRole('searchbox', { name: 'Search location' })).toHaveAttribute('placeholder', 'Location');
  });

  test('sets a placeholder, description and label if the text search option is checked', async () => {
    renderGpsInput({ showTextSearchOption: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));
    const gpsInput = screen.getByRole('combobox', { name: 'Search location by name' });

    expect(gpsInput).toHaveAttribute('placeholder', 'Search Location');
    expect(gpsInput).toHaveAccessibleDescription('Search for a location on the map by name');
    expect(screen.getByText('Search for a location on the map by name')).toBeVisible();
  });

  test('hides the description of the combobox when the text search option is checked and there are places fetched', async () => {
    renderGpsInput({ showTextSearchOption: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));
    const gpsInput = screen.getByRole('combobox', { name: 'Search location by name' });
    await userEvent.type(gpsInput, 'mexico');

    await waitFor(() => {
      expect(gpsInput).toHaveAccessibleDescription('Search location by name');
      expect(screen.queryByText('Search for a location on the map by name')).toBeNull();
    });
  });

  test('sets a label and placeholder if the coordinates representation is a CRS and the text search option is not checked', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.userPreferences.gpsFormat = '5367';
    renderGpsInput();

    expect(screen.getByRole('searchbox', { name: 'Search location in CR05 / CRTM05 format' }))
      .toHaveAttribute('placeholder', 'CR05 / CRTM05');
  });

  test('sets a label, description and placeholder if the coordinates representation is a GPS format and the text search option is not checked', async () => {
    renderGpsInput();

    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });

    expect(gpsInput).toHaveAttribute('placeholder', 'Latitude, Longitude');
    expect(gpsInput).toHaveAccessibleDescription('Example: -0.15293, 37.30906');
    expect(screen.getByText('Example: -0.15293, 37.30906')).toBeVisible();
  });

  test('renders a button', async () => {
    renderGpsInput({ renderButton: () => <button data-testid="button">Button</button> });

    expect(screen.getByTestId('button')).toBeVisible();
  });

  test('does not show an input description if the coordinates representation is a GPS format but the value is invalid', async () => {
    renderGpsInput();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search location in DEG format' }), 'a');

    expect(screen.getByRole('searchbox', { name: 'Search location in DEG format' }))
      .toHaveAccessibleDescription('Search location in DEG format');
    expect(screen.queryByText('Example: -0.15293, 37.30906')).toBeNull();
  });

  test('navigates the list of places with the keyboard', async () => {
    renderGpsInput({ showTextSearchOption: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));
    const gpsInput = screen.getByRole('combobox', { name: 'Search location by name' });
    await userEvent.type(gpsInput, 'mexico');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Mexico City - Mexico' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' })).toBeVisible();
    });

    const mexicoCityOption = screen.getByRole('option', { name: 'Mexico City - Mexico' });
    const guadalajaraOption = screen.getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' });

    expect(gpsInput).not.toHaveAttribute('aria-activedescendant');
    expect(mexicoCityOption).not.toHaveClass('active');
    expect(guadalajaraOption).not.toHaveClass('active');

    await userEvent.keyboard('[ArrowDown]');

    expect(gpsInput).toHaveAttribute('aria-activedescendant', 'place-from-search-text-option-0');
    expect(mexicoCityOption).toHaveClass('active');
    expect(guadalajaraOption).not.toHaveClass('active');

    await userEvent.keyboard('[ArrowDown]');

    expect(gpsInput).toHaveAttribute('aria-activedescendant', 'place-from-search-text-option-1');
    expect(mexicoCityOption).not.toHaveClass('active');
    expect(guadalajaraOption).toHaveClass('active');

    await userEvent.keyboard('[ArrowDown]');

    expect(gpsInput).toHaveAttribute('aria-activedescendant', 'place-from-search-text-option-0');
    expect(mexicoCityOption).toHaveClass('active');
    expect(guadalajaraOption).not.toHaveClass('active');

    await userEvent.keyboard('[ArrowUp]');

    expect(gpsInput).toHaveAttribute('aria-activedescendant', 'place-from-search-text-option-1');
    expect(mexicoCityOption).not.toHaveClass('active');
    expect(guadalajaraOption).toHaveClass('active');

    await userEvent.keyboard('[ArrowUp]');

    expect(gpsInput).toHaveAttribute('aria-activedescendant', 'place-from-search-text-option-0');
    expect(mexicoCityOption).toHaveClass('active');
    expect(guadalajaraOption).not.toHaveClass('active');
  });

  test('selects an option from the list of places by focusing it and pressing enter', async () => {
    renderGpsInput({ showTextSearchOption: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));
    const gpsInput = screen.getByRole('combobox', { name: 'Search location by name' });
    await userEvent.type(gpsInput, 'mexico');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Mexico City - Mexico' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' })).toBeVisible();
    });

    const mexicoCityOption = screen.getByRole('option', { name: 'Mexico City - Mexico' });
    const guadalajaraOption = screen.getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' });

    expect(mexicoCityOption).toHaveAttribute('aria-selected', 'false');
    expect(within(mexicoCityOption).queryByTestId('gpsInput-placeFromSearchTextOption-checkLightIcon')).toBeNull();
    expect(guadalajaraOption).toHaveAttribute('aria-selected', 'false');
    expect(within(guadalajaraOption).queryByTestId('gpsInput-placeFromSearchTextOption-checkLightIcon')).toBeNull();
    expect(gpsInput).toHaveValue('mexico');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');  // Focuses the first option
    await userEvent.keyboard('[ArrowDown]');  // Focuses the second option
    await userEvent.keyboard('[Enter]');  // Selects the second option

    expect(mexicoCityOption).toHaveAttribute('aria-selected', 'false');
    expect(within(mexicoCityOption).queryByTestId('gpsInput-placeFromSearchTextOption-checkLightIcon')).toBeNull();
    expect(guadalajaraOption).toHaveAttribute('aria-selected', 'true');
    expect(within(guadalajaraOption).getByTestId('gpsInput-placeFromSearchTextOption-checkLightIcon')).toBeVisible();
    expect(gpsInput).toHaveValue('Guadalajara - Jalisco, Mexico');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ latitude: 20.674793, longitude: -103.35941 });
  });

  test('selects an option from the list of places by clicking it', async () => {
    renderGpsInput({ showTextSearchOption: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));
    const gpsInput = screen.getByRole('combobox', { name: 'Search location by name' });
    await userEvent.type(gpsInput, 'mexico');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Mexico City - Mexico' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' })).toBeVisible();
    });

    const mexicoCityOption = screen.getByRole('option', { name: 'Mexico City - Mexico' });
    const guadalajaraOption = screen.getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' });

    expect(mexicoCityOption).toHaveAttribute('aria-selected', 'false');
    expect(within(mexicoCityOption).queryByTestId('gpsInput-placeFromSearchTextOption-checkLightIcon')).toBeNull();
    expect(guadalajaraOption).toHaveAttribute('aria-selected', 'false');
    expect(within(guadalajaraOption).queryByTestId('gpsInput-placeFromSearchTextOption-checkLightIcon')).toBeNull();
    expect(gpsInput).toHaveValue('mexico');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(guadalajaraOption);

    expect(mexicoCityOption).toHaveAttribute('aria-selected', 'false');
    expect(within(mexicoCityOption).queryByTestId('gpsInput-placeFromSearchTextOption-checkLightIcon')).toBeNull();
    expect(guadalajaraOption).toHaveAttribute('aria-selected', 'true');
    expect(within(guadalajaraOption).getByTestId('gpsInput-placeFromSearchTextOption-checkLightIcon')).toBeVisible();
    expect(gpsInput).toHaveValue('Guadalajara - Jalisco, Mexico');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ latitude: 20.674793, longitude: -103.35941 });
  });

  test('notifies when there is a place selection', async () => {
    const onPlaceSelected = jest.fn();
    renderGpsInput({ onPlaceSelected, showTextSearchOption: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));
    const gpsInput = screen.getByRole('combobox', { name: 'Search location by name' });
    await userEvent.type(gpsInput, 'mexico');

    expect(onPlaceSelected).not.toHaveBeenCalled();

    await waitFor(async () => {
      await userEvent.click(screen.getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' }));
    });

    expect(onPlaceSelected).toHaveBeenCalledTimes(1);
  });

  test('fills the displayed value with the selecte place when the user checks the text search option if there was a selected one', async () => {
    const { rerender } = renderGpsInput({ showTextSearchOption: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));
    const gpsInput = screen.getByRole('combobox', { name: 'Search location by name' });
    await userEvent.type(gpsInput, 'mexico');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Mexico City - Mexico' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' })).toBeVisible();
    });

    await userEvent.click(screen.getByRole('option', { name: 'Guadalajara - Jalisco, Mexico' }));

    expect(gpsInput).toHaveValue('Guadalajara - Jalisco, Mexico');

    rerender(<Provider store={mockStore(store)}>
      <GpsInput
        id="gpsInput"
        onChange={onChange}
        showTextSearchOption
        value={{
          latitude: 20.674793,
          longitude: -103.359410,
        }}
      />
    </Provider>);
    await userEvent.click(screen.getByRole('radio', { name: 'DEG' }));

    expect(gpsInput).toHaveValue('20.674793°, -103.359410°');

    await userEvent.click(screen.getByRole('radio', { name: 'Search by name' }));

    expect(gpsInput).toHaveValue('Guadalajara - Jalisco, Mexico');
  });
});
