import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen } from '../../../../../test-utils';
import {
  epsg2154,
  epsg2946,
  epsg32633,
  epsg32719,
  epsg3857,
  epsg5367,
} from '../../../../../__test-helpers/fixtures/location';
import { GPS_FORMATS } from '../../../../../utils/location';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import {
  setSelectedCoordinateRepresentations,
  setStoredCoordinateReferenceSystems,
} from '../../../../../ducks/coordinate-reference-systems';
import { updateUserPreferences } from '../../../../../ducks/user-preferences';

import CoordinateRepresentationsSelector from './';

jest.mock('../../../../../ducks/coordinate-reference-systems', () => ({
  ...jest.requireActual('../../../../../ducks/coordinate-reference-systems'),
  setSelectedCoordinateRepresentations: jest.fn(),
  setStoredCoordinateReferenceSystems: jest.fn(),
}));

jest.mock('../../../../../ducks/user-preferences', () => ({
  ...jest.requireActual('../../../../../ducks/user-preferences'),
  updateUserPreferences: jest.fn(),
}));

describe('SideBar - SettingsPane - MapTab - CoordinateSystemSettingsView - CoordinateRepresentationsSelector', () => {
  let store;
  beforeEach(() => {
    setSelectedCoordinateRepresentations.mockImplementation(() => () => {});
    setStoredCoordinateReferenceSystems.mockImplementation(() => () => {});
    updateUserPreferences.mockImplementation(() => () => {});

    store = {
      data: {},
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

  const renderCoorinatesRepresentationsSelector = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <CoordinateRepresentationsSelector {...props} />
    </Provider>
  );

  test('default GPS format options are listed even if they are not stored', async () => {
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'DEG Decimal Degrees' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'DDM Degrees, Decimal Minutes' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'UTM Universal Transverse Mercator' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'MGRS Military Grid Reference System' })).toBeVisible();
  });

  test('shows default GPS format options checked', async () => {
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' })).toBeChecked();
  });

  test('shows default GPS format options unchecked', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [GPS_FORMATS.DEG];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' })).not.toBeChecked();
  });

  test('DEG GPS format option is always disabled', async () => {
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'DEG Decimal Degrees' })).toBeDisabled();
    expect(screen.getByText('DEG Decimal Degrees')).toHaveClass('disabled');
    expect(screen.getByText('Example: -0.15293, 37.30906')).toHaveClass('disabled');
  });

  test('disables default GPS format options if they are unchecked and the limit of choices has been reached', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '4576',
      '5367',
      '26753'
    ];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' })).toBeDisabled();
    expect(screen.getByText('DMS Degrees, Minutes, Seconds')).toHaveClass('disabled');
    expect(screen.getByText('Example: 0 9′ 10.5624″ S, 37 18′ 32.6185″ E')).toHaveClass('disabled');
  });

  test('selected default GPS format options are enabled if they are checked', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '4576',
      '5367',
      '26753',
    ];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'UTM Universal Transverse Mercator' })).toBeEnabled();
    expect(screen.getByText('UTM Universal Transverse Mercator')).not.toHaveClass('disabled');
    expect(screen.getByText('Example: 37 S 311814 9983089')).not.toHaveClass('disabled');
  });

  test('enables default GPS format options if they are unchecked and the limit of choices has not been reached', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.UTM,
      '4576',
      '5367',
    ];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' })).toBeEnabled();
    expect(screen.getByText('DMS Degrees, Minutes, Seconds')).not.toHaveClass('disabled');
    expect(screen.getByText('Example: 0 9′ 10.5624″ S, 37 18′ 32.6185″ E')).not.toHaveClass('disabled');
  });

  test('deselects a coordinates representation when unchecking a default GPS format option', async () => {
    renderCoorinatesRepresentationsSelector();

    expect(setSelectedCoordinateRepresentations).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' }));

    expect(setSelectedCoordinateRepresentations).toHaveBeenCalledTimes(1);
    expect(setSelectedCoordinateRepresentations)
      .toHaveBeenCalledWith([GPS_FORMATS.DEG, GPS_FORMATS.DDM, GPS_FORMATS.UTM, GPS_FORMATS.MGRS]);
  });

  test('sets the GPS format to DEG if the user deselects the coordinates representation option that is the current GPS format', async () => {
    store.view.userPreferences.gpsFormat = GPS_FORMATS.DMS;
    renderCoorinatesRepresentationsSelector();

    expect(updateUserPreferences).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' }));

    expect(updateUserPreferences).toHaveBeenCalledTimes(1);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.DEG });
  });

  test('selects a coordinates representation when checking a default GPS format option', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      GPS_FORMATS.MGRS,
    ];
    renderCoorinatesRepresentationsSelector();

    expect(setSelectedCoordinateRepresentations).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' }));

    expect(setSelectedCoordinateRepresentations).toHaveBeenCalledTimes(1);
    expect(setSelectedCoordinateRepresentations)
      .toHaveBeenCalledWith([GPS_FORMATS.DEG, GPS_FORMATS.DDM, GPS_FORMATS.UTM, GPS_FORMATS.MGRS, GPS_FORMATS.DMS]);
  });

  test('does not show CRS options that are not stored', async () => {
    renderCoorinatesRepresentationsSelector();

    expect(screen.queryByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeNull();
  });

  test('shows a CRS option if it is stored', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeVisible();
  });

  test('shows CRS options checked', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = ['5367'];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeChecked();
  });

  test('shows CRS options unchecked', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).not.toBeChecked();
  });

  test('disables CRS options if they are unchecked and the limit of choices has been reached', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeDisabled();
    expect(screen.getByText('EPSG:5367 CR05 / CRTM05')).toHaveClass('disabled');
  });

  test('selected CRS options are enabled if they are checked', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      '5367',
    ];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeEnabled();
    expect(screen.getByText('EPSG:5367 CR05 / CRTM05')).not.toHaveClass('disabled');
  });

  test('enables CRS options if they are unchecked and the limit of choices has not been reached', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
    ];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeEnabled();
    expect(screen.getByText('EPSG:5367 CR05 / CRTM05')).not.toHaveClass('disabled');
  });

  test('deselects a coordinates representation when unchecking a CRS option', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      '5367',
    ];

    renderCoorinatesRepresentationsSelector();

    expect(setSelectedCoordinateRepresentations).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' }));

    expect(setSelectedCoordinateRepresentations).toHaveBeenCalledTimes(1);
    expect(setSelectedCoordinateRepresentations)
      .toHaveBeenCalledWith([GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, GPS_FORMATS.UTM]);
  });

  test('sets the GPS format to DEG if the user deselects the CRS option that is the current GPS format', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.userPreferences.gpsFormat = '5367';
    renderCoorinatesRepresentationsSelector();

    expect(updateUserPreferences).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' }));

    expect(updateUserPreferences).toHaveBeenCalledTimes(1);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.DEG });
  });

  test('selects a coordinates representation when checking a CRS option', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
    ];
    renderCoorinatesRepresentationsSelector();

    expect(setSelectedCoordinateRepresentations).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' }));

    expect(setSelectedCoordinateRepresentations).toHaveBeenCalledTimes(1);
    expect(setSelectedCoordinateRepresentations)
      .toHaveBeenCalledWith([GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, GPS_FORMATS.UTM, '5367']);
  });

  test('removes a CRS option from the list of stored systems when the user clicks the delete button', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    renderCoorinatesRepresentationsSelector();

    expect(setStoredCoordinateReferenceSystems).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete EPSG:5367 CR05 / CRTM05 from the options' }));

    expect(setStoredCoordinateReferenceSystems).toHaveBeenCalledTimes(1);
    expect(setStoredCoordinateReferenceSystems).toHaveBeenCalledWith([]);
  });

  test('removes a CRS option from the list of stored systems and from the list of selected systems if it was checked when the user clicks the delete button', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      '5367',
    ];
    renderCoorinatesRepresentationsSelector();

    expect(setSelectedCoordinateRepresentations).not.toHaveBeenCalled();
    expect(setStoredCoordinateReferenceSystems).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete EPSG:5367 CR05 / CRTM05 from the options' }));

    expect(setSelectedCoordinateRepresentations).toHaveBeenCalledTimes(1);
    expect(setSelectedCoordinateRepresentations)
      .toHaveBeenCalledWith([GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, GPS_FORMATS.UTM]);
    expect(setStoredCoordinateReferenceSystems).toHaveBeenCalledTimes(1);
    expect(setStoredCoordinateReferenceSystems).toHaveBeenCalledWith([]);
  });

  test('does not show a message if the limit of selected systems has not been reached', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
    ];
    renderCoorinatesRepresentationsSelector();

    expect(screen.queryByText('You have 4 of 4 options selected. Deselect at least 1 option before selecting others.'))
      .toBeNull();
    expect(screen.getByRole('group', { name: 'GPS format selector' }))
      .toHaveAccessibleDescription('Select up to 4 coordinate systems to display across the site. Options will be displayed alphabetically.');
  });

  test('shows a message if the limit of selected systems has been reached', async () => {
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByText('You have 4 of 4 options selected. Deselect at least 1 option before selecting others.'))
      .toBeVisible();
    expect(screen.getByRole('group', { name: 'GPS format selector' }))
      .toHaveAccessibleDescription('Select up to 4 coordinate systems to display across the site. Options will be displayed alphabetically. You have 4 of 4 options selected. Deselect at least 1 option before selecting others.');
  });

  test('does not show a message if the user has not added 6 CRS yet', async () => {
    renderCoorinatesRepresentationsSelector();

    expect(screen.queryByText('You have added 6 coordinate reference systems. Delete at least 1 of them before adding others.'))
      .toBeNull();
  });

  test('shows a message if the limit of selected systems has been reached', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [
      epsg2154,
      epsg2946,
      epsg3857,
      epsg5367,
      epsg32633,
      epsg32719,
    ];
    renderCoorinatesRepresentationsSelector();

    expect(screen.getByText('You have added 6 coordinate reference systems. Delete at least 1 of them before adding others.'))
      .toBeVisible();
  });
});
