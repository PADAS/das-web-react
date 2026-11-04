import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../../../__test-helpers/MockStore';
import { PREVIEW_FEATURES } from '../../../../constants';
import { render, screen } from '../../../../test-utils';

import AppRefreshFieldSet from './';

describe('SideBar - SettingsPane - GeneralTab - AppRefreshFieldSet', () => {
  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, 'setItem');
  });

  const renderAppRefreshFieldSet = (props, previewFeatures = {}) => render(
    <Provider store={mockStore({ view: { systemConfig: { previewFeatures } } })}>
      <AppRefreshFieldSet {...props} />
    </Provider>
  );

  test('updates the map position and zoom level setting when user interacts with its checkbox', async () => {
    renderAppRefreshFieldSet();

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(5);
    expect(global.localStorage.setItem).not.toHaveBeenCalledWith(
      'er-web-restorable:mapPosition',
      JSON.stringify({ restore: false })
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Map Position & Zoom Level' }));

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(6);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:mapPosition',
      JSON.stringify({ restore: true })
    );
  });

  test('updates the event filters setting when user interacts with its checkbox', async () => {
    renderAppRefreshFieldSet();

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(5);
    expect(global.localStorage.setItem).not.toHaveBeenCalledWith(
      'er-web-restorable:eventFilter',
      JSON.stringify({ restore: false })
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Event Filters' }));

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(6);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:eventFilter',
      JSON.stringify({ restore: true })
    );
  });

  test('updates the patrol filters setting when user interacts with its checkbox', async () => {
    renderAppRefreshFieldSet();

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(5);
    expect(global.localStorage.setItem).not.toHaveBeenCalledWith(
      'er-web-restorable:patrolFilter',
      JSON.stringify({ restore: false })
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Patrol Filters' }));

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(6);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:patrolFilter',
      JSON.stringify({ restore: true })
    );
  });

  test('updates the map layers setting when user interacts with its checkbox', async () => {
    renderAppRefreshFieldSet();

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(5);
    expect(global.localStorage.setItem).not.toHaveBeenCalledWith(
      'er-web-restorable:mapLayerFilter',
      JSON.stringify({ restore: false })
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Map Layers' }));

    expect(global.localStorage.setItem).toHaveBeenCalledTimes(6);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:mapLayerFilter',
      JSON.stringify({ restore: true })
    );
  });

  test('does not offer to keep the table view without the table preview feature', () => {
    renderAppRefreshFieldSet();

    expect(screen.queryByRole('checkbox', { name: 'Table View' })).toBeNull();
  });

  test('updates the table view setting when user interacts with its checkbox', async () => {
    renderAppRefreshFieldSet({}, { [PREVIEW_FEATURES.FEED_TABLE]: true });

    expect(screen.getByRole('checkbox', { name: 'Table View' })).not.toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Table View' }));

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:feedTableView',
      JSON.stringify({ restore: true })
    );
  });
});
