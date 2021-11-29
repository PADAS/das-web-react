import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { addModal } from '../ducks/modals';
import DataExportMenu, {
  COMMUNITY_SITE_URL,
  CONTACT_SUPPORT_EMAIL_ADDRESS,
  DOCUMENTATION_SITE_URL,
} from './';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchTableauDashboard } from '../ducks/external-reporting';
import { mockStore } from '../__test-helpers/MockStore';

jest.mock('../ducks/modals', () => ({
  ...jest.requireActual('../ducks/modals'),
  addModal: jest.fn(),
}));
jest.mock('../ducks/external-reporting', () => ({
  ...jest.requireActual('../ducks/external-reporting'),
  fetchTableauDashboard: jest.fn(),
}));

describe('DataExportMenu', () => {
  let addModalMock, store;
  beforeEach(() => {
    addModalMock = jest.fn(() => () => {});
    addModal.mockImplementation(addModalMock);

    store = {
      data: { eventTypes, token: { access_token: '' } },
      view: {
        systemConfig: { zendeskEnabled: false, alerts_enabled: false, tableau_enabled: false },
        userPreferences: {},
      },
    };

    render(
      <Provider store={mockStore(store)}>
        <DataExportMenu />
      </Provider>
    );
  });

  test('opens the hamburger menu', async () => {
    let hamburgerButton = await screen.findByRole('button');

    expect(hamburgerButton.classList).toMatchObject({ 0: 'hamburger' });

    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);
    hamburgerButton = (await screen.findAllByRole('button'))[0];

    expect(hamburgerButton.classList).toMatchObject({ 0: 'hamburger', 1: 'open' });
  });

  test('does not render the Tableau button if it is not enabled', async () => {
    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    await waitFor(async () => {
      expect(screen.queryByText('Analysis (via Tableau)')).toBeNull();
    });
  });

  test('renders the Tableau button if it is enabled', async () => {
    store.view.systemConfig.tableau_enabled = true;
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <DataExportMenu />
      </Provider>
    );

    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    expect(screen.findByText('Analysis (via Tableau)')).toBeTruthy();
  });

  test('open a new window redirecting to tableau', async () => {
    global.open = jest.fn();
    const fetchTableauDashboardMock = jest.fn(() => () => Promise.resolve({ display_url: 'display_url' }));
    fetchTableauDashboard.mockImplementation(fetchTableauDashboardMock);
    store.view.systemConfig.tableau_enabled = true;
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <DataExportMenu />
      </Provider>
    );

    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    expect(fetchTableauDashboardMock).toHaveBeenCalledTimes(0);
    expect(global.open).toHaveBeenCalledTimes(0);

    await waitFor(async () => {
      const tableauButton = await screen.findByText('Analysis (via Tableau)');
      userEvent.click(tableauButton);
    });

    expect(fetchTableauDashboardMock).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledWith('display_url', '_blank', 'noopener,noreferrer');
  });

  test('does not render the Alerts button if it is not enabled', async () => {
    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    expect(screen.queryByText('Alerts')).toBeNull();
  });

  test('renders the Alerts button if it is enabled', async () => {
    store.view.systemConfig.alerts_enabled = true;
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <DataExportMenu />
      </Provider>
    );

    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    expect(screen.findByText('Alerts')).toBeTruthy();
  });

  test('adds a modal if the alerts button is clicked', async () => {
    store.view.systemConfig.alerts_enabled = true;
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <DataExportMenu />
      </Provider>
    );

    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    await waitFor(async () => {
      const alertsButton = await screen.findByText('Alerts');
      userEvent.click(alertsButton);
    });

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0]).toMatchObject({ title: 'Alerts' });
  });

  test('adds a modal if any other dropdown modal button is clicked', async () => {
    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    await waitFor(async () => {
      const fieldReportsButton = (await screen.findAllByRole('button'))[1];
      userEvent.click(fieldReportsButton);
    });

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0]).toMatchObject({ title: 'Field Reports' });
  });

  test('opens zendesk when clickin the support button if it is active', async () => {
    global.zE = { activate: jest.fn() };
    store.view.systemConfig.zendeskEnabled = true;
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <DataExportMenu />
      </Provider>
    );

    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    expect(global.zE.activate).toHaveBeenCalledTimes(0);

    await waitFor(async () => {
      const contactSupportButton = await screen.getByText('Contact Support');
      userEvent.click(contactSupportButton);
    });

    expect(global.zE.activate).toHaveBeenCalledTimes(1);
    expect(global.zE.activate).toHaveBeenCalledWith({ hideOnClose: true });
  });

  test('opens an email window with the support contact data if zendesk is not active', async () => {
    global.open = jest.fn();
    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    expect(global.open).toHaveBeenCalledTimes(0);

    await waitFor(async () => {
      const contactSupportButton = await screen.findByText('Contact Support');
      userEvent.click(contactSupportButton);
    });

    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open.mock.calls[0][0].substring(0, 25)).toBe(`mailto:${CONTACT_SUPPORT_EMAIL_ADDRESS}`);
  });

  test('opens a new window redirecting to the community site', async () => {
    global.open = jest.fn();
    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    expect(global.open).toHaveBeenCalledTimes(0);

    await waitFor(async () => {
      const communityButton = await screen.findByText('Community');
      userEvent.click(communityButton);
    });

    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledWith(COMMUNITY_SITE_URL, '_blank', 'noopener,noreferrer');
  });

  test('opens a new window redirecting to the documentation site', async () => {
    global.open = jest.fn();
    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    expect(global.open).toHaveBeenCalledTimes(0);

    await waitFor(async () => {
      const documentationButton = await screen.findByText('Documentation');
      userEvent.click(documentationButton);
    });

    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledWith(DOCUMENTATION_SITE_URL, '_blank', 'noopener,noreferrer');
  });

  test('adds a modal if the about button is clicked', async () => {
    const dropdownToggle = await screen.findByTestId('dataExport-dropdown-toggle');
    userEvent.click(dropdownToggle);

    await waitFor(async () => {
      const aboutButton = await screen.findByText('About EarthRanger');
      userEvent.click(aboutButton);
    });

    expect(addModal).toHaveBeenCalledTimes(1);
  });
});
