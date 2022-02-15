import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../__test-helpers/MockStore';
import { STATUSES } from '../constants';
import SystemStatus from './';

describe('SystemStatus', () => {
  let store;
  beforeEach(() => {
    store = {
      data: {
        systemStatus: {
          network: {
            title: 'Network',
            status: STATUSES.HEALTHY_STATUS,
            details: 'online',
          },
          server: {
            version: '2.43.1-dev.30033',
            details: 'https://develop.pamdas.org',
            status: STATUSES.HEALTHY_STATUS,
            title: 'EarthRanger Server 2.43.1-dev.30033',
          },
          realtime: {
            title: 'EarthRanger Realtime',
            status: STATUSES.HEALTHY_STATUS,
            details: 'Activity',
            timestamp: '2022-02-15T18:06:56.657Z',
          },
          services: [],
        }
      }
    };
  });

  test('renders the badge color depending on the worst system status', async () => {
    render(
      <Provider store={mockStore(store)}>
        <SystemStatus />
      </Provider>
    );

    expect((await screen.findByTestId('badgeIcon'))).toHaveClass('green');

    cleanup();

    store.data.systemStatus.network.status = STATUSES.WARNING_STATUS;
    render(
      <Provider store={mockStore(store)}>
        <SystemStatus />
      </Provider>
    );

    expect((await screen.findByTestId('badgeIcon'))).toHaveClass('orange');

    cleanup();

    store.data.systemStatus.server.status = STATUSES.UNHEALTHY_STATUS;
    render(
      <Provider store={mockStore(store)}>
        <SystemStatus />
      </Provider>
    );

    expect((await screen.findByTestId('badgeIcon'))).toHaveClass('red');
  });

  test('opens the menu when the user clicks the systems status indicator', async () => {
    render(
      <Provider store={mockStore(store)}>
        <SystemStatus />
      </Provider>
    );

    expect((await screen.queryByText('Network'))).toBeNull();
    expect((await screen.queryByText('EarthRanger Server 2.43.1-dev.30033'))).toBeNull();
    expect((await screen.queryByText('EarthRanger Realtime'))).toBeNull();

    const statusIndicatorToggle = await screen.findByRole('button');
    userEvent.click(statusIndicatorToggle);

    expect((await screen.findByText('Network'))).toBeDefined();
    expect((await screen.findByText('EarthRanger Server 2.43.1-dev.30033'))).toBeDefined();
    expect((await screen.findByText('EarthRanger Realtime'))).toBeDefined();
  });
});
