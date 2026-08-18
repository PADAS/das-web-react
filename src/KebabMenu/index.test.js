import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import KebabMenu from './index';

describe('KebabMenu', () => {
  const onFirstOptionClick = jest.fn();
  const onSecondOptionClick = jest.fn();
  const onThirdOptionClick = jest.fn();

  const defaultOptions = <>
    <KebabMenu.Option onClick={onFirstOptionClick}>First option</KebabMenu.Option>
    <KebabMenu.Option disabled onClick={onSecondOptionClick}>Second option</KebabMenu.Option>
    <KebabMenu.Divider />
    <KebabMenu.Option onClick={onThirdOptionClick}>Third option</KebabMenu.Option>
  </>;

  const renderKebabMenu = ({ children, ...props } = {}) => render(
    <KebabMenu aria-label="Options menu" title="Options" {...props}>
      {children || defaultOptions}
    </KebabMenu>
  );

  const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'Options menu' }));

  const openMenuWithKeyboard = async () => {
    screen.getByRole('button', { name: 'Options menu' }).focus();

    await userEvent.keyboard('{Enter}');
  };

  test('shows the toggle button', () => {
    renderKebabMenu();

    expect(screen.getByRole('button', { name: 'Options menu' })).toHaveAttribute('title', 'Options');
  });

  test('shows the toggle button collapsed, with the menu closed, by default', () => {
    renderKebabMenu();

    const toggle = screen.getByRole('button', { name: 'Options menu' });

    expect(toggle).toHaveAttribute('aria-haspopup', 'menu');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('shows the menu when the toggle button is clicked', async () => {
    renderKebabMenu();

    await openMenu();

    expect(await screen.findByRole('menu', { name: 'Options menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Options menu' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('does not focus an option when the menu is opened by clicking the toggle button', async () => {
    renderKebabMenu();

    await openMenu();
    await screen.findByRole('menu');

    expect(screen.getByRole('button', { name: 'Options menu' })).toHaveFocus();
  });

  test('focuses the first option when the menu is opened with the keyboard', async () => {
    renderKebabMenu();

    await openMenuWithKeyboard();

    expect(await screen.findByText('First option')).toHaveFocus();
  });

  test('opens the menu and focuses the first option when ArrowDown is pressed on the toggle button', async () => {
    renderKebabMenu();

    screen.getByRole('button', { name: 'Options menu' }).focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(await screen.findByText('First option')).toHaveFocus();
  });

  test('opens the menu and focuses the last option when ArrowUp is pressed on the toggle button', async () => {
    renderKebabMenu();

    screen.getByRole('button', { name: 'Options menu' }).focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(await screen.findByText('Third option')).toHaveFocus();
  });

  test('hides the menu when the toggle button is clicked again', async () => {
    renderKebabMenu();

    await openMenu();
    await screen.findByRole('menu');

    await openMenu();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('hides the menu and refocuses the toggle button when Escape is pressed', async () => {
    renderKebabMenu();

    const toggle = screen.getByRole('button', { name: 'Options menu' });
    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  test('hides the menu and refocuses the toggle button when Tab is pressed', async () => {
    renderKebabMenu();

    const toggle = screen.getByRole('button', { name: 'Options menu' });
    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{Tab}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  test('does not let a parent Escape listener see the keypress used to close the menu', async () => {
    const onParentKeyDown = jest.fn();

    render(
      <div onKeyDown={onParentKeyDown}>
        <KebabMenu aria-label="Options menu" title="Options">{defaultOptions}</KebabMenu>
      </div>
    );

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{Escape}');

    expect(onParentKeyDown).not.toHaveBeenCalled();
  });

  test('hides the menu and refocuses the toggle button when clicking outside of it', async () => {
    renderKebabMenu();

    const toggle = screen.getByRole('button', { name: 'Options menu' });
    await openMenu();
    await screen.findByRole('menu');

    await userEvent.click(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  test('places the menu at the start of the toggle button by default', async () => {
    renderKebabMenu();

    await openMenu();

    expect((await screen.findByRole('menu')).parentElement).toHaveAttribute('data-popper-placement', 'bottom-start');
  });

  test('places the menu at the end of the toggle button when align is set to "end"', async () => {
    renderKebabMenu({ align: 'end' });

    await openMenu();

    expect((await screen.findByRole('menu')).parentElement).toHaveAttribute('data-popper-placement', 'bottom-end');
  });

  test('shows the provided options as menu items', async () => {
    renderKebabMenu();

    await openMenu();

    expect(await screen.findByRole('menuitem', { name: 'First option' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Second option' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Third option' })).toBeInTheDocument();
  });

  test('shows the provided dividers as separators', async () => {
    renderKebabMenu();

    await openMenu();

    expect(await screen.findByRole('separator')).toBeInTheDocument();
  });

  test('shows a disabled option as disabled', async () => {
    renderKebabMenu();

    await openMenu();

    expect(await screen.findByRole('menuitem', { name: 'Second option' })).toBeDisabled();
  });

  test('calls the option onClick handler and closes the menu when an option is clicked', async () => {
    renderKebabMenu();

    await openMenu();
    await userEvent.click(await screen.findByText('First option'));

    expect(onFirstOptionClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('does not call the onClick handler or close the menu when a disabled option is clicked', async () => {
    renderKebabMenu();

    await openMenu();
    await userEvent.click(await screen.findByText('Second option'));

    expect(onSecondOptionClick).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  test('does not call the onClick handler or close the menu when a disabled custom option is clicked', async () => {
    const onDisabledCustomOptionClick = jest.fn();
    renderKebabMenu({
      children: <KebabMenu.Option as="div" disabled onClick={onDisabledCustomOptionClick}>Custom option</KebabMenu.Option>,
    });

    await openMenu();
    await userEvent.click(await screen.findByText('Custom option'));

    expect(onDisabledCustomOptionClick).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  test('focuses the nested focusable element for options wrapping arbitrary content', async () => {
    renderKebabMenu({
      children: <>
        <KebabMenu.Option>First option</KebabMenu.Option>
        <KebabMenu.Option as="div">
          <button type="button">Nested button</button>
        </KebabMenu.Option>
      </>,
    });

    await openMenuWithKeyboard();
    await screen.findByText('First option');

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByText('Nested button')).toHaveFocus();
  });

  test('sets the background color, dot color and size as custom properties on the toggle button', () => {
    renderKebabMenu({ backgroundColor: 'red', dotColor: 'blue', size: '3rem' });

    expect(screen.getByRole('button', { name: 'Options menu' })).toHaveStyle({
      '--kebab-menu-background-color': 'red',
      '--kebab-menu-dot-color': 'blue',
      '--kebab-menu-size': '3rem',
    });
  });

  test('ignores key presses that are not used for menu navigation', async () => {
    renderKebabMenu();

    await openMenuWithKeyboard();
    const firstOption = await screen.findByText('First option');

    await userEvent.keyboard('a');

    expect(firstOption).toHaveFocus();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  test('forwards a ref object to the option element', async () => {
    const optionRef = { current: null };
    renderKebabMenu({
      children: <KebabMenu.Option ref={optionRef}>First option</KebabMenu.Option>,
    });

    await openMenu();
    const option = await screen.findByText('First option');

    expect(optionRef.current).toBe(option);
  });

  test('forwards a callback ref to the option element', async () => {
    const onRef = jest.fn();
    renderKebabMenu({
      children: <KebabMenu.Option ref={onRef}>First option</KebabMenu.Option>,
    });

    await openMenu();
    const option = await screen.findByText('First option');

    expect(onRef).toHaveBeenCalledWith(option);
  });

  test('does not move focus to an option when the mouse hovers over it', async () => {
    renderKebabMenu();

    await openMenuWithKeyboard();
    const firstOption = await screen.findByText('First option');

    await userEvent.hover(screen.getByText('Third option'));

    expect(firstOption).toHaveFocus();
  });

  test('moves focus to the next option when ArrowDown is pressed, wrapping and skipping disabled options', async () => {
    renderKebabMenu();

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByText('First option')).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByText('Third option')).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByText('First option')).toHaveFocus();
  });

  test('moves focus to the previous option when ArrowUp is pressed, wrapping and skipping disabled options', async () => {
    renderKebabMenu();

    await openMenu();
    await screen.findByText('First option');

    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByText('Third option')).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByText('First option')).toHaveFocus();
  });

  test('moves focus to the first option when Home is pressed', async () => {
    renderKebabMenu();

    await openMenu();
    await userEvent.keyboard('{End}');

    await userEvent.keyboard('{Home}');

    expect(screen.getByText('First option')).toHaveFocus();
  });

  test('moves focus to the last option when End is pressed', async () => {
    renderKebabMenu();

    await openMenu();
    await screen.findByText('First option');

    await userEvent.keyboard('{End}');

    expect(screen.getByText('Third option')).toHaveFocus();
  });

  test('skips an option that fails to actually receive focus when navigating with arrow keys', async () => {
    renderKebabMenu({
      children: <>
        <KebabMenu.Option>First option</KebabMenu.Option>
        <KebabMenu.Option>Unfocusable option</KebabMenu.Option>
        <KebabMenu.Option>Third option</KebabMenu.Option>
      </>,
    });

    await openMenu();
    const first = await screen.findByText('First option');
    const unfocusable = screen.getByText('Unfocusable option');
    jest.spyOn(unfocusable, 'focus').mockImplementation(() => {});

    first.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByText('Third option')).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(first).toHaveFocus();
  });
});
