import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchPatrols } from '../ducks/patrols';
import { hideDetailView } from '../ducks/vertical-navigation-bar';
import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { INITIAL_PATROLS_STATE } from '../ducks/patrols';
import MockSocketProvider, { mockedSocket } from '../__test-helpers/MockSocketContext';
import { mockStore } from '../__test-helpers/MockStore';
import patrols, { newPatrol } from '../__test-helpers/fixtures/patrols';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import SideBar from '.';
import { PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../constants';
import { report } from '../__test-helpers/fixtures/reports';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { ENABLE_NEW_CLUSTERING: true, ENABLE_UFA_NAVIGATION_UI: true },
}));
jest.mock('../ducks/patrols', () => ({
  ...jest.requireActual('../ducks/patrols'),
  fetchPatrols: jest.fn(),
}));
jest.mock('../ducks/vertical-navigation-bar', () => ({
  ...jest.requireActual('../ducks/vertical-navigation-bar'),
  hideDetailView: jest.fn(),
}));
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useFeatureFlag: () => true,
}));

describe('SideBar', () => {
  let fetchPatrolsMock, hideDetailViewMock, map, store;
  beforeEach(() => {
    fetchPatrolsMock = jest.fn(() => () => ({ request: Promise.resolve() }));
    fetchPatrols.mockImplementation(fetchPatrolsMock);
    hideDetailViewMock = jest.fn(() => () => {});
    hideDetailView.mockImplementation(hideDetailViewMock);

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
        userPreferences: { sidebarOpen: true },
        verticalNavigationBar: { currentTab: TAB_KEYS.REPORTS, showDetailView: false },
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
    store.view.verticalNavigationBar.currentTab = TAB_KEYS.PATROLS;
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
    store.view.verticalNavigationBar.currentTab = TAB_KEYS.LAYERS;
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
      payload: { sidebarOpen: true },
      type: 'UPDATE_USER_PREFERENCES',
    });
    expect(mockStoreInstance.getActions()[1]).toEqual({
      payload: { currentTab: 'patrols' },
      type: 'OPEN_TAB',
    });

    waitFor(() => {
      userEvent.click(tabs[2]);
      expect(mockStoreInstance.getActions()[2]).toEqual({
        payload: { sidebarOpen: true },
        type: 'UPDATE_USER_PREFERENCES',
      });
      expect(mockStoreInstance.getActions()[3]).toEqual({
        payload: { currentTab: 'layers' },
        type: 'OPEN_TAB',
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
    store.view.verticalNavigationBar.currentTab = TAB_KEYS.PATROLS;
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
    store.view.verticalNavigationBar.currentTab = TAB_KEYS.PATROLS;
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
    store.view.verticalNavigationBar.currentTab = TAB_KEYS.LAYERS;
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
      payload: { sidebarOpen: false },
      type: 'UPDATE_USER_PREFERENCES',
    });
  });

  test('shows a back button if the detail view of the current tab is open', () => {
    store.view.verticalNavigationBar = { data: { report }, showDetailView: true };
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.getByTestId('sideBar-backDetailViewButton')).toBeDefined();
  });

  test('does not show the back button if the detail view of another tab is open', () => {
    store.view.verticalNavigationBar = { currentTab: TAB_KEYS.PATROLS, data: { report }, showDetailView: true };
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(screen.queryByTestId('sideBar-backDetailViewButton')).toBeNull();
  });

  test('hides the report detail view if it was opened but user clicked the back button', () => {
    store.view.verticalNavigationBar = { data: { report }, showDetailView: true };
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(hideDetailView).toHaveBeenCalledTimes(0);

    const backDetailViewButton = screen.getByTestId('sideBar-backDetailViewButton');
    userEvent.click(backDetailViewButton);

    expect(hideDetailView).toHaveBeenCalledTimes(1);
  });

  test('hides the patrol detail view if it was opened but user clicked the back button', () => {
    store.view.verticalNavigationBar = { currentTab: TAB_KEYS.PATROLS, data: newPatrol, showDetailView: true };
    render(
      <Provider store={mockStore(store)}>
        <MockSocketProvider>
          <SideBar map={map} />
        </MockSocketProvider>
      </Provider>
    );

    expect(hideDetailView).toHaveBeenCalledTimes(0);

    const backDetailViewButton = screen.getByTestId('sideBar-backDetailViewButton');
    userEvent.click(backDetailViewButton);

    expect(hideDetailView).toHaveBeenCalledTimes(1);
  });
});
