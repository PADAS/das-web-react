import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import HamburgerMenuIcon from './';

describe('HamburgerMenuIcon', () => {
  let onClick;

  beforeEach(() => {
    onClick = jest.fn();
  });

  const renderHamburgerMenuIcon = (props = {}) => render(<HamburgerMenuIcon
    aria-label="Open Main Menu"
    onClick={onClick}
    {...props}
  />);

  test('renders a plain button named only by its label', () => {
    renderHamburgerMenuIcon();

    const button = screen.getByRole('button', { name: 'Open Main Menu' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAccessibleName('Open Main Menu');
  });

  test('calls its handler when the user presses it with the keyboard', async () => {
    renderHamburgerMenuIcon();

    screen.getByRole('button', { name: 'Open Main Menu' }).focus();

    await userEvent.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('marks itself open', () => {
    renderHamburgerMenuIcon({ isOpen: true });

    expect(screen.getByRole('button', { name: 'Open Main Menu' })).toHaveClass('open');
  });
});
