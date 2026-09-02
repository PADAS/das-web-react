import React from 'react';
import { Provider } from 'react-redux';
import { Route, Routes, useLocation } from 'react-router';

import { fetchPatrol } from '../../../ducks/patrols';
import { fetchPatrolTypes } from '../../../ducks/patrol-types';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrols from '../../../__test-helpers/fixtures/patrols';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor } from '../../../test-utils';

import LegManager from './';

jest.mock('../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../ducks/patrols'),
  fetchPatrol: jest.fn(),
}));

jest.mock('../../../ducks/patrol-types', () => ({
  ...jest.requireActual('../../../ducks/patrol-types'),
  fetchPatrolTypes: jest.fn(),
}));

/* eslint-disable-next-line react/display-name */
jest.mock('./NewLeg', () => () => <div>New Leg</div>);

const LocationDisplay = () => <div data-testid="test-location">{useLocation().pathname}</div>;

describe('SideBar - PatrolsManager - LegManager', () => {
  const patrol = patrols[0];

  let store;
  beforeEach(() => {
    jest.clearAllMocks();

    fetchPatrol.mockImplementation(() => () => Promise.resolve());
    fetchPatrolTypes.mockImplementation(() => () => Promise.resolve());

    store = { data: { patrolStore: { [patrol.id]: patrol }, patrolTypes } };
  });

  const renderLegManager = (legPath = 'new') => render(
    <Provider store={mockStore(store)}>
      <Routes>
        <Route element={<LegManager />} path="/patrols/:patrolId/legs/*" />

        {/* The route the manager leaves for is out of the scope of these tests. */}
        <Route element={null} path="/patrols/*" />
      </Routes>

      <LocationDisplay />
    </Provider>,
    { initialEntries: [`/patrols/${patrol.id}/legs/${legPath}`] }
  );

  test('fetches the patrol', () => {
    renderLegManager();

    expect(fetchPatrol).toHaveBeenCalledWith(patrol.id);
  });

  test('shows the loader while the patrol is on its way', () => {
    fetchPatrol.mockImplementation(() => () => new Promise(() => {}));

    renderLegManager();

    expect(screen.getByTestId('legManager-loader')).toBeVisible();
  });

  test('shows the loader until the patrol it already holds has been fetched again', async () => {
    let resolveFetchPatrol;
    fetchPatrol.mockImplementation(() => () => new Promise((resolve) => {
      resolveFetchPatrol = resolve;
    }));

    renderLegManager();

    expect(screen.getByTestId('legManager-loader')).toBeVisible();

    resolveFetchPatrol();

    expect(await screen.findByText('New Leg')).toBeVisible();
  });

  test('fetches the patrol types when the store holds none', async () => {
    store.data.patrolTypes = [];

    renderLegManager();

    await waitFor(() => expect(fetchPatrolTypes).toHaveBeenCalled());
  });

  test('does not fetch the patrol types when the store already holds them', async () => {
    renderLegManager();

    expect(await screen.findByText('New Leg')).toBeVisible();
    expect(fetchPatrolTypes).not.toHaveBeenCalled();
  });

  test('sends the user back to the feed when the patrol it is asked for is gone', async () => {
    fetchPatrol.mockImplementation(() => () => Promise.reject(new Error('Not found')));

    renderLegManager();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols'));
  });

  test('sends the user back to the feed when the patrol types cannot be loaded', async () => {
    store.data.patrolTypes = [];
    fetchPatrolTypes.mockImplementation(() => () => Promise.reject(new Error('Server error')));

    renderLegManager();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols'));
  });

  test('sends the user back to the feed when the site serves no patrol type', async () => {
    store.data.patrolTypes = [];

    renderLegManager();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols'));
  });

  test('renders the new leg when the path is /patrols/:patrolId/legs/new', async () => {
    renderLegManager();

    expect(await screen.findByText('New Leg')).toBeVisible();
  });

  test('renders the leg manager placeholder when the path points at an existing leg', async () => {
    renderLegManager(patrol.patrol_segments[0].id);

    expect(await screen.findByText('Leg Manager')).toBeVisible();
  });
});
