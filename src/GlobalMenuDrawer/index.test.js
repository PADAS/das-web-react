import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { addModal } from '../ducks/modals';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchTableauDashboard } from '../ducks/external-reporting';
import GlobalMenuDrawer from '.';
import { hideDrawer } from '../ducks/drawer';
import { mockStore } from '../__test-helpers/MockStore';
import { createQuerySelectorMockImplementationWithHelpButtonReference } from '../JiraSupportWidget/index.test';
import { PERMISSION_KEYS, PERMISSIONS, } from '../constants';
import { render, screen, waitFor } from '../test-utils';
import { useMatchMedia } from '../hooks';
import useNavigate from '../hooks/useNavigate';

jest.mock('../ducks/modals', () => ({
  ...jest.requireActual('../ducks/modals'),
  addModal: jest.fn(),
}));
jest.mock('../ducks/external-reporting', () => ({
  ...jest.requireActual('../ducks/external-reporting'),
  fetchTableauDashboard: jest.fn(),
}));
jest.mock('../ducks/drawer', () => ({
  ...jest.requireActual('../ducks/drawer'),
  hideDrawer: jest.fn(),
}));
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useSystemConfigFlag: () => true,
  useMatchMedia: jest.fn(),
}));
jest.mock('../hooks/useNavigate', () => jest.fn());

