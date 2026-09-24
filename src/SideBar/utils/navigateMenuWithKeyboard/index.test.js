import React, { useRef } from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../test-utils';

import navigateMenuWithKeyboard from './';

describe('SideBar - utils - navigateMenuWithKeyboard', () => {
  let closeMenu;

  beforeEach(() => {
    closeMenu = jest.fn();
  });

  const Menu = () => {
    const optionRefs = useRef([]);

    return <ul
      aria-label="Menu"
      onKeyDown={(event) => navigateMenuWithKeyboard(event, optionRefs.current, closeMenu)}
      role="menu"
      >
      {['First', 'Second', 'Third'].map((option, index) => <li key={option} role="none">
        <button
          ref={(element) => {
            optionRefs.current[index] = element;
          }}
          role="menuitem"
          tabIndex={-1}
          type="button"
        >
          {option}
        </button>
      </li>)}
    </ul>;
  };

  const renderMenu = () => {
    render(<Menu />);

    screen.getByRole('menuitem', { name: 'First' }).focus();
  };

  test('moves focus to the next option on arrow down, wrapping around at the end', async () => {
    renderMenu();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Second' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'First' })).toHaveFocus();
  });

  test('moves focus to the previous option on arrow up, wrapping around at the start', async () => {
    renderMenu();

    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitem', { name: 'Third' })).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitem', { name: 'Second' })).toHaveFocus();
  });

  test('moves focus to the last option on end and to the first one on home', async () => {
    renderMenu();

    await userEvent.keyboard('{End}');

    expect(screen.getByRole('menuitem', { name: 'Third' })).toHaveFocus();

    await userEvent.keyboard('{Home}');

    expect(screen.getByRole('menuitem', { name: 'First' })).toHaveFocus();
  });

  test('closes the menu on escape', async () => {
    renderMenu();

    await userEvent.keyboard('{Escape}');

    expect(closeMenu).toHaveBeenCalledTimes(1);
  });

  test('closes the menu on tab', async () => {
    renderMenu();

    await userEvent.tab();

    expect(closeMenu).toHaveBeenCalledTimes(1);
  });

  test('ignores other keys', async () => {
    renderMenu();

    await userEvent.keyboard('a');

    expect(closeMenu).not.toHaveBeenCalled();
    expect(screen.getByRole('menuitem', { name: 'First' })).toHaveFocus();
  });
});
