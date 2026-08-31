import React, { useState } from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../test-utils';

import TitleInput from './';

describe('SideBar - PatrolsManager - TitleInput', () => {
  const onChange = jest.fn();

  const ControlledTitleInput = ({ initialValue, ...otherProps }) => {
    const [value, setValue] = useState(initialValue);

    return <TitleInput
      aria-label="Patrol title"
      isDirty={false}
      onChange={(newValue) => {
        onChange(newValue);
        setValue(newValue);
      }}
      value={value}
      {...otherProps}
    />;
  };

  const renderTitleInput = (props) => render(<ControlledTitleInput initialValue="Delta Patrol" {...props} />);

  test('shows the title of the item', () => {
    renderTitleInput();

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveValue('Delta Patrol');
  });

  test('reports the title the user types', async () => {
    renderTitleInput();

    await userEvent.type(screen.getByRole('textbox', { name: 'Patrol title' }), ' North');

    expect(onChange).toHaveBeenLastCalledWith('Delta Patrol North');
  });

  test('shows a dirty title as unsaved', () => {
    renderTitleInput({ isDirty: true });

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveClass('unsaved');
  });

  test('focuses the input from the edit button', async () => {
    renderTitleInput();

    await userEvent.click(screen.getByTitle('Edit title'));

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveFocus();
  });

  test('keeps the edit button out of the keyboard and the accessibility tree', () => {
    renderTitleInput();

    const editButton = screen.getByTitle('Edit title');

    expect(editButton).toHaveAttribute('aria-hidden', 'true');
    expect(editButton).toHaveAttribute('tabindex', '-1');
  });
});
