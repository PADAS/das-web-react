import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ItemActionButton from '.';

describe('ReportManager - ActivitySection - ItemActionButton', () => {
  const onClick = jest.fn();
  beforeEach(() => {
    render(<ItemActionButton onClick={onClick} tooltip="tooltip" />);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers the onClick event', async () => {
    expect(onClick).toHaveBeenCalledTimes(0);

    const button = await screen.findByRole('button');
    userEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('shows the tooltip when hovering the button', async () => {
    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const button = await screen.findByRole('button');
    userEvent.hover(button);

    expect((await screen.findByRole('tooltip'))).toHaveTextContent('tooltip');
  });
});
