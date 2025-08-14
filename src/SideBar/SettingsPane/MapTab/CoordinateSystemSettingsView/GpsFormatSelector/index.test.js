import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen } from '../../../../../test-utils';
import { GPS_FORMATS } from '../../../../../utils/location';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import {
  setSelectedCoordinateRepresentations,
  setStoredCoordinateReferenceSystems,
} from '../../../../../ducks/coordinate-reference-systems';
import { updateUserPreferences } from '../../../../../ducks/user-preferences';

import GpsFormatSelector from './';

jest.mock('../../../../../ducks/coordinate-reference-systems', () => ({
  ...jest.requireActual('../../../../../ducks/coordinate-reference-systems'),
  setSelectedCoordinateRepresentations: jest.fn(),
  setStoredCoordinateReferenceSystems: jest.fn(),
}));

jest.mock('../../../../../ducks/user-preferences', () => ({
  ...jest.requireActual('../../../../../ducks/user-preferences'),
  updateUserPreferences: jest.fn(),
}));

describe('SideBar - SettingsPane - MapTab - CoordinateSystemSettingsView - GpsFormatSelector', () => {
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

  const renderGpsFormatSelector = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <GpsFormatSelector {...props} />
    </Provider>
  );

  test('shows default GPS format options are listed even if they are not stored', async () => {
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'DEG Decimal Degrees' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'DDM Degrees, Decimal Minutes' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'UTM Universal Transverse Mercator' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'MGRS Military Grid Reference System' })).toBeVisible();
  });

  test('shows default GPS format options checked', async () => {
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' })).toBeChecked();
  });

  test('shows default GPS format options unchecked', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [GPS_FORMATS.DEG];
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' })).not.toBeChecked();
  });

  test('DEG GPS format option is always disabled', async () => {
    renderGpsFormatSelector();

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
    renderGpsFormatSelector();

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
    renderGpsFormatSelector();

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
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' })).toBeEnabled();
    expect(screen.getByText('DMS Degrees, Minutes, Seconds')).not.toHaveClass('disabled');
    expect(screen.getByText('Example: 0 9′ 10.5624″ S, 37 18′ 32.6185″ E')).not.toHaveClass('disabled');
  });

  test('deselects a coordinate reference system when unchecking a default GPS format option', async () => {
    renderGpsFormatSelector();

    expect(setSelectedCoordinateRepresentations).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' }));

    expect(setSelectedCoordinateRepresentations).toHaveBeenCalledTimes(1);
    expect(setSelectedCoordinateRepresentations)
      .toHaveBeenCalledWith([GPS_FORMATS.DEG, GPS_FORMATS.DDM, GPS_FORMATS.UTM, GPS_FORMATS.MGRS]);
  });

  test('sets the GPS format to DEG if the user deselects the GPS format option that is the current GPS format', async () => {
    store.view.userPreferences.gpsFormat = GPS_FORMATS.DMS;
    renderGpsFormatSelector();

    expect(updateUserPreferences).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' }));

    expect(updateUserPreferences).toHaveBeenCalledTimes(1);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.DEG });
  });

  test('selects a coordinate reference system when checking a default GPS format option', async () => {
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      GPS_FORMATS.MGRS,
    ];
    renderGpsFormatSelector();

    expect(setSelectedCoordinateRepresentations).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'DMS Degrees, Minutes, Seconds' }));

    expect(setSelectedCoordinateRepresentations).toHaveBeenCalledTimes(1);
    expect(setSelectedCoordinateRepresentations)
      .toHaveBeenCalledWith([GPS_FORMATS.DEG, GPS_FORMATS.DDM, GPS_FORMATS.UTM, GPS_FORMATS.MGRS, GPS_FORMATS.DMS]);
  });

  test('does not show CRS GPS format options that are not stored', async () => {
    renderGpsFormatSelector();

    expect(screen.queryByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeNull();
  });

  test('shows a CRS GPS format options if it is stored', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeVisible();
  });

  test('shows CRS GPS format options checked', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = ['5367'];
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeChecked();
  });

  test('shows CRS GPS format options unchecked', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).not.toBeChecked();
  });

  test('disables CRS GPS format options if they are unchecked and the limit of choices has been reached', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeDisabled();
    expect(screen.getByText('EPSG:5367 CR05 / CRTM05')).toHaveClass('disabled');
  });

  test('selected default GPS format options are enabled if they are checked', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      '5367',
    ];
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeEnabled();
    expect(screen.getByText('EPSG:5367 CR05 / CRTM05')).not.toHaveClass('disabled');
  });

  test('enables default GPS format options if they are unchecked and the limit of choices has not been reached', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
    ];
    renderGpsFormatSelector();

    expect(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' })).toBeEnabled();
    expect(screen.getByText('EPSG:5367 CR05 / CRTM05')).not.toHaveClass('disabled');
  });

  test('deselects a coordinate reference system when unchecking a CRS GPS format option', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      '5367',
    ];

    renderGpsFormatSelector();

    expect(setSelectedCoordinateRepresentations).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' }));

    expect(setSelectedCoordinateRepresentations).toHaveBeenCalledTimes(1);
    expect(setSelectedCoordinateRepresentations)
      .toHaveBeenCalledWith([GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, GPS_FORMATS.UTM]);
  });

  test('sets the GPS format to DEG if the user deselects the GPS format option that is the current GPS format', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      '5367',
    ];
    store.view.userPreferences.gpsFormat = '5367';
    renderGpsFormatSelector();

    expect(updateUserPreferences).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' }));

    expect(updateUserPreferences).toHaveBeenCalledTimes(1);
    expect(updateUserPreferences).toHaveBeenCalledWith({ gpsFormat: GPS_FORMATS.DEG });
  });

  test('selects a coordinate reference system when checking a CRS GPS format option', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
    ];
    renderGpsFormatSelector();

    expect(setSelectedCoordinateRepresentations).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'EPSG:5367 CR05 / CRTM05' }));

    expect(setSelectedCoordinateRepresentations).toHaveBeenCalledTimes(1);
    expect(setSelectedCoordinateRepresentations)
      .toHaveBeenCalledWith([GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, GPS_FORMATS.UTM, '5367']);
  });

  test('removes a CRS GPS format option from the list of stored systems when the user clicks the delete button', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    renderGpsFormatSelector();

    expect(setStoredCoordinateReferenceSystems).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete EPSG:5367 CR05 / CRTM05 from the options' }));

    expect(setStoredCoordinateReferenceSystems).toHaveBeenCalledTimes(1);
    expect(setStoredCoordinateReferenceSystems).toHaveBeenCalledWith([]);
  });

  test('removes a CRS GPS format option from the list of stored systems and from the list of selected systems if it was checked when the user clicks the delete button', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 11.77, -81.43, 2.21],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = [
      GPS_FORMATS.DEG,
      GPS_FORMATS.DMS,
      GPS_FORMATS.DDM,
      GPS_FORMATS.UTM,
      '5367',
    ];
    renderGpsFormatSelector();

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
    renderGpsFormatSelector();

    expect(screen.queryByText('You have 4 of 4 options selected. Deselect at least 1 option before selecting others.'))
      .toBeNull();
  });

  test('shows a message if the limit of selected systems has been reached', async () => {
    renderGpsFormatSelector();

    expect(screen.getByText('You have 4 of 4 options selected. Deselect at least 1 option before selecting others.'))
      .toBeVisible();
  });
});
