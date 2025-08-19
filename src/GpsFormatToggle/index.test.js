import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../test-utils';
import { epsg5367 } from '../__test-helpers/fixtures/location';
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

  const renderGpsFormatToggle = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <GpsFormatToggle lngLat={{ latitude: 11.666666, longitude: 10.012657 }} {...props} />
    </Provider>
  );

  test('sorts the radio inputs alphabetically', async () => {
    renderGpsFormatToggle({ name: 'name' });

    const radiogroup = screen.getByRole('radiogroup', { name: 'GPS format' });
    const radioInputs = within(radiogroup).getAllByRole('radio');

    expect(radioInputs).toHaveLength(5);
    expect(radioInputs[0]).toHaveAttribute('value', 'DDM');
    expect(radioInputs[1]).toHaveAttribute('value', 'DEG');
    expect(radioInputs[2]).toHaveAttribute('value', 'DMS');
    expect(radioInputs[3]).toHaveAttribute('value', 'MGRS');
    expect(radioInputs[4]).toHaveAttribute('value', 'UTM');
  });

  test('assigns the name to the radio inputs', async () => {
    renderGpsFormatToggle({ name: 'name' });

    const radiogroup = screen.getByRole('radiogroup', { name: 'GPS format' });
    const radioInputs = within(radiogroup).getAllByRole('radio');

    expect(radioInputs).toHaveLength(5);
    expect(radioInputs[0]).toHaveAttribute('name', 'name');
    expect(radioInputs[1]).toHaveAttribute('name', 'name');
    expect(radioInputs[2]).toHaveAttribute('name', 'name');
    expect(radioInputs[3]).toHaveAttribute('name', 'name');
    expect(radioInputs[4]).toHaveAttribute('name', 'name');
  });

  test('checks the GPS format option that is currently selected', async () => {
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

  test('updates the GPS format when clicking an option', async () => {
    renderGpsFormatToggle();

    expect(updateUserPreferences).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByLabelText('DMS'));

    expect(updateUserPreferences).toHaveBeenCalledTimes(1);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.DMS });

    await userEvent.click(screen.getByLabelText('UTM'));

    expect(updateUserPreferences).toHaveBeenCalledTimes(2);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.UTM });
  });

  test('sets the label text and title for a coordinate reference system', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.userPreferences.gpsFormat = '5367';
    renderGpsFormatToggle();

    const crs5367Label = screen.getByText('CR05 / CRTM05');

    expect(crs5367Label).toBeVisible();
    expect(crs5367Label).toHaveAttribute('title', 'CR05 / CRTM05');
    expect(screen.getByLabelText('CR05 / CRTM05')).toBeChecked();
  });

  test('sets the label text and title for a GPS format', async () => {
    renderGpsFormatToggle();

    const degGpsFormatLabel = screen.getByText(GPS_FORMATS.DEG);

    expect(degGpsFormatLabel).toBeVisible();
    expect(degGpsFormatLabel).toHaveAttribute('title', GPS_FORMATS.DEG);
    expect(screen.getByLabelText(GPS_FORMATS.DEG)).toBeChecked();
  });

  test('shows the label as invalid for a coordinate reference system if the lngLat is outside its BBOX', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    renderGpsFormatToggle();

    expect(screen.getByText('CR05 / CRTM05')).toHaveClass('invalid');
  });

  test('does not show the label as invalid for a coordinate reference system if the lngLat is inside its BBOX', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    renderGpsFormatToggle({ lngLat: { latitude: 9.638124, longitude: -83.491398 } });

    expect(screen.getByText('CR05 / CRTM05')).not.toHaveClass('invalid');
  });

  test('shows the coordinates and the copy button if there are valid lat and lng values', async () => {
    renderGpsFormatToggle();

    expect(screen.getByText('11.666666°, 10.012657°')).toBeVisible();
    expect(screen.getByLabelText('Copy GPS value to clipboard')).toBeVisible();
  });

  test('shows the coordinates in a CRS format and the copy button if the lngLat is within the BBOX', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.userPreferences.gpsFormat = '5367';
    renderGpsFormatToggle({ lngLat: { latitude: 9.638124, longitude: -83.491398 } });

    expect(screen.getByText('555818.832808, 1065762.823243')).toBeVisible();
    expect(screen.getByLabelText('Copy GPS value to clipboard')).toBeVisible();
  });

  test('shows the coordinates in DEG format and a warning tooltip if the lngLat is outside the CRS BBOX', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.userPreferences.gpsFormat = '5367';
    renderGpsFormatToggle();

    const coordinatesString = screen.getByText('11.666666°, 10.012657°');
    const coordinatesOutsideBboxTooltipButton =
      screen.getByTestId('gpsFormatToggle-coordinatesOutsideBboxTooltipButton');

    expect(coordinatesString).toBeVisible();
    expect(coordinatesString)
      .toHaveAccessibleDescription('Location is displayed in DEG format. EPSG:5367 CR05 / CRTM05 is not supported at this location.');
    expect(coordinatesOutsideBboxTooltipButton).toBeVisible();

    await userEvent.hover(coordinatesOutsideBboxTooltipButton);

    expect(screen.getByRole('tooltip', {
      name: 'Location is displayed in DEG format. EPSG:5367 CR05 / CRTM05 is not supported at this location.',
    })).toBeVisible();
  });

  test('does not show either the GPS string nor the copy button if the lngLat value is not set set', async () => {
    renderGpsFormatToggle({ lngLat: null });

    expect(screen.queryByText('11.666666°, 10.012657°')).toBeNull();
    expect(screen.queryByLabelText('Copy GPS value to clipboard')).toBeNull();
  });

  test('does not show either the GPS string nor the copy button if the showCoordinates is false', async () => {
    renderGpsFormatToggle({ showCoordinates: false });

    expect(screen.queryByText('11.666666°, 10.012657°')).toBeNull();
    expect(screen.queryByLabelText('Copy GPS value to clipboard')).toBeNull();
  });
});
