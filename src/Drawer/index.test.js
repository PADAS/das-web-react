import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createNewPatrolForPatrolType } from '../utils/patrols';
import Drawer, { patrolDrawerId } from '.';
import { hideDrawer } from '../ducks/drawer';
import { mockStore } from '../__test-helpers/MockStore';

jest.mock('../ducks/drawer', () => ({
  ...jest.requireActual('../ducks/drawer'),
  hideDrawer: jest.fn(),
}));

describe('Drawer', () => {
  const reportType = {
    default_priority: 0,
    icon_id: 'dog-patrol-icon',
    value: 'dog_patrol',
  };
  const reportData = {
    location: {
      latitude: 20.581601124675956,
      longitude: -103.36759085776096,
    },
  };
  const newPatrol = createNewPatrolForPatrolType(reportType, reportData);
  let hideDrawerMock, store;
  beforeEach(() => {
    hideDrawerMock = jest.fn(() => () => {});
    hideDrawer.mockImplementation(hideDrawerMock);
    store = {
      data: {
        subjectStore: {}
      },
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

    expect(await screen.findByTestId('outsideDrawer')).not.toHaveClass('open');
    expect(await screen.findByTestId('drawerContainer')).not.toHaveClass('open');
  });

  test('sets the isOpen styles depending on redux state', async () => {
    store.view.drawer.isOpen = true;
    render(
      <Provider store={mockStore(store)}>
        <Drawer />
      </Provider>
    );

    expect(await screen.findByTestId('outsideDrawer')).toHaveClass('open');
    expect(await screen.findByTestId('drawerContainer')).toHaveClass('open');
  });

  test('sets the direction styles depending on redux state', async () => {
    store.view.drawer.isOpen = true;
    store.view.drawer.direction = 'left';
    render(
      <Provider store={mockStore(store)}>
        <Drawer />
      </Provider>
    );

    expect(await screen.findByTestId('drawerContainer')).toHaveClass('direction-left');
  });

  test('opens the patrol drawer', async () => {
    store.view.drawer.isOpen = true;
    store.view.drawer.data = { newPatrol };
    store.view.drawer.drawerId = patrolDrawerId;
    render(
      <Provider store={mockStore(store)}>
        <Drawer />
      </Provider>
    );

    expect(await screen.findByTestId('patrolDrawerContainer')).toBeDefined();
  });

  test('triggers the hideDrawer action when user clicks outside the drawer', async () => {
    store.view.drawer.isOpen = true;
    store.view.drawer.data = { newPatrol };
    store.view.drawer.drawerId = patrolDrawerId;
    render(
      <Provider store={mockStore(store)}>
        <Drawer />
      </Provider>
    );

    expect(hideDrawer).toHaveBeenCalledTimes(0);

    const outsideDrawer = await screen.findByTestId('outsideDrawer');
    userEvent.click(outsideDrawer);

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });
});