describe('GlobalMenuDrawer', () => {
  let addModalMock, fetchTableauDashboardMock, hideDrawerMock, navigate, store, useMatchMediaMock, useNavigateMock;
  beforeEach(() => {
    addModalMock = jest.fn(() => () => { });
    addModal.mockImplementation(addModalMock);
    fetchTableauDashboardMock = jest.fn(() => () => Promise.resolve({ display_url: 'tableau url ' }));
    fetchTableauDashboard.mockImplementation(fetchTableauDashboardMock);
    hideDrawerMock = jest.fn(() => () => { });
    hideDrawer.mockImplementation(hideDrawerMock);
    useMatchMediaMock = jest.fn(() => true);
    useMatchMedia.mockImplementation(useMatchMediaMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = {
      data: {
        eventFilter: {},
        eventTypes,
        systemStatus: {
          server: { version: '' },
        },
        token: { access_token: '' },
        user: {
          permissions: {
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ],
            [PERMISSION_KEYS.EVENTS_EXPORT]: [PERMISSIONS.EXPORT],
            [PERMISSION_KEYS.OBSERVATIONS_EXPORT]: [PERMISSIONS.EXPORT],
          }
        },
      },
      selectedUserProfile: null,
      view: {
        featureFlagOverrides: {},
        systemConfig: {
          alerts_enabled: true,
          tableau_enabled: true,
        },
      },
    };
  });

  test('hides the drawer when clicking the cross icon', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(hideDrawer).toHaveBeenCalledTimes(0);

    const crossButton = (await screen.findAllByRole('button'))[0];
    userEvent.click(crossButton);

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });

  test('does not render the navigation buttons in desktop screens', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect((await screen.queryByText('Reports'))).toBeNull();
    expect((await screen.queryByText('Patrols'))).toBeNull();
    expect((await screen.queryByText('Map Layers'))).toBeNull();
  });

  test('renders the navigation buttons in small screens', async () => {
    useMatchMedia.mockImplementation(() => false);
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect((await screen.findByText('Events'))).toBeDefined();
    expect((await screen.findByText('Patrols'))).toBeDefined();
    expect((await screen.findByText('Map Layers'))).toBeDefined();
  });

  test('navigates to the Reports tab in the Sidebar when clicking the Reports navigation button', async () => {
    useMatchMedia.mockImplementation(() => false);
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const reportsNavigationButton = await screen.findByText('Events');
    userEvent.click(reportsNavigationButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/events');
  });

  test('does not render the Patrols navigation button if user does not have permissions', async () => {
    useMatchMedia.mockImplementation(() => false);
    store.data.user.permissions = {};
    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect((await screen.queryByText('Patrols'))).toBeNull();
  });

  test('navigates to the Patrols tab in the Sidebar when clicking the Patrols navigation button', async () => {
    useMatchMedia.mockImplementation(() => false);
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const patrolsNavigationButton = await screen.findByText('Patrols');
    userEvent.click(patrolsNavigationButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/patrols');
  });

  test('navigates to the Map Layers tab in the Sidebar when clicking the Map Layers navigation button', async () => {
    useMatchMedia.mockImplementation(() => false);
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const mapLayersNavigationButton = await screen.findByText('Map Layers');
    userEvent.click(mapLayersNavigationButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/layers');
  });

  test('does not render Tableau button if it is not enabled', async () => {
    store.view.systemConfig.tableau_enabled = false;
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect((await screen.queryByText('Tableau'))).toBeNull();
  });

  test('opens a window to the tableau dashboard when clicking the Tableau button ', async () => {
    global.open = jest.fn();
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(fetchTableauDashboard).toHaveBeenCalledTimes(0);
    expect(global.open).toHaveBeenCalledTimes(0);

    const tableauButton = await screen.findByText('Tableau');
    userEvent.click(tableauButton);

    expect(fetchTableauDashboard).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(global.open).toHaveBeenCalledTimes(1);
      expect(global.open).toHaveBeenCalledWith('tableau url ', '_blank', 'noopener,noreferrer');
    });
  });

  test('does not render Alerts button if it is not enabled', async () => {
    store.view.systemConfig.alerts_enabled = false;
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect((await screen.queryByText('Alerts'))).toBeNull();
  });

  test('opens the alerts modal when clicking the Alerts button ', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(addModal).toHaveBeenCalledTimes(0);

    const alertsButton = await screen.findByText('Alerts');
    userEvent.click(alertsButton);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Alerts');
  });

  test('clicks the "show" button inside the Jira Support Management widget when clicking "Contact Support"', async () => {
    const [mockQuerySelector, mockHelpButton] = createQuerySelectorMockImplementationWithHelpButtonReference();

    jest.spyOn(global.document, 'querySelector').mockImplementation(mockQuerySelector);

    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(global.open).toHaveBeenCalledTimes(0);

    const supportButton = await screen.findByText('Contact Support');
    userEvent.click(supportButton);

    expect(mockHelpButton.click).toHaveBeenCalled();
  });

  test('opens a page to the help center site when clicking the Help Center button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(global.open).toHaveBeenCalledTimes(0);

    const helpCenterButton = await screen.findByText('Help Center');
    userEvent.click(helpCenterButton);

    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledWith('https://support.earthranger.com/', '_blank', 'noopener,noreferrer');
  });

  test('opens a page to the community site when clicking the Community button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(global.open).toHaveBeenCalledTimes(0);

    const communityButton = await screen.findByText('Community');
    userEvent.click(communityButton);

    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledWith('https://Community.EarthRanger.com', '_blank', 'noopener,noreferrer');
  });

  test('opens a page to the users guide site when clicking the User\'s Guide button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(global.open).toHaveBeenCalledTimes(0);

    const usersGuideButton = await screen.findByText('User\'s Guide');
    userEvent.click(usersGuideButton);

    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledWith('https://community.earthranger.com/t/earthranger-users-guide/60', '_blank', 'noopener,noreferrer');
  });

  test('opens the daily report modal when clicking the Daily Report button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(addModal).toHaveBeenCalledTimes(0);

    const dailyReportButton = await screen.findByText('Daily Report');
    userEvent.click(dailyReportButton);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Daily Report');
  });

  describe('exporting field reports', () => {
    const getFieldEventsButton = () => screen.queryByText('Field Events');

    test('does not show the Field Reports button if a user doesn\'t have export event data permissions', () => {
      delete store.data.user.permissions[PERMISSION_KEYS.EVENTS_EXPORT];

      render(
        <Provider store={mockStore(store)}>
          <GlobalMenuDrawer />
        </Provider>
      );

      const fieldEventsButton = getFieldEventsButton();

      expect(fieldEventsButton).toBeNull();
    });

    test('opens the field reports modal when clicking the Field Reports button', () => {
      render(
        <Provider store={mockStore(store)}>
          <GlobalMenuDrawer />
        </Provider>
      );

      expect(addModal).toHaveBeenCalledTimes(0);

      const fieldEventsButton = getFieldEventsButton();
      userEvent.click(fieldEventsButton);

      expect(addModal).toHaveBeenCalledTimes(1);
      expect(addModal.mock.calls[0][0].title).toBe('Field Events');
    });
  });


  test('opens the kml export modal when clicking the Master KML button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(addModal).toHaveBeenCalledTimes(0);

    const masterKMLButton = await screen.findByText('Subject KML');
    userEvent.click(masterKMLButton);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Subject KML');
  });


  describe('exporting subject information', () => {
    const getSubjectInfoButton = () => screen.queryByText('Subject Summary');

    test('does not show the subject information link if a user doesn\'t have export observation data permissions', () => {
      delete store.data.user.permissions[PERMISSION_KEYS.OBSERVATIONS_EXPORT];

      render(
        <Provider store={mockStore(store)}>
          <GlobalMenuDrawer />
        </Provider>
      );

      const subjectInfoButton = getSubjectInfoButton();
      expect(subjectInfoButton).toBeNull();
    });

    test('opens the subject information modal when clicking the Subject Information button', () => {
      render(
        <Provider store={mockStore(store)}>
          <GlobalMenuDrawer />
        </Provider>
      );

      expect(addModal).toHaveBeenCalledTimes(0);

      const subjectInfoButton = getSubjectInfoButton();
      userEvent.click(subjectInfoButton);

      expect(addModal).toHaveBeenCalledTimes(1);
      expect(addModal.mock.calls[0][0].title).toBe('Subject Summary');
    });
  });

  describe('exporting subject reports', () => {
    const getSubjectReportsButton = () => screen.queryByText('Observations');

    test('does not show the subject reports link if a user doesn\'t have export observation data permissions', () => {
      delete store.data.user.permissions[PERMISSION_KEYS.OBSERVATIONS_EXPORT];

      render(
        <Provider store={mockStore(store)}>
          <GlobalMenuDrawer />
        </Provider>
      );

      const subjectReportsButton = getSubjectReportsButton();
      expect(subjectReportsButton).toBeNull();
    });

    test('opens the subject reports modal when clicking the Subject Reports button', () => {
      render(
        <Provider store={mockStore(store)}>
          <GlobalMenuDrawer />
        </Provider>
      );

      expect(addModal).toHaveBeenCalledTimes(0);

      const subjectReportsButton = getSubjectReportsButton();
      userEvent.click(subjectReportsButton);

      expect(addModal).toHaveBeenCalledTimes(1);
      expect(addModal.mock.calls[0][0].title).toBe('Observations');
    });
  });


  test('lists links to various privacy and data policies', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    const eulaLink = await screen.getByTestId('eula-link');
    const sitePrivacyPolicyLink = await screen.getByTestId('website-privacy-policy');
    const dataPrivacyPolicyLink = await screen.getByTestId('data-privacy-policy');

    [eulaLink, sitePrivacyPolicyLink, dataPrivacyPolicyLink].forEach((item) => {
      expect(item).toHaveAttribute('rel', 'noreferrer');
      expect(item).toHaveAttribute('target', '_blank');
      expect(item).toHaveAttribute('href');
    });
  });
});
