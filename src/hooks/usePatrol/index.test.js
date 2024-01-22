import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

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
import i18nForTests from '../../i18nForTests';

jest.mock('../../ducks/patrols', () => ({
  ...jest.requireActual('../../ducks/patrols'),
  updatePatrol: jest.fn(),
}));

const store = mockStore(patrolDefaultStoreData);

/** Remove key prop from toHaveTextContent payload when title/key are removed from const*/
describe('usePatrol', () => {
  const Component = ({ patrol }) => {
    const { patrolElapsedTime: _patrolElapsedTime, ...data } = usePatrol(patrol);

    return <p data-testid="patrol-data">{JSON.stringify(data)}</p>;
  };

  const renderTestComponent = (patrol, TestComponent = Component) => render(
    <Provider store={store}>
      <I18nextProvider i18n={i18nForTests}>
        <TestComponent patrol={patrol} />
      </I18nextProvider>
    </Provider>
  );

  let updatePatrolMock;
  beforeEach(() => {
    updatePatrolMock = jest.fn(() => () => {});
    updatePatrol.mockImplementation(updatePatrolMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('provides the expected data for a new patrol', async () => {
    renderTestComponent(newPatrol);

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"key":"active","title":"Active","status":"open"}');
  });

  test('provides the expected data for a scheduled patrol', async () => {
    renderTestComponent(scheduledPatrol);

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"key":"scheduled","title":"Scheduled","status":"scheduled"}');
  });

  test('provides the expected data for an active patrol', async () => {
    renderTestComponent(activePatrol);

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"key":"active","title":"Active","status":"open"}');
  });

  test('provides the expected data for an overdue patrol', async () => {
    renderTestComponent(overduePatrol);

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"key":"startOverdue","title":"Start Overdue","status":"start-overdue"}');
  });

  test('provides the expected data for a done patrol', async () => {
    renderTestComponent(donePatrol);

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"key":"done","title":"Done","status":"done"}');
  });

  test('provides the expected data for a cancelled patrol', async () => {
    renderTestComponent(cancelledPatrol);

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"key":"cancelled","title":"Cancelled","status":"cancelled"}');
  });

  test('triggers a patrol update when calling onPatrolChange', async () => {
    const Component = ({ patrol }) => {
      const { onPatrolChange } = usePatrol(patrol);

      onPatrolChange({ state: PATROL_API_STATES.CANCELLED });

      return null;
    };
    renderTestComponent(activePatrol, Component);

    expect(updatePatrol).toHaveBeenCalled();
    expect(updatePatrol.mock.calls[0][0].state).toBe('cancelled');
  });

  test('triggers a patrol update when calling restorePatrol', async () => {
    const Component = ({ patrol }) => {
      const { restorePatrol } = usePatrol(patrol);

      restorePatrol();

      return null;
    };
    renderTestComponent(activePatrol, Component);


    expect(updatePatrol).toHaveBeenCalled();
    expect(updatePatrolMock.mock.calls[0][0].state).toBe('open');
  });

  test('triggers a patrol update when calling startPatrol', async () => {
    const Component = ({ patrol }) => {
      const { startPatrol } = usePatrol(patrol);

      startPatrol();

      return null;
    };
    renderTestComponent(activePatrol, Component);

    expect(updatePatrol).toHaveBeenCalled();
    expect(updatePatrolMock.mock.calls[0][0].state).toBe('open');
  });
});
