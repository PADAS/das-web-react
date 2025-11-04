import React from 'react';
import { Provider } from 'react-redux';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { events, eventWithPoint } from '../__test-helpers/fixtures/events';
import { EVENTS_API_URL, EVENT_API_URL } from '../ducks/events';
import eventCategories from '../__test-helpers/fixtures/event-categories';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchPatrols, PATROLS_API_URL } from '../ducks/patrols';
import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { INITIAL_PATROLS_STATE } from '../ducks/patrols';
import mockPatrolData from '../__test-helpers/fixtures/patrols';
import MockSocketProvider, { mockedSocket } from '../__test-helpers/MockSocketContext';
import { mockStore } from '../__test-helpers/MockStore';
import patrols from '../__test-helpers/fixtures/patrols';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor } from '../test-utils';
import SideBar from '.';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../constants';
import useNavigate from '../hooks/useNavigate';
import { MapContext } from '../App';
import { report } from '../__test-helpers/fixtures/reports';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
}));

jest.mock('../ducks/patrols', () => ({
  ...jest.requireActual('../ducks/patrols'),
  fetchPatrols: jest.fn(),
}));

jest.mock('../hooks/useNavigate', () => jest.fn());

const eventFeedResponse = { data: { results: events, next: null, count: events.length, page: 1 } };

