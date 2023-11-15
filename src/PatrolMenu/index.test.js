import React from 'react';
import { render, screen } from '@testing-library/react';
import PatrolMenu from './index';
import patrols from '../__test-helpers/fixtures/patrols';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../__test-helpers/MockStore';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { PERMISSION_KEYS, PERMISSIONS } from '../constants';

describe('<PatrolMenu />', () => {

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
  const renderPatrolMenu = (props = initialProps, store = minimumNecessaryStoreStructure) => {
    return render(
      <Provider store={mockStore(store)}>
        <PatrolMenu {...props} />
      </Provider>
    );
  };

  const testMinimumOptionsMenu = () => {
    expect( screen.getByText('Copy patrol link') ).toBeInTheDocument();
    expect( screen.getByText('Print patrol') ).toBeInTheDocument();
  };

  test('renders minimum menu options for a patrol', () => {
    renderPatrolMenu();
    userEvent.click(screen.getByRole('button'));

    testMinimumOptionsMenu();
  });

  test('renders menu options for a patrol with update permissions', () => {
    renderPatrolMenu(undefined, {
      data: {
        ...minimumNecessaryStoreStructure.data,
        user: {
          permissions: {
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE]
          },
        }
      }
    });

    userEvent.click(screen.getByRole('button'));

    testMinimumOptionsMenu();
    expect( screen.getByText('Cancel Patrol') ).toBeInTheDocument();
    expect( screen.getByText('Start Patrol') ).toBeInTheDocument();
  });
});