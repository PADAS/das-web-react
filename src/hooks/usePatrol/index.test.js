import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { mockStore } from '../../__test-helpers/MockStore';
import {
  newPatrol,
  scheduledPatrol,
  activePatrol,
  overduePatrol,
  donePatrol,
  cancelledPatrol,
  patrolDefaultStoreData
} from '../../__test-helpers/fixtures/patrols';
import { PATROL_API_STATES } from '../../constants';
import { updatePatrol } from '../../ducks/patrols';
import usePatrol from './';

jest.mock('../../ducks/patrols', () => ({
  ...jest.requireActual('../../ducks/patrols'),
  updatePatrol: jest.fn(),
}));

const store = mockStore(patrolDefaultStoreData);

describe('usePatrol', () => {
  const Component = ({ patrol }) => {
    const { patrolElapsedTime: _patrolElapsedTime, ...data } = usePatrol(patrol);

    return <p data-testid="patrol-data">{JSON.stringify(data)}</p>;
  };

  let updatePatrolMock;
  beforeEach(() => {
    updatePatrolMock = jest.fn(() => () => {});
    updatePatrol.mockImplementation(updatePatrolMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('provides the expected data for a new patrol', async () => {
    render(
      <Provider store={store}>
        <Component patrol={newPatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Active","status":"open"}');
  });

  test('provides the expected data for a scheduled patrol', async () => {
    render(
      <Provider store={store}>
        <Component patrol={scheduledPatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Scheduled","status":"scheduled"}');
  });

  test('provides the expected data for an active patrol', async () => {
    render(
      <Provider store={store}>
        <Component patrol={activePatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Active","status":"open"}');
  });

  test('provides the expected data for an overdue patrol', async () => {
    render(
      <Provider store={store}>
        <Component patrol={overduePatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Start Overdue","status":"start-overdue"}');
  });

  test('provides the expected data for a done patrol', async () => {
    render(
      <Provider store={store}>
        <Component patrol={donePatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Done","status":"done"}');
  });

  test('provides the expected data for a cancelled patrol', async () => {
    render(
      <Provider store={store}>
        <Component patrol={cancelledPatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Cancelled","status":"cancelled"}');
  });

  test('triggers a patrol update when calling onPatrolChange', async () => {
    const Component = ({ patrol }) => {
      const { onPatrolChange } = usePatrol(patrol);

      onPatrolChange({ state: PATROL_API_STATES.CANCELLED });

      return null;
    };
    render(
      <Provider store={store}>
        <Component patrol={activePatrol} />
      </Provider>
    );

    expect(updatePatrol).toHaveBeenCalled();
    expect(updatePatrol.mock.calls[0][0].state).toBe('cancelled');
  });

  test('triggers a patrol update when calling restorePatrol', async () => {
    const Component = ({ patrol }) => {
      const { restorePatrol } = usePatrol(patrol);

      restorePatrol();

      return null;
    };
    render(
      <Provider store={store}>
        <Component patrol={activePatrol} />
      </Provider>
    );

    expect(updatePatrol).toHaveBeenCalled();
    expect(updatePatrolMock.mock.calls[0][0].state).toBe('open');
  });

  test('triggers a patrol update when calling startPatrol', async () => {
    const Component = ({ patrol }) => {
      const { startPatrol } = usePatrol(patrol);

      startPatrol();

      return null;
    };
    render(
      <Provider store={store}>
        <Component patrol={activePatrol} />
      </Provider>
    );

    expect(updatePatrol).toHaveBeenCalled();
    expect(updatePatrolMock.mock.calls[0][0].state).toBe('open');
  });
});
