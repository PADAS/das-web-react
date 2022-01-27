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
  cancelledPatrol
} from '../../__test-helpers/fixtures/patrols';
import usePatrol from './';

describe('usePatrol', () => {
  const Component = ({ patrol }) => {
    const { patrolElapsedTime: _patrolElapsedTime, ...data } = usePatrol(patrol);

    return <p data-testid="patrol-data">{JSON.stringify(data)}</p>;
  };

  test('provides the expected data for a new patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={newPatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Active","status":"open"}');
  });

  test('provides the expected data for a scheduled patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={scheduledPatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Scheduled","status":"scheduled"}');
  });

  test('provides the expected data for an active patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={activePatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Active","status":"open"}');
  });

  test('provides the expected data for an overdue patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {}, tracks: [] }, view: {} })}>
        <Component patrol={overduePatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Start Overdue","status":"start-overdue"}');
  });

  test('provides the expected data for a done patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={donePatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Done","status":"done"}');
  });

  test('provides the expected data for a cancelled patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={cancelledPatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('"patrolState":{"title":"Cancelled","status":"cancelled"}');
  });
});
