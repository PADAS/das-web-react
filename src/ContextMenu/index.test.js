import React from 'react';
import ContextMenu from './index';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ContextMenu', () => {
  test('shows the context menu when right-clicking at the right position', async () => {
    render(<ContextMenu options={<div>Menu</div>}>
      <p>Child</p>
    </ContextMenu>);

    expect(screen.getByTestId('contextMenu-positionReference')).toHaveClass('hidden');

    const area = screen.getByTestId('contextMenu-area');
    fireEvent.contextMenu(area, { clientX: 54, clientY: 12 });

    expect(screen.getByTestId('contextMenu-positionReference')).not.toHaveClass('hidden');
    expect(screen.getByTestId('contextMenu-positionReference')).toHaveStyle('top: 12px;');
    expect(screen.getByTestId('contextMenu-positionReference')).toHaveStyle('left: 54px;');
  });

  test('closes the context menu when clicking outside of it', async () => {
    render(<ContextMenu options={<div>Menu</div>}>
      <p>Child</p>
    </ContextMenu>);

    const area = screen.getByTestId('contextMenu-area');
    fireEvent.contextMenu(area, { clientX: 54, clientY: 12 });

    expect(screen.getByTestId('contextMenu-positionReference')).not.toHaveClass('hidden');

    userEvent.click(screen.getByTestId('contextMenu-area'));

    expect(screen.getByTestId('contextMenu-positionReference')).toHaveClass('hidden');
  });
});