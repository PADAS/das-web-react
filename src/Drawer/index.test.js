import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Drawer from '.';
import { hideDrawer } from '../ducks/drawer';
import { mockStore } from '../__test-helpers/MockStore';

jest.mock('../ducks/drawer', () => ({
  ...jest.requireActual('../ducks/drawer'),
  hideDrawer: jest.fn(),
}));

describe('Drawer', () => {
  let hideDrawerMock, store;
  beforeEach(() => {
    hideDrawerMock = jest.fn(() => () => {});
    hideDrawer.mockImplementation(hideDrawerMock);
    store = {
      view: {
        drawer: {
          data: null,
          drawerId: null,
          direction: 'right',
          isOpen: false,
        },
      },
    };
  });

  test('does not set the isOpen styles depending on redux state', async () => {
    render(
      <Provider store={mockStore(store)}>
        <Drawer />
      </Provider>
    );

    expect(await screen.findByTestId('overlay')).not.toHaveClass('open');
    expect(await screen.findByTestId('drawerContainer')).not.toHaveClass('open');
  });

  test('sets the isOpen styles depending on redux state', async () => {
    store.view.drawer.isOpen = true;
    render(
      <Provider store={mockStore(store)}>
        <Drawer />
      </Provider>
    );

    expect(await screen.findByTestId('overlay')).toHaveClass('open');
    expect(await screen.findByTestId('drawerContainer')).toHaveClass('open');
  });

  test('sets the direction styles depending on redux state', async () => {
    store.view.drawer.isOpen = true;
    store.view.drawer.direction = 'right';
    render(
      <Provider store={mockStore(store)}>
        <Drawer />
      </Provider>
    );

    expect(await screen.findByTestId('drawerContainer')).toHaveClass('direction-right');
  });

  test('triggers the hideDrawer action when user clicks outside the drawer', async () => {
    store.view.drawer.isOpen = true;
    render(
      <Provider store={mockStore(store)}>
        <Drawer />
      </Provider>
    );

    expect(hideDrawer).toHaveBeenCalledTimes(0);

    const overlay = await screen.findByTestId('overlay');
    userEvent.click(overlay);

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });

  test('triggers the hideDrawer action when user press esc', async () => {
    store.view.drawer.isOpen = true;
    render(
      <Provider store={mockStore(store)}>
        <Drawer />
      </Provider>
    );

    expect(hideDrawer).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Escape}');

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });
});
