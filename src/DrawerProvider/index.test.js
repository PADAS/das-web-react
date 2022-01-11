import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DrawerProvider, { DrawersContext, patrolDrawerId } from '.';

describe('DrawerProvider', () => {
  test('shows the patrol drawer when triggering showDrawer', async () => {
    const Child = () => {
      const { showDrawer } = useContext(DrawersContext);

      return <button onClick={() => showDrawer(patrolDrawerId)} />;
    };

    render(
      <DrawerProvider>
        <Child />
      </DrawerProvider>
    );

    expect(await screen.findByTestId('drawerContainer')).not.toHaveClass('open');

    const button = await screen.findByRole('button');
    userEvent.click(button);

    expect(await screen.findByTestId('drawerContainer')).toHaveClass('open');
  });

  test('hides the patrol drawer when triggering hideDrawer', async () => {
    const Child = () => {
      const { hideDrawer, showDrawer } = useContext(DrawersContext);

      return <>
        <button onClick={() => showDrawer(patrolDrawerId)} />
        <button onClick={() => hideDrawer()} />
      </>;
    };

    render(
      <DrawerProvider>
        <Child />
      </DrawerProvider>
    );

    const buttons = await screen.findAllByRole('button');
    userEvent.click(buttons[0]);

    expect(await screen.findByTestId('drawerContainer')).toHaveClass('open');

    userEvent.click(buttons[1]);

    expect(await screen.findByTestId('drawerContainer')).not.toHaveClass('open');
  });

  test('assigns the direction class to the right by default', async () => {
    const Child = () => {
      const { showDrawer } = useContext(DrawersContext);

      return <button onClick={() => showDrawer(patrolDrawerId)} />;
    };

    render(
      <DrawerProvider>
        <Child />
      </DrawerProvider>
    );

    const button = await screen.findByRole('button');
    userEvent.click(button);

    expect(await screen.findByTestId('drawerContainer')).toHaveClass('direction-right');
  });

  test('assigns the direction class to the left', async () => {
    const Child = () => {
      const { showDrawer } = useContext(DrawersContext);

      return <button onClick={() => showDrawer(patrolDrawerId, null, 'left')} />;
    };

    render(
      <DrawerProvider>
        <Child />
      </DrawerProvider>
    );

    const button = await screen.findByRole('button');
    userEvent.click(button);

    expect(await screen.findByTestId('drawerContainer')).toHaveClass('direction-left');
  });

  test('renders the PatrolDrawer when showing drawer the patrolDrawerId', async () => {
    const Child = () => {
      const { showDrawer } = useContext(DrawersContext);

      return <button onClick={() => showDrawer(patrolDrawerId, null, 'left')} />;
    };

    render(
      <DrawerProvider>
        <Child />
      </DrawerProvider>
    );

    expect(await screen.queryByTestId('patrolDrawerContainer')).toBeNull();

    const button = await screen.findByRole('button');
    userEvent.click(button);

    expect(await screen.findByTestId('patrolDrawerContainer')).toBeDefined();
  });
});
