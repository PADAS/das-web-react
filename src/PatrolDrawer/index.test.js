import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DrawersContext } from '../DrawerProvider';
import PatrolDrawer from './';

describe('PatrolDrawer', () => {
  const hideDrawer = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders the drawer in the Plan view by default', async () => {
    render(
      <DrawersContext.Provider value={{ hideDrawer }}>
        <PatrolDrawer />
      </DrawersContext.Provider>
    );

    expect((await screen.findAllByRole('tab'))[0]).toHaveClass('active');
    expect((await screen.findAllByRole('tabpanel'))[0]).toHaveClass('show');
  });

  test('navigates to the Timeline view when user clicks the tab', async () => {
    render(
      <DrawersContext.Provider value={{ hideDrawer }}>
        <PatrolDrawer />
      </DrawersContext.Provider>
    );

    const timelineTab = (await screen.findAllByRole('tab'))[1];

    expect(timelineTab).not.toHaveClass('active');

    userEvent.click(timelineTab);

    expect(timelineTab).toHaveClass('active');
    expect(await screen.findByRole('tabpanel')).toHaveClass('show');
  });

  test('navigates to the History view when user clicks the tab', async () => {
    render(
      <DrawersContext.Provider value={{ hideDrawer }}>
        <PatrolDrawer />
      </DrawersContext.Provider>
    );

    const historyTab = (await screen.findAllByRole('tab'))[2];

    expect(historyTab).not.toHaveClass('active');

    userEvent.click(historyTab);

    expect(historyTab).toHaveClass('active');
    expect(await screen.findByRole('tabpanel')).toHaveClass('show');
  });

  test('closes the drawer when clicking the exit button', async () => {
    render(
      <DrawersContext.Provider value={{ hideDrawer }}>
        <PatrolDrawer />
      </DrawersContext.Provider>
    );

    expect(hideDrawer).toHaveBeenCalledTimes(0);

    const exitButton = await screen.findByText('Exit');
    userEvent.click(exitButton);

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });
});
