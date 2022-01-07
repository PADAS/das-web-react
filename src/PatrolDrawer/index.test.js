import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DrawersLayer, { DrawersContext, patrolDrawerId } from '../DrawersLayer';
import PatrolDrawer from './';

describe('PatrolDrawer', () => {
  test('renders the drawer in the Plan view by default', async () => {
    render(
      <DrawersLayer>
        <PatrolDrawer />
      </DrawersLayer>
    );

    const planTab = (await screen.findAllByRole('tab'))[0];
    const planView = (await screen.findAllByRole('tabpanel'))[0];

    expect(planTab).toHaveClass('active');
    expect(planView).toHaveClass('show');
  });

  test('navigates to the Timeline view when user clicks the tab', async () => {
    render(
      <DrawersLayer>
        <PatrolDrawer />
      </DrawersLayer>
    );

    const timelineTab = (await screen.findAllByRole('tab'))[1];

    userEvent.click(timelineTab);

    const timelineView = await screen.findByRole('tabpanel');

    expect(timelineTab).toHaveClass('active');
    expect(timelineView).toHaveClass('show');
  });

  test('navigates to the History view when user clicks the tab', async () => {
    render(
      <DrawersLayer>
        <PatrolDrawer />
      </DrawersLayer>
    );

    const historyTab = (await screen.findAllByRole('tab'))[2];

    userEvent.click(historyTab);

    const historyView = await screen.findByRole('tabpanel');

    expect(historyTab).toHaveClass('active');
    expect(historyView).toHaveClass('show');
  });

  test('closes the drawer when clicking the exit button', async () => {
    const DrawerOpenIndicator = () => {
      const { drawers, showDrawer } = useContext(DrawersContext);

      return <>
        <button data-testid="drawer-opener" onClick={() => showDrawer(patrolDrawerId)} />
        <p>Patrol drawer is {drawers[patrolDrawerId].isOpen ? 'open' : 'closed'}</p>
      </>;
    };
    render(
      <DrawersLayer>
        <DrawerOpenIndicator />
        <PatrolDrawer />
      </DrawersLayer>
    );

    const drawerOpener = await screen.findByTestId('drawer-opener');
    userEvent.click(drawerOpener);

    expect(await screen.findByText('Patrol drawer is open')).toBeDefined();

    const exitButton = await screen.findByText('Exit');
    userEvent.click(exitButton);

    expect(await screen.findByText('Patrol drawer is closed')).toBeDefined();
  });
});
