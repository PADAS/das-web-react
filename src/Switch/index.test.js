import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import Switch from '.';

describe('Switch', () => {
  const renderSwitch = (props) => render(<Switch checked={false} {...props} />);

  test('adds a custom class name', async () => {
    renderSwitch({ className: 'className' });

    expect(screen.getByTestId('switch')).toHaveClass('className');
  });

  test('does not disable the switch', async () => {
    renderSwitch();

    expect(screen.getByTestId('switch-base')).not.toHaveClass('disabled');
    expect(screen.getByRole('switch')).not.toBeDisabled();
  });

  test('disables the switch', async () => {
    renderSwitch({ disabled: true });

    expect(screen.getByTestId('switch-base')).toHaveClass('disabled');
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  test('unchecks the switch', async () => {
    renderSwitch();

    expect(screen.getByTestId('switch-base')).not.toHaveClass('checked');
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  test('checks the switch', async () => {
    renderSwitch({ checked: true });

    expect(screen.getByTestId('switch-base')).toHaveClass('checked');
    expect(screen.getByRole('switch')).toBeChecked();
  });

  test('configures the switch input with other props', async () => {
    const onChange = jest.fn();
    renderSwitch({ id: 'switch-id', name: 'switch-name', onChange });

    const switchInput = screen.getByRole('switch');

    expect(switchInput).toHaveAttribute('id', 'switch-id');
    expect(switchInput).toHaveAttribute('name', 'switch-name');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(switchInput);

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
