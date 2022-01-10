import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DrawerProvider, { DrawersContext, patrolDrawerId } from '.';

describe('DrawerProvider', () => {
  test('updates the patrol drawer isOpen state when a child triggers showDrawer with patrolDrawerId', async () => {
    const Child = () => {
      const { drawers, showDrawer } = useContext(DrawersContext);

      return <>
        <button onClick={() => showDrawer(patrolDrawerId)} />
        <p>Patrol drawer is {drawers[patrolDrawerId].isOpen ? 'open' : 'closed'}</p>
      </>;
    };

    render(
      <DrawerProvider>
        <Child />
      </DrawerProvider>
    );

    expect(await screen.findByText('Patrol drawer is closed')).toBeDefined();

    const button = await screen.findByRole('button');
    userEvent.click(button);

    expect(await screen.findByText('Patrol drawer is open')).toBeDefined();
  });

  test('updates the patrol drawer data state when a child triggers showDrawer with patrolDrawerId', async () => {
    const Child = () => {
      const { drawers, showDrawer } = useContext(DrawersContext);

      return <>
        <button onClick={() => showDrawer(patrolDrawerId, 'Data ready')} />
        <p>{drawers[patrolDrawerId].data}</p>
      </>;
    };

    render(
      <DrawerProvider>
        <Child />
      </DrawerProvider>
    );

    const button = await screen.findByRole('button');
    userEvent.click(button);

    expect(await screen.findByText('Data ready')).toBeDefined();
  });

  test('updates the patrol drawer isOpen state when a child triggers hideDrawer with patrolDrawerId', async () => {
    const Child = () => {
      const { drawers, hideDrawer, showDrawer } = useContext(DrawersContext);

      return <>
        <button onClick={() => showDrawer(patrolDrawerId)} />
        <button onClick={() => hideDrawer(patrolDrawerId)} />
        <p>Patrol drawer is {drawers[patrolDrawerId].isOpen ? 'open' : 'closed'}</p>
      </>;
    };

    render(
      <DrawerProvider>
        <Child />
      </DrawerProvider>
    );

    const buttons = await screen.findAllByRole('button');
    userEvent.click(buttons[0]);

    expect(await screen.findByText('Patrol drawer is open')).toBeDefined();

    userEvent.click(buttons[1]);

    expect(await screen.findByText('Patrol drawer is closed')).toBeDefined();
  });
});
