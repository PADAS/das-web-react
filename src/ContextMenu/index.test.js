import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen, waitForElementToBeRemoved } from '../test-utils';

import KebabMenu from '../KebabMenu';
import Menu from '../Menu';

import ContextMenu from './';

describe('ContextMenu', () => {
  let onFirstOptionClick;

  beforeEach(() => {
    onFirstOptionClick = jest.fn();
  });

  const renderContextMenu = (props = {}) => {
    const contextMenuRef = { current: null };

    return render(<>
      <div onContextMenu={(event) => contextMenuRef.current.open(event)}>
        Right click area

        <button type="button">Focusable target</button>
      </div>

      <ContextMenu aria-label="Options menu" ref={contextMenuRef} {...props}>
        <Menu.Option onClick={onFirstOptionClick}>First option</Menu.Option>

        <Menu.Option>Second option</Menu.Option>
      </ContextMenu>

      <button type="button">Elsewhere</button>
    </>);
  };

  const rightClick = (target) => userEvent.pointer({ keys: '[MouseRight]', target });

  const getPopperTransform = async () => (await screen.findByRole('menu')).parentElement.style.transform;

  test('does not show the menu until it is opened', () => {
    renderContextMenu();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('replaces the browser menu with its own when the user right clicks the area', async () => {
    renderContextMenu();

    expect(fireEvent.contextMenu(screen.getByText('Right click area'))).toBe(false);
    expect(await screen.findByRole('menu', { name: 'Options menu' })).toBeInTheDocument();
  });

  test('shows the menu at the pointer', async () => {
    renderContextMenu();

    fireEvent.contextMenu(screen.getByText('Right click area'), { clientX: 0, clientY: 0 });

    expect(await getPopperTransform()).toBe('translate(0px, 0px)');
  });

  test('shows the menu next to its target when the event comes from the context menu key', async () => {
    renderContextMenu();

    const button = screen.getByRole('button', { name: 'Focusable target' });
    jest.spyOn(button, 'getBoundingClientRect').mockReturnValue(
      { bottom: 30, height: 20, left: 10, right: 60, top: 10, width: 50, x: 10, y: 10 }
    );

    fireEvent.contextMenu(button, { clientX: 500, clientY: 500 });

    expect(await getPopperTransform()).toMatch(/^translate\(10px, /);
  });

  test('focuses the menu, but none of its options', async () => {
    renderContextMenu();

    await rightClick(screen.getByText('Right click area'));

    expect(await screen.findByRole('menu')).toHaveFocus();
  });

  test('calls the option handler and hides the menu when an option is clicked', async () => {
    renderContextMenu();

    await rightClick(screen.getByText('Right click area'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'First option' }));

    expect(onFirstOptionClick).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('hides the menu and returns focus to what the user right clicked when Escape is pressed', async () => {
    renderContextMenu();

    await rightClick(screen.getByRole('button', { name: 'Focusable target' }));
    await screen.findByRole('menu');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Focusable target' })).toHaveFocus();
  });

  test('focuses its first option when the event comes from the context menu key', async () => {
    renderContextMenu();

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Focusable target' }), { clientX: 500, clientY: 500 });

    expect(await screen.findByRole('menuitem', { name: 'First option' })).toHaveFocus();
  });

  test('returns focus to a control in the area when the menu opened over no control is closed with Escape', async () => {
    renderContextMenu();

    await rightClick(screen.getByText('Right click area'));
    await screen.findByRole('menu');

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Focusable target' })).toHaveFocus();
  });

  test('focuses the menu again when the user right clicks the area again', async () => {
    renderContextMenu();

    await rightClick(screen.getByText('Right click area'));
    await screen.findByRole('menu');
    await rightClick(screen.getByText('Right click area'));

    expect(screen.getByRole('menu')).toHaveFocus();
  });

  test('returns focus to what the user first right clicked when the menu reopened over itself is closed with Escape', async () => {
    renderContextMenu();

    await rightClick(screen.getByRole('button', { name: 'Focusable target' }));
    await screen.findByRole('menu');
    await rightClick(screen.getByText('Right click area'));

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Focusable target' })).toHaveFocus();
  });

  test('returns focus to a control in the area when the menu that took over from another is closed with Escape', async () => {
    const contextMenuRef = { current: null };
    render(<>
      <KebabMenu aria-label="Kebab menu">
        <Menu.Option>Kebab option</Menu.Option>
      </KebabMenu>

      <div onContextMenu={(event) => contextMenuRef.current.open(event)}>
        Right click area

        <button type="button">Focusable target</button>
      </div>

      <ContextMenu aria-label="Options menu" ref={contextMenuRef}>
        <Menu.Option>First option</Menu.Option>
      </ContextMenu>
    </>);

    await userEvent.click(screen.getByRole('button', { name: 'Kebab menu' }));
    await screen.findByRole('menu', { name: 'Kebab menu' });
    await rightClick(screen.getByText('Right click area'));
    await screen.findByRole('menu', { name: 'Options menu' });

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Focusable target' })).toHaveFocus();
  });

  test('hides the menu when the user clicks outside of it', async () => {
    renderContextMenu();

    await rightClick(screen.getByText('Right click area'));
    await screen.findByRole('menu');

    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('hides the menu when the user right clicks outside of it', async () => {
    renderContextMenu();

    await rightClick(screen.getByText('Right click area'));
    await screen.findByRole('menu');

    await rightClick(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('hides the menu when the page scrolls', async () => {
    renderContextMenu();

    await rightClick(screen.getByText('Right click area'));
    const menu = await screen.findByRole('menu');

    fireEvent.scroll(document);

    await waitForElementToBeRemoved(menu);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('keeps the menu open when the user right clicks the area again', async () => {
    renderContextMenu();

    await rightClick(screen.getByText('Right click area'));
    await screen.findByRole('menu');

    await rightClick(screen.getByText('Right click area'));

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  test('neither opens nor lets the browser menu through while an action it started is loading', () => {
    renderContextMenu({ isLoading: true });

    expect(fireEvent.contextMenu(screen.getByText('Right click area'))).toBe(false);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
