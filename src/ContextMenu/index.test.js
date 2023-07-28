import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ContextMenu from './index';

describe('ContextMenu', () => {
  test('it shows context menu when right-clicking', () => {
    const optionLabel = 'An option';
    render(<ContextMenu options={ <a href="#">{optionLabel}</a> }>
      <p>some child</p>
    </ContextMenu>);

    expect( screen.queryByText(optionLabel) ).toBeNull();
    fireEvent.contextMenu( screen.getByTestId('contextMenuToggle') );
    expect( screen.getByText(optionLabel) ).toBeInTheDocument();
  });
});