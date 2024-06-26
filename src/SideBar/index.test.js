import React from 'react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { events, eventWithPoint } from '../__test-helpers/fixtures/events';
import { EVENTS_API_URL, EVENT_API_URL } from '../ducks/events';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchPatrols } from '../ducks/patrols';
import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { INITIAL_PATROLS_STATE } from '../ducks/patrols';
import MockSocketProvider, { mockedSocket } from '../__test-helpers/MockSocketContext';
import { mockStore } from '../__test-helpers/MockStore';
import patrols from '../__test-helpers/fixtures/patrols';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor } from '../test-utils';
import SideBar from '.';
import { PERMISSION_KEYS, PERMISSIONS } from '../constants';
import useNavigate from '../hooks/useNavigate';
import { MapContext } from '../App';
import { report } from '../__test-helpers/fixtures/reports';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));
jest.mock('../ducks/patrols', () => ({
  ...jest.requireActual('../ducks/patrols'),
  fetchPatrols: jest.fn(),
}));

jest.mock('../hooks/useNavigate', () => jest.fn());

const eventFeedResponse = { data: { results: events, next: null, count: events.length, page: 1 } };

const server = setupServer(
  rest.get(EVENTS_API_URL, (req, res, ctx) => {
    return res(ctx.json(eventFeedResponse));
  }),
  rest.get(`${EVENT_API_URL}:id`, (req, res, ctx) => {
    return res(ctx.json({ data: eventWithPoint }));
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
        user: {
          permissions: {
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ],
          }
        },
      },
      view: {
        featureFlagOverrides: {},
        userPreferences: {},
        sideBar: {},
        systemConfig: {
          patrol_enabled: true,
        },
      },
    };
  });

  const assertBadgeWhenEventSignals = async () => {
    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  };

  const renderSideBar = (mockedStore = mockStore(store)) => render(
    <Provider store={mockedStore}>
      <MockSocketProvider>
        <MapContext.Provider value={map}>
          <SideBar />
        </MapContext.Provider>
      </MockSocketProvider>
    </Provider>
  );

  test('shows the patrols tab if user has permissions', async () => {
    renderSideBar();
    expect(await screen.findByText('Patrols')).toBeDefined();
  });

  test('does not show the patrols tab if user has not permissions', () => {
    store.data.user.permissions = {};
    renderSideBar();

    expect(screen.queryByText('Patrols')).toBeNull();
  });

  test('sets the tab title for the Events tab', () => {
    renderSideBar();

    expect(screen.getByRole('heading')).toHaveTextContent('Events');
  });

  test('sets the tab title for the Patrols tab', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Patrols');
  });

  test('sets the tab title for the Map Layers tab', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/layers' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Map Layers');
  });

  test('shows the events badge when an event update comes through the socket and sidebar is closed', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    await assertBadgeWhenEventSignals();
  });

  test('shows the events badge when a new event comes through the socket and sidebar is closed', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    await assertBadgeWhenEventSignals();
  });

  test('shows the events badge also when the sidebar is open but not in the reports tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    await assertBadgeWhenEventSignals();
  });

  test('shows the events badge also when the sidebar is open in the report detail view', async () => {
    useLocationMock = jest.fn((() => ({ pathname: `/events/${report.id}` })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    await assertBadgeWhenEventSignals();
  });

  test('does not show the report badge if sidebar is open in reports tab', () => {
    renderSideBar();

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('new_event', { matches_current_filter: true });

    expect(screen.queryByTestId('badgeIcon')).toBeNull();
  });

  test('shows the Add Report button', () => {
    renderSideBar();

    expect(screen.getByTestId('sideBar-addReportButton')).not.toHaveClass('hidden');
  });

  test('hides the Add Report button in the map layers tab', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/layers' })));
    useLocation.mockImplementation(useLocationMock);

    renderSideBar();

    expect(screen.getByTestId('sideBar-addReportButton')).toHaveClass('hidden');
  });

  test('closes the sidebar tabs when clicking the cross button', async () => {
    const mockStoreInstance = mockStore(store);
    renderSideBar(mockStoreInstance);

    expect(navigate).toHaveBeenCalledTimes(0);

    await waitFor(() => {
      const closeButton = screen.getByTestId('sideBar-closeButton');
      userEvent.click(closeButton);
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/');

    });


  });

  test('shows a back button if the detail view of the current tab is open', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/new' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    expect(screen.getByTestId('sideBar-backDetailViewButton')).toBeDefined();
  });

  const assertBehaviorOfDetailViewBackButton = (locationMock, expectedInvocationParams) => {
    useLocation.mockImplementation(locationMock);
    renderSideBar();

    expect(navigate).toHaveBeenCalledTimes(0);

    const backDetailViewButton = screen.getByTestId('sideBar-backDetailViewButton');
    userEvent.click(backDetailViewButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(expectedInvocationParams, {});
  };

  test('hides the report detail view if it was opened but user clicked the back button', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/new' })));
    assertBehaviorOfDetailViewBackButton(useLocationMock, -1);
  });

  test('hides the patrol detail view if it was opened but user clicked the back button', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/new' })));
    assertBehaviorOfDetailViewBackButton(useLocationMock, -1);
  });

  test('return to report feed when user clicked the back button coming from a deep link', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/123123', key: 'default' })));
    assertBehaviorOfDetailViewBackButton(useLocationMock, '/events');
  });

  test('return to patrol feed when user clicked the back button coming from a deep link', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/123123', key: 'default' })));
    assertBehaviorOfDetailViewBackButton(useLocationMock, '/patrols');
  });

  test('return to report feed when user clicked the back button coming from a deep link which required login', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/123123', key: '2324e2', state: { comesFromLogin: true } })));
    assertBehaviorOfDetailViewBackButton(useLocationMock, '/events');
  });

  test('return to report feed when user clicked the back button coming from a deep link with lngLat value', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/events/123123', key: '2324e2', state: { comesFromLngLatRedirection: true } })));
    assertBehaviorOfDetailViewBackButton(useLocationMock, '/events');
  });

  test('redirects to map if a tab is not recognized', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/invalid' })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  test('redirects to new /events URL when coming from legacy URL', async () => {
    const eventID = '1234-6563';
    useLocationMock = jest.fn((() => ({ pathname: `/reports/${eventID}` })));
    useLocation.mockImplementation(useLocationMock);
    renderSideBar();

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(`/events/${eventID}`, { replace: true });
    });
  });

  test('redirects from details view to new /events URL when user presses Escape', async () => {
    const locationMock = jest.fn((() => ({ pathname: '/events/123123', key: '2324e2', state: { comesFromLogin: true } })));
    useLocation.mockImplementation(locationMock);
    renderSideBar();

    expect(navigate).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Escape}');

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/events');
  });

  test('redirects from details view to new /patrols URL when user presses Escape', async () => {
    const locationMock = jest.fn((() => ({ pathname: '/patrols/123123', key: '2324e2', state: { comesFromLogin: true } })));
    useLocation.mockImplementation(locationMock);
    renderSideBar();

    expect(navigate).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Escape}');

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/patrols');
  });
});
