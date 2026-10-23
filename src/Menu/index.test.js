import userEvent from '@testing-library/user-event';

import { createEvent, fireEvent, render, screen } from '../test-utils';

import Menu, { FOCUS_INTENTS } from './';

describe('Menu', () => {
  let onClose;
  let onFirstOptionClick;
  let onHide;

  beforeEach(() => {
    onClose = jest.fn();
    onFirstOptionClick = jest.fn();
    onHide = jest.fn();
  });

  const buildMenu = (props = {}) => <>
    <button type="button">Elsewhere</button>

    <Menu
      anchor={{ x: 100, y: 200 }}
      aria-label="Options menu"
      id="options-menu"
      onClose={onClose}
      onHide={onHide}
      show
      {...props}
    >
      <Menu.Option onClick={onFirstOptionClick}>First option</Menu.Option>

      <Menu.Option disabled>Second option</Menu.Option>

      <Menu.Divider />

      <Menu.Option>Third option</Menu.Option>
    </Menu>
  </>;

  const renderMenu = (props) => render(buildMenu(props));

  const rightClick = (target) => userEvent.pointer({ keys: '[MouseRight]', target });

  test('does not show the menu while it is hidden', () => {
    renderMenu({ show: false });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('shows the menu with its name and id', async () => {
    renderMenu();

    expect(await screen.findByRole('menu', { name: 'Options menu' })).toHaveAttribute('id', 'options-menu');
  });

  test('shows the menu next to the element it is anchored to, at the placement it is given', async () => {
    const { rerender } = renderMenu({ show: false });

    rerender(buildMenu({ anchor: screen.getByRole('button', { name: 'Elsewhere' }), placement: 'bottom-end' }));

    expect((await screen.findByRole('menu')).parentElement).toHaveAttribute('data-popper-placement', 'bottom-end');
  });

  test('focuses the menu, but none of its options, by default', async () => {
    renderMenu();

    expect(await screen.findByRole('menu')).toHaveFocus();
  });

  test('focuses the first enabled option when that is the focus intent', async () => {
    renderMenu({ focusIntent: FOCUS_INTENTS.FIRST_OPTION });

    expect(await screen.findByRole('menuitem', { name: 'First option' })).toHaveFocus();
  });

  test('focuses the last enabled option when that is the focus intent', async () => {
    renderMenu({ focusIntent: FOCUS_INTENTS.LAST_OPTION });

    expect(await screen.findByRole('menuitem', { name: 'Third option' })).toHaveFocus();
  });

  test('moves focus through the enabled options with the arrow keys', async () => {
    renderMenu();

    await screen.findByRole('menu');

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'First option' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Third option' })).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'First option' })).toHaveFocus();
  });

  test('moves focus to the last and first options with End and Home', async () => {
    renderMenu();

    await screen.findByRole('menu');

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Third option' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'First option' })).toHaveFocus();
  });

  test('closes when Escape is pressed', async () => {
    renderMenu();

    await screen.findByRole('menu');

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  test('closes without trapping the focus when Tab is pressed', async () => {
    renderMenu();

    const menu = await screen.findByRole('menu');
    const tabKeyDown = createEvent.keyDown(menu, { key: 'Tab' });

    fireEvent(menu, tabKeyDown);

    expect(tabKeyDown.defaultPrevented).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });

  test('calls the option handler and closes when an option is clicked', async () => {
    renderMenu();

    await userEvent.click(await screen.findByRole('menuitem', { name: 'First option' }));

    expect(onFirstOptionClick).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test('hides when the user clicks outside of it', async () => {
    renderMenu();

    await screen.findByRole('menu');

    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(onHide).toHaveBeenCalled();
  });

  test('hides when the user right clicks outside of it', async () => {
    renderMenu();

    await screen.findByRole('menu');

    await rightClick(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(onHide).toHaveBeenCalled();
  });

  test('stays open when the user right clicks inside of it', async () => {
    renderMenu();

    await rightClick(await screen.findByRole('menuitem', { name: 'First option' }));

    expect(onHide).not.toHaveBeenCalled();
  });

  test('stays open when the page scrolls by default', async () => {
    renderMenu();

    await screen.findByRole('menu');

    fireEvent.scroll(document);

    expect(onHide).not.toHaveBeenCalled();
  });

  test('hides when anything outside of it scrolls if it should hide on scroll', async () => {
    renderMenu({ shouldHideOnScroll: true });

    await screen.findByRole('menu');

    fireEvent.scroll(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(onHide).toHaveBeenCalled();
  });

  test('stays open when its own content scrolls even if it should hide on scroll', async () => {
    renderMenu({ shouldHideOnScroll: true });

    fireEvent.scroll(await screen.findByRole('menu'));

    expect(onHide).not.toHaveBeenCalled();
  });

  test('stops listening for right clicks once hidden', async () => {
    const { rerender } = renderMenu();

    await screen.findByRole('menu');

    rerender(buildMenu({ show: false }));
    await rightClick(document.body);

    expect(onHide).not.toHaveBeenCalled();
  });
});
