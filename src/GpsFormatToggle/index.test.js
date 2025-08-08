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
        coordinateReferenceSystems: {
          selectedSystems: Object.values(GPS_FORMATS),
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
      <GpsFormatToggle lat={11.666666} lng={10.012657} {...props} />
    </Provider>
  );

  test('assigns the name to the radio inputs', async () => {
    renderGpsFormatToggle({ name: 'name' });

    expect(screen.getByRole('radio', { name: 'DEG' })).toHaveAttribute('name', 'name');
    expect(screen.getByRole('radio', { name: 'DMS' })).toHaveAttribute('name', 'name');
    expect(screen.getByRole('radio', { name: 'DDM' })).toHaveAttribute('name', 'name');
    expect(screen.getByRole('radio', { name: 'UTM' })).toHaveAttribute('name', 'name');
    expect(screen.getByRole('radio', { name: 'MGRS' })).toHaveAttribute('name', 'name');
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
    store.view.coordinateReferenceSystems.selectedSystems = [GPS_FORMATS.DEG, GPS_FORMATS.UTM, '5367'];
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
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

  test('shows the GPS string and the copy button if there are valid lat and lng values', async () => {
    renderGpsFormatToggle();

    expect(screen.getByText('11.666666°, 10.012657°')).toBeVisible();
    expect(screen.getByLabelText('Copy GPS value to clipboard')).toBeVisible();
  });

  test('does not show either the GPS string nor the copy button if there are not valid lat and lng values set', async () => {
    renderGpsFormatToggle({ lat: null, lng: null });

    expect(screen.queryByText('11.666666°, 10.012657°')).toBeNull();
    expect(screen.queryByLabelText('Copy GPS value to clipboard')).toBeNull();
  });

  test('does not show either the GPS string nor the copy button if the showGpsString is false', async () => {
    renderGpsFormatToggle({ showGpsString: false });

    expect(screen.queryByText('11.666666°, 10.012657°')).toBeNull();
    expect(screen.queryByLabelText('Copy GPS value to clipboard')).toBeNull();
  });
});
