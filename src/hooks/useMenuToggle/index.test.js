import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';

import Menu from '../../Menu';

import useMenuToggle from './';

describe('hooks - useMenuToggle', () => {
  let onToggle;

  beforeEach(() => {
    onToggle = jest.fn();
  });

  const MenuWithToggle = ({ defaultShow, isDisabled }) => {
    const menuToggle = useMenuToggle({ defaultShow, isDisabled, onToggle });

    return <>
      <button type="button" {...menuToggle.toggleProps}>Toggle</button>

      <button type="button">Outside</button>

      <Menu aria-label="Actions" {...menuToggle.menuProps}>
        <Menu.Option>First option</Menu.Option>

        <Menu.Option>Last option</Menu.Option>
      </Menu>
    </>;
  };

  const renderMenuWithToggle = (props = {}) => render(<MenuWithToggle {...props} />);

  const getToggle = () => screen.getByRole('button', { name: 'Toggle' });

  test('ties the toggle to the menu it opens', async () => {
    renderMenuWithToggle();

    expect(getToggle()).toHaveAttribute('aria-haspopup', 'menu');
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(getToggle());

    expect(getToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(getToggle()).toHaveAttribute('aria-controls', screen.getByRole('menu', { name: 'Actions' }).id);
  });

  test('shows the menu from the start when it is shown by default', () => {
    renderMenuWithToggle({ defaultShow: true });

    expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument();
  });

  test('does not open the menu while disabled', async () => {
    renderMenuWithToggle({ isDisabled: true });

    await userEvent.click(getToggle());

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onToggle).not.toHaveBeenCalled();
  });

  test('focuses the last option when the user presses the up arrow on the toggle', async () => {
    renderMenuWithToggle();

    getToggle().focus();

    await userEvent.keyboard('{ArrowUp}');

    expect(await screen.findByRole('menuitem', { name: 'Last option' })).toHaveFocus();
  });

  test('returns focus to the toggle when the user closes the menu with escape', async () => {
    renderMenuWithToggle();

    getToggle().focus();

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(getToggle()).toHaveFocus();
  });

  test('reports each opening and closing of the menu once', async () => {
    renderMenuWithToggle();

    await userEvent.click(getToggle());
    await userEvent.click(getToggle());

    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(onToggle).toHaveBeenNthCalledWith(1, true);
    expect(onToggle).toHaveBeenNthCalledWith(2, false);
  });

  test('reports the menu closing when the user clicks outside it', async () => {
    renderMenuWithToggle();

    await userEvent.click(getToggle());
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

    expect(onToggle).toHaveBeenLastCalledWith(false);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});
