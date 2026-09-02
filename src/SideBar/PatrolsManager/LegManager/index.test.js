import React from 'react';
import { Provider } from 'react-redux';
import { Route, Routes, useLocation } from 'react-router';

import { fetchPatrol } from '../../../ducks/patrols';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrols from '../../../__test-helpers/fixtures/patrols';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor } from '../../../test-utils';

import LegManager from './';

jest.mock('../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../ducks/patrols'),
  fetchPatrol: jest.fn(),
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

    store = { data: { patrolStore: {}, patrolTypes } };
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

  test('fetches the patrol if it is not in the store', () => {
    renderLegManager();

    expect(fetchPatrol).toHaveBeenCalledWith(patrol.id);
  });

  test('shows the loader while the patrol is on its way', () => {
    renderLegManager();

    expect(screen.getByTestId('legManager-loader')).toBeVisible();
  });

  test('shows the loader while the patrol types are not in the store', () => {
    store.data.patrolStore = { [patrol.id]: patrol };
    store.data.patrolTypes = [];

    renderLegManager();

    expect(screen.getByTestId('legManager-loader')).toBeVisible();
  });

  test('sends the user back to the feed when the patrol it is asked for is gone', async () => {
    fetchPatrol.mockImplementation(() => () => Promise.reject(new Error('Not found')));

    renderLegManager();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols'));
  });

  test('renders the new leg when the path is /patrols/:patrolId/legs/new', () => {
    store.data.patrolStore = { [patrol.id]: patrol };

    renderLegManager();

    expect(screen.getByText('New Leg')).toBeVisible();
  });

  test('renders the leg manager placeholder when the path points at an existing leg', () => {
    store.data.patrolStore = { [patrol.id]: patrol };

    renderLegManager(patrol.patrol_segments[0].id);

    expect(screen.getByText('Leg Manager')).toBeVisible();
  });
});
