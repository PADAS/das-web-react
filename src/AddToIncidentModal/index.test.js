import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { eventWithoutPatrol } from '../__test-helpers/fixtures/events';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen, waitFor } from '../test-utils';

import { fetchIncidentFeed, fetchNextIncidentFeedPage } from '../ducks/events';
import { removeModal } from '../ducks/modals';
import AddToIncidentModal from './';

jest.mock('../ducks/events', () => ({
  ...jest.requireActual('../ducks/events'),
  fetchIncidentFeed: jest.fn(),
  fetchNextIncidentFeedPage: jest.fn(),
}));

jest.mock('../ducks/modals', () => ({
  ...jest.requireActual('../ducks/modals'),
  removeModal: jest.fn(),
}));

describe('AddToIncidentModal', () => {
  const onAddToExistingIncident = jest.fn();
  const onAddToNewIncident = jest.fn();

  let store;
  beforeEach(() => {
    fetchIncidentFeed.mockImplementation(() => ({ type: 'MOCK_FETCH_INCIDENT_FEED' }));
    fetchNextIncidentFeedPage.mockImplementation(() => ({ type: 'MOCK_FETCH_NEXT_INCIDENT_FEED_PAGE' }));
    removeModal.mockImplementation((id) => ({ type: 'MOCK_REMOVE_MODAL', payload: id }));

    store = {
      data: {
        eventStore: { [eventWithoutPatrol.id]: eventWithoutPatrol },
        eventTypes,
        feedIncidents: { count: 0, next: null, results: [] },
        patrolTypes: [],
      },
      view: {},
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderAddToIncidentModal = (props = {}) => render(
    <Provider store={mockStore(store)}>
      <AddToIncidentModal
        id="test-modal"
        onAddToExistingIncident={onAddToExistingIncident}
        onAddToNewIncident={onAddToNewIncident}
        {...props}
      />
    </Provider>
  );

  test('shows a loading overlay and no incident list until the feed has loaded', () => {
    renderAddToIncidentModal();

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText('Add to new incident')).toBeInTheDocument();
  });

  test('renders the incident list once the feed has loaded', async () => {
    store.data.feedIncidents = { count: 1, next: null, results: [eventWithoutPatrol.id] };

    renderAddToIncidentModal();

    expect(await screen.findByRole('list')).toBeInTheDocument();
    expect(screen.getByText('No more incidents to display.')).toBeInTheDocument();
  });

  test('shows a loading footer item while there are more pages to fetch', async () => {
    store.data.feedIncidents = { count: 2, next: 'https://example.com/next-page', results: [eventWithoutPatrol.id] };

    renderAddToIncidentModal();

    expect(await screen.findByRole('list')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('No more incidents to display.')).not.toBeInTheDocument();
  });

  test('calls onAddToNewIncident when clicking "Add to new incident"', async () => {
    renderAddToIncidentModal();

    await userEvent.click(screen.getByText('Add to new incident'));

    expect(onAddToNewIncident).toHaveBeenCalledTimes(1);
  });

  test('calls onAddToExistingIncident and closes the modal when clicking an existing incident', async () => {
    store.data.feedIncidents = { count: 1, next: null, results: [eventWithoutPatrol.id] };

    renderAddToIncidentModal();

    const [incidentItem] = await screen.findAllByRole('listitem');
    await userEvent.click(incidentItem);

    expect(onAddToExistingIncident).toHaveBeenCalledWith(eventWithoutPatrol);
    expect(removeModal).toHaveBeenCalledWith('test-modal');
  });

  test('closes the modal when clicking Cancel', async () => {
    renderAddToIncidentModal();

    await userEvent.click(screen.getByText('Cancel'));

    expect(removeModal).toHaveBeenCalledWith('test-modal');
  });

  test('includes the user\'s location in the feed request when available', async () => {
    store.view = { userLocation: { coords: { latitude: 1, longitude: 2 } } };

    renderAddToIncidentModal();

    await waitFor(() => expect(fetchIncidentFeed).toHaveBeenCalledWith(
      {},
      expect.stringContaining('location=2,1'),
    ));
  });
});
