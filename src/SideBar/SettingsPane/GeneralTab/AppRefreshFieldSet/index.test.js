import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../test-utils';

import AppRefreshFieldSet from './';

describe('SideBar - SettingsPane - GeneralTab - AppRefreshFieldSet', () => {
  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, 'setItem');
  });

  const renderAppRefreshFieldSet = (props) => render(<AppRefreshFieldSet {...props} />);

  test('updates the map position and zoom level setting when user interacts with its checkbox', async () => {
    renderAppRefreshFieldSet();

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(4);
    expect(global.localStorage.setItem).not.toHaveBeenCalledWith(
      'er-web-restorable:mapPosition',
      JSON.stringify({ restore: true })
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Map Position & Zoom Level' }));

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(5);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:mapPosition',
      JSON.stringify({ restore: true })
    );
  });

  test('updates the event filters setting when user interacts with its checkbox', async () => {
    renderAppRefreshFieldSet();

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(4);
    expect(global.localStorage.setItem).not.toHaveBeenCalledWith(
      'er-web-restorable:eventFilter',
      JSON.stringify({ restore: true })
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Event Filters' }));

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(5);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:eventFilter',
      JSON.stringify({ restore: true })
    );
  });

  test('updates the patrol filters setting when user interacts with its checkbox', async () => {
    renderAppRefreshFieldSet();

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(4);
    expect(global.localStorage.setItem).not.toHaveBeenCalledWith(
      'er-web-restorable:patrolFilter',
      JSON.stringify({ restore: true })
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Patrol Filters' }));

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(5);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:patrolFilter',
      JSON.stringify({ restore: true })
    );
  });

  test('updates the map layers setting when user interacts with its checkbox', async () => {
    renderAppRefreshFieldSet();

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(4);
    expect(global.localStorage.setItem).not.toHaveBeenCalledWith(
      'er-web-restorable:mapLayerFilter',
      JSON.stringify({ restore: true })
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Map Layers' }));

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(5);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:mapLayerFilter',
      JSON.stringify({ restore: true })
    );
  });
});
