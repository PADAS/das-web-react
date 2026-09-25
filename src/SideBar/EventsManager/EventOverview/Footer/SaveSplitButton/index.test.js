import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../../../../test-utils';

import SaveSplitButton from './';

describe('SideBar - EventsManager - EventOverview - Footer - SaveSplitButton', () => {
  let onResolve, onReopen, onSave;

  beforeEach(() => {
    onReopen = jest.fn();
    onResolve = jest.fn();
    onSave = jest.fn();
  });

  const renderSaveSplitButton = (props = {}) => render(<SaveSplitButton
    label="Save"
    menuLabel="More save options"
    onSave={onSave}
    options={[
      { key: 'resolve', label: 'Save and resolve', onClick: onResolve },
      { key: 'reopen', label: 'Save and reopen', onClick: onReopen },
    ]}
    {...props}
  />);

  const getSaveButton = () => screen.getByRole('button', { name: 'Save' });

  const getToggle = () => screen.getByRole('button', { name: 'More save options' });

  test('saves when the user clicks the save button', async () => {
    renderSaveSplitButton();

    await userEvent.click(getSaveButton());

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test('groups the save button with its options toggle', () => {
    renderSaveSplitButton();

    const group = screen.getByRole('group');

    expect(within(group).getByRole('button', { name: 'Save' })).toBeVisible();
    expect(within(group).getByRole('button', { name: 'More save options' })).toBeVisible();
  });

  test('does not show the options toggle when there are no options', () => {
    renderSaveSplitButton({ options: [] });

    expect(getSaveButton()).toBeVisible();
    expect(screen.queryByRole('button', { name: 'More save options' })).toBeNull();
  });

  test('shows the save in progress in place and disables both buttons', () => {
    renderSaveSplitButton({ isSaving: true });

    expect(getSaveButton()).toHaveAttribute('aria-busy', 'true');
    expect(getSaveButton()).toBeDisabled();
    expect(getToggle()).toBeDisabled();
  });

  test('disables only the save button when there is nothing to save, keeping the save options', () => {
    renderSaveSplitButton({ isSaveDisabled: true });

    expect(getSaveButton()).toBeDisabled();
    expect(getToggle()).toBeEnabled();
  });

  test('opens the options menu from the toggle', async () => {
    renderSaveSplitButton();

    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(getToggle());

    const menu = screen.getByRole('menu', { name: 'More save options' });

    expect(getToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(getToggle()).toHaveAttribute('aria-controls', menu.id);
    expect(within(menu).getAllByRole('menuitem').map((option) => option.textContent))
      .toEqual(['Save and resolve', 'Save and reopen']);
  });

  test('runs the option the user picks and closes the menu', async () => {
    renderSaveSplitButton();

    await userEvent.click(getToggle());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Save and reopen' }));

    expect(onReopen).toHaveBeenCalledTimes(1);
    expect(onResolve).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(getToggle()).toHaveFocus();
  });

  test('opens the menu on the first option with the down arrow', async () => {
    renderSaveSplitButton();

    getToggle().focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Save and resolve' })).toHaveFocus();
  });

  test('opens the menu on the last option with the up arrow', async () => {
    renderSaveSplitButton();

    getToggle().focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitem', { name: 'Save and reopen' })).toHaveFocus();
  });

  test('moves into a menu opened with the mouse with the arrow keys', async () => {
    renderSaveSplitButton();

    await userEvent.click(getToggle());
    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitem', { name: 'Save and reopen' })).toHaveFocus();
  });

  test('closes the menu without taking focus back when the user clicks outside it', async () => {
    render(<button type="button">Outside</button>);
    renderSaveSplitButton();

    await userEvent.click(getToggle());
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
  });

  test('moves through the options with the arrow, home and end keys', async () => {
    renderSaveSplitButton();

    getToggle().focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Save and reopen' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Save and resolve' })).toHaveFocus();

    await userEvent.keyboard('{End}');

    expect(screen.getByRole('menuitem', { name: 'Save and reopen' })).toHaveFocus();

    await userEvent.keyboard('{Home}');

    expect(screen.getByRole('menuitem', { name: 'Save and resolve' })).toHaveFocus();
  });

  test('closes the menu and returns focus to the toggle on escape', async () => {
    renderSaveSplitButton();

    getToggle().focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).toBeNull();
    expect(getToggle()).toHaveFocus();
  });
});
