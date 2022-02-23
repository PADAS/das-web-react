import React from 'react';
import { render, screen } from '@testing-library/react';
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

  test('renders the indicator for a healthy status', async () => {
    render(
      <Provider store={mockStore(store)}>
        <SystemStatus />
      </Provider>
    );

    expect((await screen.findByTestId('badgeIcon'))).toHaveClass('green');
    expect((await screen.findByTestId('systemStatus-statusLabel'))).toHaveTextContent('Healthy');
  });

  test('renders the indicator for a warning status', async () => {
    store.data.systemStatus.network.status = STATUSES.WARNING_STATUS;
    render(
      <Provider store={mockStore(store)}>
        <SystemStatus />
      </Provider>
    );

    expect((await screen.findByTestId('badgeIcon'))).toHaveClass('orange');
    expect((await screen.findByTestId('systemStatus-statusLabel'))).toHaveTextContent('Warning');
  });

  test('renders the indicator for an unhealthy status', async () => {
    store.data.systemStatus.network.status = STATUSES.UNHEALTHY_STATUS;
    render(
      <Provider store={mockStore(store)}>
        <SystemStatus />
      </Provider>
    );

    expect((await screen.findByTestId('badgeIcon'))).toHaveClass('red');
    expect((await screen.findByTestId('systemStatus-statusLabel'))).toHaveTextContent('Unhealthy');
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

  test('updates the style of the indicator when the user opens the menu', async () => {
    render(
      <Provider store={mockStore(store)}>
        <SystemStatus />
      </Provider>
    );

    expect((await screen.findByText('arrow-down-small.svg'))).toBeDefined();
    expect((await screen.queryByText('arrow-up-small.svg'))).toBeNull();
    expect((await screen.findByTestId('systemStatus-indicator'))).not.toHaveClass('open');

    const statusIndicatorToggle = await screen.findByRole('button');
    userEvent.click(statusIndicatorToggle);

    expect((await screen.queryByText('arrow-down-small.svg'))).toBeNull();
    expect((await screen.findByText('arrow-up-small.svg'))).toBeDefined();
    expect((await screen.findByTestId('systemStatus-indicator'))).toHaveClass('open');
  });
});
