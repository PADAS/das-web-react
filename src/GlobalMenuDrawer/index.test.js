import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { addModal } from '../ducks/modals';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchTableauDashboard } from '../ducks/external-reporting';
import GlobalMenuDrawer from '.';
import { hideDrawer } from '../ducks/drawer';
import { mockStore } from '../__test-helpers/MockStore';

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
  useFeatureFlag: () => true,
}));

describe('GlobalMenuDrawer', () => {
  let addModalMock, fetchTableauDashboardMock, hideDrawerMock, store;
  beforeEach(() => {
    addModalMock = jest.fn(() => () => {});
    addModal.mockImplementation(addModalMock);
    fetchTableauDashboardMock = jest.fn(() => () => Promise.resolve({ display_url: 'tableau url ' }));
    fetchTableauDashboard.mockImplementation(fetchTableauDashboardMock);
    hideDrawerMock = jest.fn(() => () => {});
    hideDrawer.mockImplementation(hideDrawerMock);

    store = {
      data: {
        eventFilter: {},
        eventTypes,
        systemStatus: {
          server: { version: '' },
        },
        token: { access_token: '' },
      },
      view: {
        systemConfig: {
          alerts_enabled: true,
          tableau_enabled: true,
          zendeskEnabled: true,
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

  test('activates ZD when clicking the Contact Support button and ZD is enabled', async () => {
    global.zE = { activate: jest.fn() };
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(global.zE.activate).toHaveBeenCalledTimes(0);

    const contactSupportButton = await screen.findByText('Contact Support');
    userEvent.click(contactSupportButton);

    expect(global.zE.activate).toHaveBeenCalledTimes(1);
    expect(global.zE.activate).toHaveBeenCalledWith({ hideOnClose: true });
  });

  test('opens a mailto when clicking the Contact Support button and ZD is not enabled', async () => {
    global.open = jest.fn();
    store.view.systemConfig.zendeskEnabled = false;
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(global.open).toHaveBeenCalledTimes(0);

    const contactSupportButton = await screen.findByText('Contact Support');
    userEvent.click(contactSupportButton);

    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledWith('mailto:support@pamdas.org?subject=Support request from user&body=How can we help you?', '_self');
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

  test('opens the field reports modal when clicking the Field Reports button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(addModal).toHaveBeenCalledTimes(0);

    const fieldReportsButton = await screen.findByText('Field Reports');
    userEvent.click(fieldReportsButton);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Field Reports');
  });

  test('opens the kml export modal when clicking the Master KML button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(addModal).toHaveBeenCalledTimes(0);

    const masterKMLButton = await screen.findByText('Master KML');
    userEvent.click(masterKMLButton);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Master KML');
  });

  test('opens the subject information modal when clicking the Subject Information button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(addModal).toHaveBeenCalledTimes(0);

    const subjectInformationButton = await screen.findByText('Subject Information');
    userEvent.click(subjectInformationButton);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Subject Information');
  });

  test('opens the subject reports modal when clicking the Subject Reports button', async () => {
    render(
      <Provider store={mockStore(store)}>
        <GlobalMenuDrawer />
      </Provider>
    );

    expect(addModal).toHaveBeenCalledTimes(0);

    const subjectReportsButton = await screen.findByText('Subject Reports');
    userEvent.click(subjectReportsButton);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Subject Reports');
  });
});