const server = setupServer(
  http.get(EVENTS_API_URL, () => {
    return HttpResponse.json(eventFeedResponse);
  }),
  http.get(`${EVENT_API_URL}:id`, () => {
    return HttpResponse.json({ data: eventWithPoint });
  }),
  http.get(PATROLS_API_URL, () => {
    return HttpResponse.json({ data: { results: mockPatrolData } });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SideBar', () => {
  let fetchPatrolsMock, map, navigate, store, useLocationMock, useNavigateMock;
  beforeEach(() => {
    fetchPatrolsMock = jest.fn(() => () => ({ request: Promise.resolve() }));
    fetchPatrols.mockImplementation(fetchPatrolsMock);
    useLocationMock = jest.fn((() => ({ pathname: '/events' })));
    useLocation.mockImplementation(useLocationMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    map = createMapMock();

    store = {
      data: {
        analyzerFeatures: { data: [] },
        eventFilter: {
          filter: {
            date_range: { lower: null, upper: null },
            event_type: [],
            event_category: [],
            text: '',
            duration: null,
            priority: [],
            reported_by: [],
          },
        },
        eventSchemas: {},
        eventStore: {},
        eventCategories,
        eventTypes,
        featureSets: { data: [] },
        feedEvents: { results: [] },
        mapLayerFilter: { text: '', hiddenAnalyzerIDs: [] },
        patrolFilter: {
          filter: {
            date_range: { lower: null, upper: null },
            patrols_overlap_daterange: false,
            patrol_type: [],
            text: '',
            tracked_by: [],
          },
          status: INITIAL_FILTER_STATE.status,
        },
        patrolStore: patrols.reduce((accumulator, patrol) => ({ ...accumulator, [patrol.id]: patrol }), {}),
        patrols: INITIAL_PATROLS_STATE,
        patrolTypes,
        subjectGroups: [],
        subjectStore: {},
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENTS]: [PERMISSIONS.READ, PERMISSIONS.CREATE],
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ, PERMISSIONS.CREATE],
          }
        },
      },
      view: {
        mapLocationSelection: {
          isPickingLocation: false,
        },
        userPreferences: {},
        sideBar: {},
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
          [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
          [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
          [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
        },
      },
    };
  });

  const renderSideBar = (mockedStore = mockStore(store)) => render(
    <Provider store={mockedStore}>
      <MockSocketProvider>
        <MapContext.Provider value={map}>
          <SideBar />
        </MapContext.Provider>
      </MockSocketProvider>
    </Provider>
  );

  test('shows the events tab if user has permissions', async () => {
    renderSideBar();

    expect(screen.getByRole('link', { name: 'Events' })).toBeVisible();
  });

  test('does not show the events tab if user has not permissions', async () => {
    store.data.user.permissions = {};
    renderSideBar();

    expect(screen.queryByRole('link', { name: 'Events' })).toBeNull();
  });

  test('sets the event tab as active', async () => {
    renderSideBar();

    expect(screen.getByRole('link', { name: 'Events' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Patrols' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Map Layers' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Settings' })).not.toHaveClass('active');
  });

  test('shows the events badge when an event update comes through the socket and sidebar is closed', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('shows the events badge when the sidebar is open but not in the reports tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('shows the events badge when the sidebar is open in the report detail view', async () => {
    useLocationMock = jest.fn((() => ({ pathname: `/events/${report.id}` })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('shows the events badge when a new event comes through the socket', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('new_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('does not show the report badge if sidebar is open in reports tab', async () => {
    renderSideBar();

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('new_event', { matches_current_filter: true });

    expect(screen.queryByTestId('badgeIcon')).toBeNull();
  });

  test('shows the patrols tab if user has permissions', async () => {
    renderSideBar();

    expect(screen.getByRole('link', { name: 'Patrols' })).toBeVisible();
  });

  test('does not show the patrols tab if user has not permissions', async () => {
    store.data.user.permissions = {};
    renderSideBar();

    expect(screen.queryByRole('link', { name: 'Patrols' })).toBeNull();
  });

  test('sets the patrols tab as active', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.getByRole('link', { name: 'Events' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Patrols' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Map Layers' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Settings' })).not.toHaveClass('active');
  });

  test('shows the map layers tab if at least one layer is enabled in the system configuration', async () => {
    renderSideBar();

    expect(screen.getByRole('link', { name: 'Map Layers' })).toBeVisible();
  });

  test('does not show the map layers tab if all layers are disabled in the system configuration', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.ANALYZERS] = false;
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES] = false;
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS] = false;
    renderSideBar();

    expect(screen.queryByRole('link', { name: 'Map Layers' })).toBeNull();
  });

  test('sets the map layers tab as active', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/layers' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.getByRole('link', { name: 'Events' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Patrols' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Map Layers' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Settings' })).not.toHaveClass('active');
  });

  test('sets the settings tab as active', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/settings' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.getByRole('link', { name: 'Events' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Patrols' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Map Layers' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass('active');
  });

  test('shows the Add Report button in the events tab', async () => {
    renderSideBar();

    expect(screen.getByRole('button', { name: 'Create Event' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Go Back' })).toBeNull();
  });

  test('shows the back button in the report detail view', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/new' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.queryByRole('button', { name: 'Create Event' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeVisible();
  });

  test('shows the Add Patrol button in the patrols tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.queryByRole('button', { name: 'Create Patrol' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Go Back' })).toBeNull();
  });

  test('shows the back button in the patrol detail view', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/new' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.queryByRole('button', { name: 'Create Patrol' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeVisible();
  });

  test('does not show add or back buttons in the map layers tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/layers' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.queryByRole('button', { name: 'Create Event' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Create Patrol' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Go Back' })).toBeNull();
  });

  test('does not show add or back buttons in the settings tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/settings' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.queryByRole('button', { name: 'Create Event' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Create Patrol' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Go Back' })).toBeNull();
  });

  test('navigates to related event when user clicks the back button in the report detail view', async () => {
    const relatedEventId = 'related-event-123';
    useLocationMock = jest.fn((() => ({
      pathname: '/events/456',
      key: 'abc123',
      state: { relatedEvent: relatedEventId }
    })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(navigate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(`/events/${relatedEventId}`, { replace: true });
  });

  test('navigates to current tab when user clicks the back button in the report detail view and location.key is default', async () => {
    useLocationMock = jest.fn((() => ({
      pathname: '/events/123',
      key: 'default',
      state: null
    })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(navigate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/events', {});
  });

  test('navigates to current tab when user clicks the back button in the patrol detail view and location.state.comesFromLogin is true', async () => {
    useLocationMock = jest.fn((() => ({
      pathname: '/patrols/123',
      key: 'abc123',
      state: { comesFromLogin: true }
    })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(navigate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/patrols', {});
  });

  test('navigates to current tab when user clicks the back button in the report detail view and location.state.comesFromLngLatRedirection is true', async () => {
    useLocationMock = jest.fn((() => ({
      pathname: '/events/123',
      key: 'abc123',
      state: { comesFromLngLatRedirection: true }
    })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(navigate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/events', {});
  });

  test('navigates back with when user clicks the back button in the report detail view and none of the special conditions are met', async () => {
    useLocationMock = jest.fn((() => ({
      pathname: '/events/123',
      key: 'abc123',
      state: null
    })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(navigate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(-1, {});
  });

  test('sets the tab title for the Events tab', async () => {
    renderSideBar();

    expect(screen.getByRole('heading')).toHaveTextContent('Events');
  });

  test('sets the tab title for the Patrols tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    expect(screen.getByRole('heading')).toHaveTextContent('Patrols');
  });

  test('sets the tab title for the Map Layers tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/layers' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    expect(screen.getByRole('heading')).toHaveTextContent('Map Layers');
  });

  test('sets the tab title for the Settings tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/settings' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    expect(screen.getByRole('heading')).toHaveTextContent('Settings');
  });

  test('closes the sidebar tabs when clicking the cross button', async () => {
    renderSideBar();

    expect(navigate).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Close Event Feed' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('redirects to events path when legacy reports URL is accessed and user has events permissions', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/reports' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/events', { replace: true });
  });

  test('redirects to home when legacy reports URL is accessed and user does not have events permissions', async () => {
    store.data.user.permissions = {
      [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ, PERMISSIONS.CREATE],
    };
    useLocationMock = jest.fn((() => ({ pathname: '/reports' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  test('navigates to home when current tab is not in enabled tab keys', async () => {
    store.data.user.permissions = {};
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    useLocationMock = jest.fn((() => ({ pathname: '/events' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  test('does not navigate to home when current tab is in enabled tab keys', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(navigate).not.toHaveBeenCalled();
  });

  test('clears events badge when navigating to events tab and not in report detail view', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/' })));
    useLocation.mockImplementation(useLocationMock);

    const { rerender } = renderSideBar();

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });

    useLocationMock = jest.fn((() => ({ pathname: '/events' })));
    useLocation.mockImplementation(useLocationMock);

    rerender(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <MapContext.Provider value={map}>
            <SideBar />
          </MapContext.Provider>
        </MockSocketProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('badgeIcon')).toBeNull();
    });
  });

  test('does not clear events badge when navigating to events tab but in report detail view', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/' })));
    useLocation.mockImplementation(useLocationMock);

    const { rerender } = renderSideBar();

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });

    useLocationMock = jest.fn((() => ({ pathname: `/events/${report.id}` })));
    useLocation.mockImplementation(useLocationMock);

    rerender(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <MapContext.Provider value={map}>
            <SideBar />
          </MapContext.Provider>
        </MockSocketProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('does not clear events badge when not in events tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/' })));
    useLocation.mockImplementation(useLocationMock);

    const { rerender } = renderSideBar();

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });

    useLocationMock = jest.fn((() => ({ pathname: '/patrols' })));
    useLocation.mockImplementation(useLocationMock);

    rerender(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <MapContext.Provider value={map}>
            <SideBar />
          </MapContext.Provider>
        </MockSocketProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('navigates to current tab when Escape key is pressed in report detail view with sidebar focused', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/123' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    const sidebar = screen.getByRole('navigation');
    sidebar?.focus();

    expect(navigate).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/events');
  });

  test('navigates to current tab when Escape key is pressed in patrol detail view with sidebar focused', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/123' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    const sidebar = screen.getByRole('navigation');
    sidebar?.focus();

    expect(navigate).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/patrols');
  });

  test('does not navigate when Escape key is pressed but not in detail view', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    const sidebar = screen.getByRole('navigation');
    sidebar?.focus();

    expect(navigate).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(navigate).not.toHaveBeenCalled();
  });

  test('does not navigate when Escape key is pressed but location is being picked', async () => {
    store.view.mapLocationSelection.isPickingLocation = true;
    useLocationMock = jest.fn((() => ({ pathname: '/events/123' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    const sidebar = screen.getByRole('navigation');
    sidebar?.focus();

    expect(navigate).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(navigate).not.toHaveBeenCalled();
  });
});
