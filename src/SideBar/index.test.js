import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchPatrols } from '../ducks/patrols';
import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { INITIAL_PATROLS_STATE } from '../ducks/patrols';
import MockSocketProvider, { mockedSocket } from '../__test-helpers/MockSocketContext';
import { mockStore } from '../__test-helpers/MockStore';
import patrols from '../__test-helpers/fixtures/patrols';
import SideBar from '.';
import { PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../constants';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { UFA_NAVIGATION_UI: true },
}));
jest.mock('../ducks/patrols', () => ({
  ...jest.requireActual('../ducks/patrols'),
  fetchPatrols: jest.fn(),
}));
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useFeatureFlag: () => true,
}));

describe('SideBar', () => {
  let fetchPatrolsMock, map, store;
  beforeEach(() => {
    fetchPatrolsMock = jest.fn(() => () => ({ request: Promise.resolve() }));
    fetchPatrols.mockImplementation(fetchPatrolsMock);

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
        subjectGroups: [],
        user: {
          permissions: {
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ],
          }
        },
      },
      view: {
        hiddenAnalyzerIDs: [],
        userPreferences: { sidebarOpen: true, sidebarTab: TAB_KEYS.REPORTS },
      },
    };
  });

  test('shows the patrols tab if user has permissions', () => {
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.findByText('Patrols')).toBeDefined();
  });

  test('does not show the patrols tab if user has not permissions', () => {
    store.data.user.permissions = {};
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.queryByText('Patrols')).toBeNull();
  });

  test('sets the tab title for the Reports tab', () => {
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.getByRole('heading')).toHaveTextContent('Reports');
  });

  test('sets the tab title for the Patrols tab', () => {
    store.view.userPreferences.sidebarTab = TAB_KEYS.PATROLS;
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Patrols');
  });

  test('sets the tab title for the Map Layers tab', () => {
    store.view.userPreferences.sidebarTab = TAB_KEYS.LAYERS;
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Map Layers');
  });

  test('navigates to different tabs', () => {
    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    const tabs = screen.getAllByRole('tab');
    userEvent.click(tabs[1]);

    expect(mockStoreInstance.getActions()[0]).toEqual({
      payload: { sidebarOpen: true, sidebarTab: 'patrols' },
      type: 'UPDATE_USER_PREFERENCES',
    });

    waitFor(() => {
      userEvent.click(tabs[2]);
      expect(mockStoreInstance.getActions()[1]).toEqual({
        payload: { sidebarOpen: true, sidebarTab: 'layers' },
        type: 'UPDATE_USER_PREFERENCES',
      });
    });
  });

  test('shows the reports badge when an event update comes through the socket and sidebar is closed', () => {
    store.view.userPreferences.sidebarOpen = false;
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();

      const tabs = screen.getAllByRole('tab');
      userEvent.click(tabs[0]);

      expect(screen.queryByTestId('badgeIcon')).toBeNull();
    });
  });

  test('shows the reports badge when a new event comes through the socket and sidebar is closed', () => {
    store.view.userPreferences.sidebarOpen = false;
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('new_event', { matches_current_filter: true });

    waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('shows the reports badge also when the sidebar is open but not in the reports tab', () => {
    store.view.userPreferences.sidebarTab = TAB_KEYS.PATROLS;
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('removes the reports badge when the user opens the reports tab', () => {
    store.view.userPreferences.sidebarTab = TAB_KEYS.PATROLS;
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.queryByTestId('badgeIcon')).toBeNull();

    mockedSocket.socketClient.emit('update_event', { matches_current_filter: true });

    waitFor(() => {
      expect(screen.getByTestId('badgeIcon')).toBeDefined();
    });
  });

  test('does not show the report badge if sidebar is open in reports tab', () => {
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
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
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.getByTestId('sideBar-addReportButton')).not.toHaveClass('hidden');
  });

  test('hides the Add Report button in the map layers tab', () => {
    store.view.userPreferences.sidebarTab = TAB_KEYS.LAYERS;
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.getByTestId('sideBar-addReportButton')).toHaveClass('hidden');
  });

  test('closes the sidebar tabs when clicking the cross button', () => {
    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    const closeButton = screen.getByTestId('sideBar-closeButton');
    userEvent.click(closeButton);

    expect(mockStoreInstance.getActions()[0]).toEqual({
      payload: { sidebarOpen: false },
      type: 'UPDATE_USER_PREFERENCES',
    });
  });

  test('closes the sidebar tabs when clicking a tab that is currently open', () => {
    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    const tabs = screen.getAllByRole('tab');
    userEvent.click(tabs[0]);

    expect(mockStoreInstance.getActions()[0]).toEqual({
      payload: { sidebarOpen: false, sidebarTab: 'reports' },
      type: 'UPDATE_USER_PREFERENCES',
    });
  });
});
