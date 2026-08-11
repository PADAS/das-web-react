import React from 'react';
import PatrolMenu from './index';
import patrols from '../__test-helpers/fixtures/patrols';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../__test-helpers/MockStore';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { useReactToPrint } from 'react-to-print';

import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../constants';
import { render, screen } from '../test-utils';
import { downloadFileFromUrl } from '../utils/download';

jest.mock('react-to-print', () => ({
  ...jest.requireActual('react-to-print'),
  useReactToPrint: jest.fn(),
}));

jest.mock('../store', () => ({}));

jest.mock('../ducks/tracks', () => ({
  TRACKS_API_URL: (id) => `/api/v1.0/subject/${id}/tracks/`,
}));

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

  test('reaches the copy button with the keyboard', async () => {
    renderPatrolMenu(undefined, storeWithUpdatePermissions);
    await userEvent.click(screen.getByRole('button'));

    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toHaveFocus();
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

  describe('Download Patrol Track button', () => {
    beforeEach(() => {
      downloadFileFromUrl.mockImplementation(() => Promise.resolve());
    });

    // patrols[1] has a leader and a start_time, making it suitable for track tests
    const patrolWithLeader = patrols[1];
    const leaderId = patrolWithLeader.patrol_segments[0].leader.id;
    const patrolStartTime = patrolWithLeader.patrol_segments[0].time_range.start_time;

    const makeTrackStore = (times) => ({
      ...minimumNecessaryStoreStructure,
      data: {
        ...minimumNecessaryStoreStructure.data,
        tracks: {
          [leaderId]: {
            track: {
              features: [{
                properties: { coordinateProperties: { times } },
              }],
            },
          },
        },
      },
    });

    const openMenu = async () => {
      await userEvent.click(screen.getByRole('button'));
    };

    const getDownloadOption = () =>
      screen.getByText('Download Patrol Track').closest('button');

    test('is disabled when patrol has no leader', async () => {
      renderPatrolMenu({ ...initialProps, patrol: patrols[0] });
      await openMenu();
      expect(getDownloadOption()).toBeDisabled();
    });

    test('is disabled when leader has no track in the store', async () => {
      renderPatrolMenu({ ...initialProps, patrol: patrolWithLeader });
      await openMenu();
      expect(getDownloadOption()).toBeDisabled();
    });

    test('is disabled when track has no points within the patrol time range', async () => {
      // All times are before the patrol start_time
      const beforeStart = new Date(new Date(patrolStartTime).getTime() - 60000).toISOString();
      const store = makeTrackStore([beforeStart]);
      renderPatrolMenu({ ...initialProps, patrol: patrolWithLeader }, store);
      await openMenu();
      expect(getDownloadOption()).toBeDisabled();
    });

    test('is enabled when track has points within the patrol time range', async () => {
      // Time is after the patrol start_time
      const afterStart = new Date(new Date(patrolStartTime).getTime() + 60000).toISOString();
      const store = makeTrackStore([afterStart]);
      renderPatrolMenu({ ...initialProps, patrol: patrolWithLeader }, store);
      await openMenu();
      expect(getDownloadOption()).not.toBeDisabled();
    });

    test('calls downloadFileFromUrl with correct url, params, and filename when clicked', async () => {
      const afterStart = new Date(new Date(patrolStartTime).getTime() + 60000).toISOString();
      const store = makeTrackStore([afterStart]);
      renderPatrolMenu({ ...initialProps, patrol: patrolWithLeader }, store);
      await openMenu();

      await userEvent.click(screen.getByText('Download Patrol Track'));

      expect(downloadFileFromUrl).toHaveBeenCalledWith(
        `/api/v1.0/subject/${leaderId}/tracks/`,
        expect.objectContaining({
          params: expect.objectContaining({ since: patrolStartTime }),
          filename: `Patrol_${patrolWithLeader.serial_number}_${patrolWithLeader.patrol_segments[0].leader.name}.geojson`,
        })
      );
    });

    test('passes until param when patrol has an end_time', async () => {
      const patrolEndTime = new Date(new Date(patrolStartTime).getTime() + 3600000).toISOString();
      const trackTime = new Date(new Date(patrolStartTime).getTime() + 1800000).toISOString();
      const patrolWithEndTime = {
        ...patrolWithLeader,
        patrol_segments: [{
          ...patrolWithLeader.patrol_segments[0],
          time_range: { start_time: patrolStartTime, end_time: patrolEndTime },
        }],
      };
      const store = makeTrackStore([trackTime]);
      renderPatrolMenu({ ...initialProps, patrol: patrolWithEndTime }, store);
      await openMenu();

      await userEvent.click(screen.getByText('Download Patrol Track'));

      expect(downloadFileFromUrl).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({ since: patrolStartTime, until: patrolEndTime }),
        })
      );
    });

    test('sanitizes invalid characters in leader name for the filename', async () => {
      const afterStart = new Date(new Date(patrolStartTime).getTime() + 60000).toISOString();
      const patrolWithSpecialName = {
        ...patrolWithLeader,
        patrol_segments: [{
          ...patrolWithLeader.patrol_segments[0],
          leader: { ...patrolWithLeader.patrol_segments[0].leader, name: 'John/Doe:Test' },
        }],
      };
      const store = makeTrackStore([afterStart]);
      renderPatrolMenu({ ...initialProps, patrol: patrolWithSpecialName }, store);
      await openMenu();

      await userEvent.click(screen.getByText('Download Patrol Track'));

      expect(downloadFileFromUrl).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ filename: expect.stringContaining('John_Doe_Test') })
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