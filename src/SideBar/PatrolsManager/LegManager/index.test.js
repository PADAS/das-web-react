import React from 'react';
import { Provider } from 'react-redux';
import { Link, Route, Routes, useLocation } from 'react-router';

import { fetchPatrol, fetchPatrolTeamAndTrackingOptions } from '../../../ducks/patrols';
import { fetchPatrolTypes } from '../../../ducks/patrol-types';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrols from '../../../__test-helpers/fixtures/patrols';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor } from '../../../test-utils';
import userEvent from '@testing-library/user-event';

import LegManager from './';

jest.mock('../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../ducks/patrols'),
  fetchPatrol: jest.fn(),
  fetchPatrolTeamAndTrackingOptions: jest.fn(),
}));

jest.mock('../../../ducks/patrol-types', () => ({
  ...jest.requireActual('../../../ducks/patrol-types'),
  fetchPatrolTypes: jest.fn(),
}));

// eslint-disable-next-line react/display-name -- a route stub needs no name.
jest.mock('./EditLeg', () => () => <div>Edit Leg</div>);

// eslint-disable-next-line react/display-name -- a route stub needs no name.
jest.mock('./LegOverview', () => () => <div>Leg Overview</div>);

// eslint-disable-next-line react/display-name -- a route stub needs no name.
jest.mock('./NewLeg', () => () => <div>New Leg</div>);

const LocationDisplay = () => <div data-testid="test-location">{useLocation().pathname}</div>;

describe('SideBar - PatrolsManager - LegManager', () => {
  const patrol = patrols[0];

  let store;
  beforeEach(() => {
    jest.clearAllMocks();

    fetchPatrol.mockImplementation(() => () => Promise.resolve());
    fetchPatrolTeamAndTrackingOptions.mockImplementation(() => () => Promise.resolve());
    fetchPatrolTypes.mockImplementation(() => () => Promise.resolve());

    store = {
      data: {
        patrolStore: { [patrol.id]: patrol },
        patrolTeamAndTrackingOptions: { assets: [], hasFetched: true, leaders: [], members: [], teams: [] },
        patrolTypes,
      },
    };
  });

  const renderLegManager = (legPath = 'new') => render(
    <Provider store={mockStore(store)}>
      <Routes>
        <Route element={<LegManager />} path="/patrols/:patrolId/legs/*" />

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

    expect(screen.getByRole('status')).toHaveTextContent('Loading patrol data');
  });

  test('shows the loader until the patrol it already holds has been fetched again', async () => {
    let resolveFetchPatrol;
    fetchPatrol.mockImplementation(() => () => new Promise((resolve) => {
      resolveFetchPatrol = resolve;
    }));

    renderLegManager();

    expect(screen.getByRole('status')).toHaveTextContent('Loading patrol data');

    resolveFetchPatrol();

    expect(await screen.findByText('New Leg')).toBeVisible();
  });

  test('fetches the team and tracking options when the store holds none', async () => {
    store.data.patrolTeamAndTrackingOptions.hasFetched = false;

    renderLegManager();

    await waitFor(() => expect(fetchPatrolTeamAndTrackingOptions).toHaveBeenCalled());
  });

  test('does not fetch the team and tracking options when the store already holds them', async () => {
    renderLegManager();

    await waitFor(() => expect(fetchPatrol).toHaveBeenCalled());
    expect(fetchPatrolTeamAndTrackingOptions).not.toHaveBeenCalled();
  });

  test('shows the loader until the rosters a leg form prefills from are here', () => {
    store.data.patrolTeamAndTrackingOptions.hasFetched = false;
    fetchPatrolTeamAndTrackingOptions.mockImplementation(() => () => new Promise(() => {}));

    renderLegManager();

    expect(screen.getByRole('status')).toHaveTextContent('Loading patrol data');
  });

  test('shows the leg even when the rosters could not be fetched, so one failure does not blank it', async () => {
    store.data.patrolTeamAndTrackingOptions.hasFetched = false;

    renderLegManager();

    expect(await screen.findByText('New Leg')).toBeVisible();
  });

  test('waits for the new patrol instead of sending the user to the feed when the url moves to another one', async () => {
    const otherPatrolId = 'a-patrol-that-is-not-in-the-store';
    fetchPatrol.mockImplementation((patrolId) => () => patrolId === otherPatrolId
      ? new Promise(() => {})
      : Promise.resolve());

    render(
      <Provider store={mockStore(store)}>
        <Link to={`/patrols/${otherPatrolId}/legs/new`}>Go to the other patrol</Link>

        <Routes>
          <Route element={<LegManager />} path="/patrols/:patrolId/legs/*" />

          <Route element={null} path="/patrols/*" />
        </Routes>

        <LocationDisplay />
      </Provider>,
      { initialEntries: [`/patrols/${patrol.id}/legs/new`] }
    );

    expect(await screen.findByText('New Leg')).toBeVisible();

    await userEvent.click(screen.getByRole('link', { name: 'Go to the other patrol' }));

    expect(screen.getByRole('status')).toHaveTextContent('Loading patrol data');
    expect(screen.getByTestId('test-location')).toHaveTextContent(`/patrols/${otherPatrolId}/legs/new`);
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

  test('sends the user back to the feed when the fetch leaves no patrol behind', async () => {
    store.data.patrolStore = {};

    renderLegManager();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols'));
    expect(screen.queryByText('New Leg')).toBeNull();
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

  test('renders the leg overview when the path points at an existing leg', async () => {
    renderLegManager(patrol.patrol_segments[0].id);

    expect(await screen.findByText('Leg Overview')).toBeVisible();
  });

  test('renders the edit leg when the path points at the edition of a leg', async () => {
    renderLegManager(`${patrol.patrol_segments[0].id}/edit`);

    expect(await screen.findByText('Edit Leg')).toBeVisible();
  });
});
