import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../test-utils';

import UserMenu from './';

describe('UserMenu', () => {
  const user = { id: 'user-1', username: 'john.doe' };
  const userProfiles = [
    { id: 'profile-1', username: 'jane.smith' },
    { id: 'profile-2', username: 'bob.jones' },
  ];

  let onLogOutClick;
  let onProfileClick;
  let osanoBackup;

  beforeEach(() => {
    onLogOutClick = jest.fn();
    onProfileClick = jest.fn();

    osanoBackup = window.Osano;
    delete window.Osano;
  });

  afterEach(() => {
    window.Osano = osanoBackup;
  });

  const renderUserMenu = (props = {}) => render(<UserMenu
    onLogOutClick={onLogOutClick}
    onProfileClick={onProfileClick}
    user={user}
    {...props}
  />);

  const getToggle = () => screen.getByRole('button', { name: /^User settings:/ });

  const openMenu = async () => {
    await userEvent.click(getToggle());

    return screen.findByRole('menu', { name: 'User settings' });
  };

  test('names the toggle after the user, whose username it shows', () => {
    renderUserMenu();

    expect(getToggle()).toHaveAccessibleName('User settings: john.doe');
    expect(getToggle()).toHaveAttribute('title', 'User settings');
    expect(getToggle()).toHaveTextContent('john.doe');
  });

  test('names the toggle after the selected profile while one is active', () => {
    renderUserMenu({ selectedUserProfile: userProfiles[0], userProfiles });

    expect(getToggle()).toHaveAccessibleName('User settings: jane.smith');
    expect(getToggle()).not.toHaveTextContent('john.doe');
  });

  test('shows the toggle collapsed, with the menu closed, by default', () => {
    renderUserMenu();

    expect(getToggle()).toHaveAttribute('aria-haspopup', 'menu');
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('opens the menu when the user clicks the toggle', async () => {
    renderUserMenu();

    const menu = await openMenu();

    expect(getToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(within(menu).getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
  });

  test('focuses the first option when the user opens the menu with the keyboard', async () => {
    renderUserMenu({ userProfiles });

    getToggle().focus();

    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('menuitemradio', { name: 'john.doe' })).toHaveFocus();
  });

  test('does not list profiles when the user has none', async () => {
    renderUserMenu();

    const menu = await openMenu();

    expect(within(menu).queryByRole('group')).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitemradio')).not.toBeInTheDocument();
  });

  test('lists the user and their profiles as a labelled group', async () => {
    renderUserMenu({ userProfiles });

    const menu = await openMenu();
    const profilesGroup = within(menu).getByRole('group', { name: 'User and Profiles' });

    expect(within(profilesGroup).getAllByRole('menuitemradio').map((option) => option.textContent))
      .toEqual(['john.doe', 'jane.smith', 'bob.jones']);
  });

  test('checks the user while no profile is selected', async () => {
    renderUserMenu({ userProfiles });

    await openMenu();

    expect(screen.getByRole('menuitemradio', { name: 'john.doe' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'jane.smith' })).toHaveAttribute('aria-checked', 'false');
  });

  test('checks the selected profile', async () => {
    renderUserMenu({ selectedUserProfile: userProfiles[0], userProfiles });

    await openMenu();

    expect(screen.getByRole('menuitemradio', { name: 'jane.smith' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'john.doe' })).toHaveAttribute('aria-checked', 'false');
  });

  test('switches to a profile and closes the menu when the user picks it', async () => {
    renderUserMenu({ userProfiles });

    await openMenu();
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'jane.smith' }));

    expect(onProfileClick).toHaveBeenCalledWith(userProfiles[0]);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('logs the user out when they pick log out', async () => {
    renderUserMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(onLogOutClick).toHaveBeenCalledTimes(1);
  });

  test('returns focus to the toggle when the user closes the menu with escape', async () => {
    renderUserMenu();

    await openMenu();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(getToggle()).toHaveFocus();
  });

  test('does not offer cookie settings without the Osano consent manager', async () => {
    renderUserMenu();

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'Cookie Settings' })).not.toBeInTheDocument();
  });

  test('opens the Osano cookie drawer when the user picks cookie settings', async () => {
    window.Osano = { cm: { showDrawer: jest.fn() } };

    renderUserMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cookie Settings' }));

    expect(window.Osano.cm.showDrawer).toHaveBeenCalledWith('osano-cm-dom-info-dialog-open');
  });
});
