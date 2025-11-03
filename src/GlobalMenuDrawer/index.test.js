import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { addModal } from '../ducks/modals';
import { createQuerySelectorMockImplementationWithHelpButtonReference } from '../JiraSupportWidget/index.test';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchTableauDashboard } from '../ducks/external-reporting';
import GlobalMenuDrawer from '.';
import { hideDrawer } from '../ducks/drawer';
import { mockStore } from '../__test-helpers/MockStore';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS, } from '../constants';
import { render, screen, within } from '../test-utils';
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
            [PERMISSION_KEYS.EVENTS]: [PERMISSIONS.EXPORT],
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ],
            [PERMISSION_KEYS.OBSERVATIONS]: [PERMISSIONS.EXPORT],
          }
        },
      },
      selectedUserProfile: null,
      view: {
        drawer: {},
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.ALERTS]: true,
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
          [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: true,
          [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: true,
          [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
          [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
          [SYSTEM_CONFIG_FLAGS.TABLEAU]: true,
        },
      },
    };
  });

  const renderGlobalMenuDrawer = () => render(<Provider store={mockStore(store)}>
    <GlobalMenuDrawer />
  </Provider>);

  test('hides the drawer when clicking the cross icon', async () => {
    renderGlobalMenuDrawer();

    expect(hideDrawer).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Close Main Menu' }));

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });

  test('does not render the navigation buttons in desktop screens', async () => {
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('navigation')).toBeNull();
  });

  test('renders the navigation buttons in small screens', async () => {
    useMatchMedia.mockImplementation(() => false);
    renderGlobalMenuDrawer();

    const navigation = screen.getByRole('navigation');

    expect(within(navigation).getByRole('link', { name: 'Events' })).toBeDefined();
    expect(within(navigation).getByRole('link', { name: 'Patrols' })).toBeDefined();
    expect(within(navigation).getByRole('link', { name: 'Map Layers' })).toBeDefined();
    expect(within(navigation).getByRole('link', { name: 'Settings' })).toBeDefined();
  });

  test('does not show the Patrols link if user does not have permissions', async () => {
    useMatchMedia.mockImplementation(() => false);
    store.data.user.permissions = {};
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('link', { name: 'Patrols' })).toBeNull();
  });

  test('does not show the Tableau button if it is not enabled', async () => {
    store.view.systemConfig.tableau_enabled = false;
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Tableau' })).toBeNull();
  });

  test('opens a window to the tableau dashboard when clicking the Tableau button ', async () => {
    global.open = jest.fn();
    renderGlobalMenuDrawer();

    expect(fetchTableauDashboard).toHaveBeenCalledTimes(0);
    expect(global.open).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Tableau' }));

    expect(fetchTableauDashboard).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledWith('tableau url ', '_blank', 'noopener,noreferrer');
  });

  test('does not show the Alerts button if it is not enabled', async () => {
    store.view.systemConfig.alerts_enabled = false;
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Alerts' })).toBeNull();
  });

  test('opens the alerts modal when clicking the Alerts button ', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Alerts' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Alerts');
  });

  test('forwards the click to the Jira Support Management widget Help button when clicking Contact Support', async () => {
    const [mockQuerySelector, mockHelpButton] = createQuerySelectorMockImplementationWithHelpButtonReference();
    jest.spyOn(global.document, 'querySelector').mockImplementation(mockQuerySelector);

    renderGlobalMenuDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Contact Support' }));

    expect(mockHelpButton.click).toHaveBeenCalled();
  });

  test('If the Jira Help button is not available, shows a link to send an email to the Help Center', async () => {
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'Contact Support' }))
      .toHaveAttribute('href', 'mailto:support@pamdas.org?subject=Support request from user&body=How can we help you?');
  });

  test('opens the daily report modal when clicking the Daily Report button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Daily Report' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Daily Report');
  });

  test('opens the kml export modal when clicking the Master KML button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Subject KML' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Subject KML');
  });

  test('does not show the subject information button if a user doesn\'t have export observation data permissions', async () => {
    delete store.data.user.permissions[PERMISSION_KEYS.OBSERVATIONS];
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Subject Summary' })).toBeNull();
  });

  test('opens the subject information modal when clicking the Subject Information button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Subject Summary' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Subject Summary');
  });

  test('does not show the subject reports button if a user doesn\'t have export observation data permissions', async () => {
    delete store.data.user.permissions[PERMISSION_KEYS.OBSERVATIONS];
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Observations' })).toBeNull();
  });

  test('opens the subject reports modal when clicking the Subject Reports button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Observations' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Observations');
  });

  test('does not show the Field Reports button if a user doesn\'t have export event data permissions', async () => {
    delete store.data.user.permissions[PERMISSION_KEYS.EVENTS];
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Field Events' })).toBeNull();
  });

  test('opens the field reports modal when clicking the Field Reports button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Field Events' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Field Events');
  });

  test('when the global menu drawer is open the close button gets focused and there is a focus trap', async () => {
    const { rerender } = renderGlobalMenuDrawer();

    const closeButton = screen.getByRole('button', { name: 'Close Main Menu' });

    expect(closeButton).not.toBe(document.activeElement);

    store.view.drawer = { drawerId: 'global-menu', isOpen: true };
    rerender(<Provider store={mockStore(store)}>
      <GlobalMenuDrawer />
    </Provider>);

    expect(closeButton).toBe(document.activeElement);

    await userEvent.keyboard('[Tab]');

    expect(screen.getByRole('button', { name: 'Tableau' })).toBe(document.activeElement);

    await userEvent.keyboard('{Shift>}[Tab]{/Shift}');

    expect(closeButton).toBe(document.activeElement);

    await userEvent.keyboard('{Shift>}[Tab]{/Shift}');
    const dataPrivacyPolicyLink = screen.getByRole('link', { name: 'Data Privacy Policy' });

    expect(dataPrivacyPolicyLink).toBe(document.activeElement);

    await userEvent.keyboard('{Shift>}[Tab]{/Shift}');

    expect(screen.getByRole('link', { name: 'Website Privacy Policy' })).toBe(document.activeElement);

    await userEvent.keyboard('[Tab]');

    expect(dataPrivacyPolicyLink).toBe(document.activeElement);

    await userEvent.keyboard('[Tab]');

    expect(closeButton).toBe(document.activeElement);
  });
});
