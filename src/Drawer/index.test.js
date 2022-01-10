import React from 'react';
import { render, screen } from '@testing-library/react';

import Drawer from './';

describe('Drawer', () => {
  test('assigns the open class to the drawer when isOpen is true', async () => {
    render(<Drawer isOpen />);

    expect(await screen.findByTestId('drawerContainer')).toHaveClass('open');
  });

  test('does not assign the open class to the drawer when isOpen is false', async () => {
    render(<Drawer isOpen={false} />);

    expect(await screen.findByTestId('drawerContainer')).not.toHaveClass('open');
  });

  test('assigns the direction class to the right', async () => {
    render(<Drawer isOpen />);

    expect(await screen.findByTestId('drawerContainer')).toHaveClass('direction-right');
  });

  test('assigns the direction class to the left', async () => {
    render(<Drawer direction="left" isOpen />);

    expect(await screen.findByTestId('drawerContainer')).toHaveClass('direction-left');
  });
});
