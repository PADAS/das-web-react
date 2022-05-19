import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchPatrols } from '../ducks/patrols';
import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { INITIAL_PATROLS_STATE } from '../ducks/patrols';
import MockSocketProvider, { mockedSocket } from '../__test-helpers/MockSocketContext';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import patrols from '../__test-helpers/fixtures/patrols';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import SideBar from '.';
import { PERMISSION_KEYS, PERMISSIONS } from '../constants';
import useNavigate from '../hooks/useNavigate';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));
jest.mock('../ducks/patrols', () => ({
  ...jest.requireActual('../ducks/patrols'),
  fetchPatrols: jest.fn(),
}));
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useFeatureFlag: () => true,
}));
jest.mock('../hooks/useNavigate', () => jest.fn());

describe('SideBar', () => {
  let fetchPatrolsMock, map, navigate, store, useLocationMock, useNavigateMock;
  beforeEach(() => {
    fetchPatrolsMock = jest.fn(() => () => ({ request: Promise.resolve() }));
    fetchPatrols.mockImplementation(fetchPatrolsMock);
    useLocationMock = jest.fn((() => ({ pathname: '/reports' })));
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
        mapLayerFilter: { filter: { text: '' } },
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
        hiddenAnalyzerIDs: [],
        userPreferences: {},
        sideBar: {},
      },
    };
  });

  test('shows the patrols tab if user has permissions', async () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(await screen.findByText('Patrols')).toBeDefined();
  });

  test('does not show the patrols tab if user has not permissions', () => {
    store.data.user.permissions = {};
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.queryByText('Patrols')).toBeNull();
  });

  test('sets the tab title for the Reports tab', () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.getByRole('heading')).toHaveTextContent('Reports');
  });

  test('sets the tab title for the Patrols tab', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols' })));
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Patrols');
  });

  test('sets the tab title for the Map Layers tab', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/layers' })));
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Map Layers');
  });

  test('shows the reports badge when an event update comes through the socket and sidebar is closed', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/' })));
    useLocation.mockImplementation(useLocationMock);
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('shows the reports badge when a new event comes through the socket and sidebar is closed', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/' })));
    useLocation.mockImplementation(useLocationMock);
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('new_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('shows the reports badge also when the sidebar is open but not in the reports tab', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols' })));
    useLocation.mockImplementation(useLocationMock);
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    await waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('does not show the report badge if sidebar is open in reports tab', () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('new_event', { matches_current_filter: true });

    expect(screen.queryByTestId('badgeIcon')).toBeNull();
  });

  test('shows the Add Report button', () => {
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.getByTestId('sideBar-addReportButton')).not.toHaveClass('hidden');
  });

  test('hides the Add Report button in the map layers tab', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/layers' })));
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.getByTestId('sideBar-addReportButton')).toHaveClass('hidden');
  });

  test('closes the sidebar tabs when clicking the cross button', () => {
    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const closeButton = screen.getByTestId('sideBar-closeButton');
    userEvent.click(closeButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('shows a back button if the detail view of the current tab is open', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/reports/new' })));
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(screen.getByTestId('sideBar-backDetailViewButton')).toBeDefined();
  });

  test('hides the report detail view if it was opened but user clicked the back button', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/reports/new' })));
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const backDetailViewButton = screen.getByTestId('sideBar-backDetailViewButton');
    userEvent.click(backDetailViewButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/reports');
  });

  test('hides the patrol detail view if it was opened but user clicked the back button', () => {
    useLocationMock = jest.fn((() => ({ pathname: '/patrols/new' })));
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const backDetailViewButton = screen.getByTestId('sideBar-backDetailViewButton');
    userEvent.click(backDetailViewButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/patrols');
  });

  test('redirects to map if a tab is not recognized', async () => {
    useLocationMock = jest.fn((() => ({ pathname: '/inalid' })));
    useLocation.mockImplementation(useLocationMock);

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MockSocketProvider>
            <SideBar map={map} />
          </MockSocketProvider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});
