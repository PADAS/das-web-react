import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../__test-helpers/MockStore';
import { render, screen, within } from '../test-utils';
import { STATUSES } from '../constants';

import SystemStatus from './';

describe('SystemStatus', () => {
  let store;

  beforeEach(() => {
    store = {
      data: {
        systemStatus: {
          network: {
            details: 'online',
            status: STATUSES.HEALTHY_STATUS,
            title: 'Network',
          },
          realtime: {
            details: 'Activity',
            status: STATUSES.HEALTHY_STATUS,
            timestamp: '2022-02-15T18:06:56.657Z',
            title: 'EarthRanger Realtime',
          },
          server: {
            details: 'https://develop.pamdas.org',
            status: STATUSES.HEALTHY_STATUS,
            title: 'EarthRanger Server 2.43.1-dev.30033',
            version: '2.43.1-dev.30033',
          },
          services: [{
            datasource: { timestamp: null, title: null },
            heartbeat: { timestamp: '2022-02-15T18:06:56.657Z', title: null },
            provider_key: 'gundi',
            status: STATUSES.WARNING_STATUS,
            title: 'Gundi',
          }],
        },
      },
    };
  });

  const renderSystemStatus = () => render(<Provider store={mockStore(store)}>
    <SystemStatus />
  </Provider>);

  const getToggle = () => screen.getByRole('button', { name: /^System status:/ });

  test('names the toggle after the worst status of the system', () => {
    renderSystemStatus();

    expect(getToggle()).toHaveAccessibleName('System status: Warning');
    expect(getToggle()).toHaveAttribute('title', 'System status');
    expect(getToggle()).toHaveTextContent('Warning');
  });

  test('names the toggle healthy when every part of the system is healthy', () => {
    store.data.systemStatus.services = [];

    renderSystemStatus();

    expect(getToggle()).toHaveAccessibleName('System status: Healthy');
  });

  test('names the toggle unhealthy when a part of the system is unhealthy', () => {
    store.data.systemStatus.network.status = STATUSES.UNHEALTHY_STATUS;

    renderSystemStatus();

    expect(getToggle()).toHaveAccessibleName('System status: Unhealthy');
  });

  test('names the toggle unhealthy when a part of the system is in an unknown state', () => {
    store.data.systemStatus.realtime.status = STATUSES.UNKNOWN_STATUS;

    renderSystemStatus();

    expect(getToggle()).toHaveAccessibleName('System status: Unhealthy');
  });

  test('shows the toggle collapsed, with the popover closed, by default', () => {
    renderSystemStatus();

    expect(getToggle()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opens the popover and focuses it when the user clicks the toggle', async () => {
    renderSystemStatus();

    await userEvent.click(getToggle());

    const popover = await screen.findByRole('dialog', { name: 'System status' });

    expect(popover).toHaveFocus();
    expect(getToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(getToggle()).toHaveAttribute('aria-controls', popover.id);
  });

  test('lists each part of the system, naming its status for assistive technology', async () => {
    renderSystemStatus();

    await userEvent.click(getToggle());

    const statusItems = within(await screen.findByRole('dialog')).getAllByRole('listitem');

    expect(statusItems).toHaveLength(4);
    expect(statusItems[0]).toHaveTextContent('Network');
    expect(statusItems[0]).toHaveTextContent('Healthy');
    expect(statusItems[3]).toHaveTextContent('Gundi');
    expect(statusItems[3]).toHaveTextContent('Warning');
  });

  test('shows the server address without its protocol', async () => {
    renderSystemStatus();

    await userEvent.click(getToggle());

    expect(await screen.findByText('develop.pamdas.org')).toBeInTheDocument();
  });

  test('lists the activity of a service, falling back to default titles', async () => {
    renderSystemStatus();

    await userEvent.click(getToggle());

    const serviceItem = within(await screen.findByRole('dialog')).getAllByRole('listitem')[3];

    expect(serviceItem).toHaveTextContent('system activity:');
    expect(serviceItem).toHaveTextContent('device activity');
  });

  test('closes the popover and returns focus to the toggle when the user presses escape', async () => {
    renderSystemStatus();

    await userEvent.click(getToggle());
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getToggle()).toHaveFocus();
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes the popover when the user clicks the toggle again', async () => {
    renderSystemStatus();

    await userEvent.click(getToggle());
    await screen.findByRole('dialog');
    await userEvent.click(getToggle());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('closes the popover and moves on from the toggle when the user tabs', async () => {
    render(<Provider store={mockStore(store)}>
      <SystemStatus />

      <button type="button">Next control</button>
    </Provider>);

    await userEvent.click(getToggle());
    await screen.findByRole('dialog');
    await userEvent.tab();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next control' })).toHaveFocus();
  });
});
