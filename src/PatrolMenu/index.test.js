import React from 'react';
import PatrolMenu from './index';
import patrols from '../__test-helpers/fixtures/patrols';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../__test-helpers/MockStore';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { useReactToPrint } from 'react-to-print';

import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../constants';
import { PATROLS_API_URL } from '../ducks/patrols';
import { render, screen } from '../test-utils';
import { downloadFileFromUrl } from '../utils/download';

jest.mock('react-to-print', () => ({
  ...jest.requireActual('react-to-print'),
  useReactToPrint: jest.fn(),
}));

jest.mock('../store', () => ({}));

jest.mock('../utils/download', () => ({
  downloadFileFromUrl: jest.fn(() => Promise.resolve()),
}));

describe('PatrolMenu', () => {

  let useReactToPrintMock = null;
  const handlePrint = jest.fn();
  const testPatrol = { ...patrols[0] };
  const initialProps = {
    isPatrolCancelled: false,
    patrol: testPatrol,
    onPatrolChange: () => {},
    patrolState: null,
    patrolTitle: 'This is a patrol',
    showPatrolPrintOption: true
  };

  const minimumNecessaryStoreStructure = {
    data: {
      patrolTypes,
      patrolStore: patrols.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
      tracks: {},
    },
    view: {
      systemConfig: {
        [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
      },
    },
  };

  const storeWithUpdatePermissions = {
    ...minimumNecessaryStoreStructure,
    data: {
      ...minimumNecessaryStoreStructure.data,
      user: {
        permissions: {
          [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE]
        },
      }
    }
  };

  const renderPatrolMenu = (props = initialProps, store = minimumNecessaryStoreStructure) => {
    return render(
      <Provider store={mockStore(store)}>
        <PatrolMenu {...props} />
      </Provider>
    );
  };

  const renderMenuWithCancelledPatrol = (props = {}) => renderPatrolMenu({
    ...initialProps,
    ...props,
    patrol: {
      ...testPatrol,
      state: 'cancelled'
    }
  }, storeWithUpdatePermissions);

  const testMinimumOptionsMenu = () => {
    expect( screen.getByText('Copy patrol link') ).toBeInTheDocument();
    expect( screen.getByTestId('clip-icon') ).toBeInTheDocument();
    expect( screen.getByText('Print Patrol') ).toBeInTheDocument();
    expect( screen.getByTestId('printer-icon') ).toBeInTheDocument();
  };

  beforeEach(() => {
    useReactToPrintMock = jest.fn(() => handlePrint);
    useReactToPrint.mockImplementation(useReactToPrintMock);
  });

  test('renders minimum menu options for a patrol', async () => {
    renderPatrolMenu();
    await userEvent.click(screen.getByRole('button'));

    testMinimumOptionsMenu();
  });

  test('prints the patrol details', async () => {
    renderPatrolMenu();
    await userEvent.click(screen.getByRole('button'));
    expect(handlePrint).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByText('Print Patrol'));

    expect(handlePrint).toHaveBeenCalledTimes(1);
  });

  test('renders menu options for a patrol with update permissions', async () => {
    renderPatrolMenu(undefined, storeWithUpdatePermissions);

    await userEvent.click(screen.getByRole('button'));

    testMinimumOptionsMenu();
    expect( screen.getByText('Cancel Patrol') ).toBeInTheDocument();
    expect( screen.getByTestId('close-icon') ).toBeInTheDocument();
    expect( screen.getByText('Start Patrol') ).toBeInTheDocument();
    expect( screen.getByTestId('play-icon') ).toBeInTheDocument();
  });

  test('renders restore menu option for a cancelled patrol', async () => {
    renderMenuWithCancelledPatrol();
    await userEvent.click(screen.getByRole('button'));

    testMinimumOptionsMenu();
    expect( screen.getByTestId('close-icon') ).toBeInTheDocument();
    expect( screen.getByText('Restore Patrol') ).toBeInTheDocument();
  });

  test('restores a cancelled patrol using menu option', async () => {
    const onPatrolChange = jest.fn();
    renderMenuWithCancelledPatrol({ onPatrolChange });

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Restore Patrol'));

    expect(onPatrolChange).toHaveBeenCalledWith({
      patrol_segments: [{ time_range: { end_time: null } }],
      state: 'open'
    });
  });

  describe('Export Patrol options', () => {
    beforeEach(() => {
      downloadFileFromUrl.mockImplementation(() => Promise.resolve());
    });

    const openMenu = async () => {
      await userEvent.click(screen.getByRole('button'));
    };

    const getExportGeoJsonOption = () =>
      screen.getByText('Export Patrol GeoJson').closest('a');

    const getExportCsvOption = () =>
      screen.getByText('Export Patrol CSV').closest('a');

    test('both options are disabled when the patrol has no id', async () => {
      renderPatrolMenu({ ...initialProps, patrol: { ...testPatrol, id: undefined } });
      await openMenu();
      expect(getExportGeoJsonOption()).toHaveClass('disabled');
      expect(getExportCsvOption()).toHaveClass('disabled');
    });

    test('both options are enabled when the patrol has an id', async () => {
      renderPatrolMenu({ ...initialProps, patrol: testPatrol });
      await openMenu();
      expect(getExportGeoJsonOption()).not.toHaveClass('disabled');
      expect(getExportCsvOption()).not.toHaveClass('disabled');
    });

    test('GeoJson option calls downloadFileFromUrl with the geojson url, params, and filename when clicked', async () => {
      renderPatrolMenu({ ...initialProps, patrol: testPatrol });
      await openMenu();

      await userEvent.click(screen.getByText('Export Patrol GeoJson'));

      expect(downloadFileFromUrl).toHaveBeenCalledWith(
        `${PATROLS_API_URL}${testPatrol.id}`,
        expect.objectContaining({
          params: expect.objectContaining({
            format: 'geojson',
            include_events: true,
            include_tracks: true,
          }),
          filename: `Patrol_${testPatrol.serial_number}.geojson`,
        })
      );
    });

    test('CSV option calls downloadFileFromUrl with the csv url, params, and filename when clicked', async () => {
      renderPatrolMenu({ ...initialProps, patrol: testPatrol });
      await openMenu();

      await userEvent.click(screen.getByText('Export Patrol CSV'));

      expect(downloadFileFromUrl).toHaveBeenCalledWith(
        `${PATROLS_API_URL}${testPatrol.id}`,
        expect.objectContaining({
          params: { format: 'csv' },
          filename: `Patrol_${testPatrol.serial_number}.csv`,
        })
      );
    });
  });

  test('starts a patrol using menu option', async () => {
    const mockedDate = '2024-03-06T17:59:49.837Z';
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(mockedDate));

    const onPatrolChange = jest.fn();
    renderPatrolMenu({ ...initialProps, onPatrolChange }, storeWithUpdatePermissions);

    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Start Patrol'));

    expect(onPatrolChange).toHaveBeenCalledWith({
      patrol_segments: [{ time_range: { end_time: null, start_time: mockedDate } }],
      state: 'open'
    });

    jest.useRealTimers();
  });
});