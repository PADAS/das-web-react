import React from 'react';
import PatrolMenu from './index';
import patrols from '../__test-helpers/fixtures/patrols';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../__test-helpers/MockStore';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { useReactToPrint } from 'react-to-print';

import { PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { render, screen } from '../test-utils';

jest.mock('react-to-print', () => ({
  ...jest.requireActual('react-to-print'),
  useReactToPrint: jest.fn(),
}));

describe('<PatrolMenu />', () => {

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
      patrolStore: patrols.reduce((p, acc = {}) => ({ ...acc, [p.id]: p })),
    }
  };

  const storeWithUpdatePermissions = {
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
    expect( screen.getByText('link.svg') ).toBeInTheDocument();
    expect( screen.getByText('Print Patrol') ).toBeInTheDocument();
    expect( screen.getByText('printer-outline.svg') ).toBeInTheDocument();
  };

  beforeEach(() => {
    useReactToPrintMock = jest.fn(() => handlePrint);
    useReactToPrint.mockImplementation(useReactToPrintMock);
  });

  test('renders minimum menu options for a patrol', () => {
    renderPatrolMenu();
    userEvent.click(screen.getByRole('button'));

    testMinimumOptionsMenu();
  });

  test('prints the patrol details', () => {
    renderPatrolMenu();
    userEvent.click(screen.getByRole('button'));
    expect(handlePrint).toHaveBeenCalledTimes(0);

    userEvent.click(screen.getByText('Print Patrol'));

    expect(handlePrint).toHaveBeenCalledTimes(1);
  });

  test('renders menu options for a patrol with update permissions', () => {
    renderPatrolMenu(undefined, storeWithUpdatePermissions);

    userEvent.click(screen.getByRole('button'));

    testMinimumOptionsMenu();
    expect( screen.getByText('Cancel Patrol') ).toBeInTheDocument();
    expect( screen.getByText('close-icon.svg') ).toBeInTheDocument();
    expect( screen.getByText('Start Patrol') ).toBeInTheDocument();
    expect( screen.getByText('play-circle.svg') ).toBeInTheDocument();
  });

  test('renders restore menu option for a cancelled patrol', () => {
    renderMenuWithCancelledPatrol();
    userEvent.click(screen.getByRole('button'));

    testMinimumOptionsMenu();
    expect( screen.getByText('close-icon.svg') ).toBeInTheDocument();
    expect( screen.getByText('Restore Patrol') ).toBeInTheDocument();
  });

  test('restores a cancelled patrol using menu option', () => {
    const onPatrolChange = jest.fn();
    renderMenuWithCancelledPatrol({ onPatrolChange });

    userEvent.click(screen.getByRole('button'));
    userEvent.click(screen.getByText('Restore Patrol'));

    expect(onPatrolChange).toHaveBeenCalledWith({
      patrol_segments: [{ time_range: { end_time: null } }],
      state: 'open'
    });
  });

  test('starts a patrol using menu option', () => {
    const mockedDate = '2024-03-06T17:59:49.837Z';
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(mockedDate));

    const onPatrolChange = jest.fn();
    renderPatrolMenu({ ...initialProps, onPatrolChange }, storeWithUpdatePermissions);

    userEvent.click(screen.getByRole('button'));
    userEvent.click(screen.getByText('Start Patrol'));

    expect(onPatrolChange).toHaveBeenCalledWith({
      patrol_segments: [{ time_range: { end_time: null, start_time: mockedDate } }],
      state: 'open'
    });

    jest.useRealTimers();
  });
});