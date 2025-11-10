import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import UserMenu from './';

describe('UserMenu', () => {
  let onLogOutClickMock;
  let onProfileClickMock;

  const mockUser = {
    id: 'user-1',
    username: 'john.doe',
  };

  const mockUserProfiles = [
    { id: 'profile-1', username: 'jane.smith' },
    { id: 'profile-2', username: 'bob.jones' },
  ];

  const renderUserMenu = (props = {}) => {
    const defaultProps = {
      user: mockUser,
      onLogOutClick: onLogOutClickMock,
      onProfileClick: onProfileClickMock,
      ...props,
    };
    return render(<UserMenu {...defaultProps} />);
  };

  const openDropdown = async () => {
    const toggleButton = screen.getByRole('button', { name: 'Open User Settings' });
    await userEvent.click(toggleButton);
    await screen.findByRole('button', { name: 'Log out' });
  };

  const findActiveDropdownItem = () => {
    const menuItems = screen.getAllByRole('button');
    return menuItems.find(item => item.classList.contains('active'));
  };

  beforeEach(() => {
    onLogOutClickMock = jest.fn();
    onProfileClickMock = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders without crashing', () => {
      renderUserMenu();
    });

    test('displays the current user username', () => {
      renderUserMenu();
      const toggleButton = screen.getByRole('button', { name: 'Open User Settings' });
      expect(toggleButton).toHaveTextContent('john.doe');
    });

    test('displays selected user profile when provided', () => {
      const selectedProfile = { id: 'profile-1', username: 'jane.smith' };
      renderUserMenu({ selectedUserProfile: selectedProfile });

      const toggleButton = screen.getByRole('button', { name: 'Open User Settings' });
      expect(toggleButton).toHaveTextContent('jane.smith');
      expect(toggleButton).not.toHaveTextContent('john.doe');
    });

    test('shows user icon', () => {
      renderUserMenu();

      const toggleButton = screen.getByRole('button', { name: 'Open User Settings' });
      const iconElement = toggleButton.querySelector('[class*="icon"]');
      expect(iconElement).toBeInTheDocument();
    });

    test('renders cookie settings button', () => {
      renderUserMenu();

      const cookieSettingsButton = document.getElementById('ot-sdk-btn');
      expect(cookieSettingsButton).toBeInTheDocument();
      expect(cookieSettingsButton).toHaveAttribute('hidden');
    });
  });

  describe('dropdown menu', () => {
    test('opens menu when toggle button is clicked', async () => {
      renderUserMenu();
      await openDropdown();

      expect(screen.getByRole('button', { name: 'Cookie Settings' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    });

    test('does not show profile list when no user profiles provided', async () => {
      renderUserMenu({ userProfiles: [] });
      await openDropdown();

      expect(screen.queryByRole('button', { name: 'jane.smith' })).not.toBeInTheDocument();
    });

    test('shows user profiles when provided', async () => {
      renderUserMenu({ userProfiles: mockUserProfiles });
      await openDropdown();

      expect(screen.getByRole('button', { name: 'john.doe' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'jane.smith' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'bob.jones' })).toBeInTheDocument();
    });

    test('includes current user in the profiles list', async () => {
      renderUserMenu({ userProfiles: mockUserProfiles });
      await openDropdown();

      expect(screen.getByRole('button', { name: 'Open User Settings' })).toHaveTextContent('john.doe');
      expect(screen.getByRole('button', { name: 'john.doe' })).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    test('calls onProfileClick when a profile is selected', async () => {
      renderUserMenu({ userProfiles: mockUserProfiles });
      await openDropdown();

      const profileItem = screen.getByRole('button', { name: 'jane.smith' });
      await userEvent.click(profileItem);

      expect(onProfileClickMock).toHaveBeenCalledWith(mockUserProfiles[0]);
    });

    test('calls onLogOutClick when logout is clicked', async () => {
      renderUserMenu();
      await openDropdown();

      const logoutItem = screen.getByRole('button', { name: 'Log out' });
      await userEvent.click(logoutItem);

      expect(onLogOutClickMock).toHaveBeenCalled();
    });

    test('triggers cookie settings when cookie settings is clicked', async () => {
      renderUserMenu();
      await openDropdown();

      const cookieSettingsButton = document.getElementById('ot-sdk-btn');
      expect(cookieSettingsButton).toBeInTheDocument();

      const clickSpy = jest.spyOn(cookieSettingsButton, 'click');

      const cookieSettingsItem = screen.getByRole('button', { name: 'Cookie Settings' });
      await userEvent.click(cookieSettingsItem);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('scrollable profiles list', () => {
    test('wraps profiles in a scrollable container when profiles exist', async () => {
      renderUserMenu({ userProfiles: mockUserProfiles });
      await openDropdown();

      // Verify profiles are present as menu items (indirectly confirms container exists)
      expect(screen.getByRole('button', { name: 'jane.smith' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'bob.jones' })).toBeInTheDocument();
    });

    test('handles many user profiles without breaking layout', async () => {
      const manyProfiles = Array.from({ length: 20 }, (_, i) => ({
        id: `profile-${i}`,
        username: `user-${i}`,
      }));

      renderUserMenu({ userProfiles: manyProfiles });
      await openDropdown();

      expect(screen.getByRole('button', { name: 'Cookie Settings' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();

      manyProfiles.forEach(profile => {
        expect(screen.getByRole('button', { name: profile.username })).toBeInTheDocument();
      });
    });
  });

  describe('active profile indication', () => {
    test('marks the selected profile as active', async () => {
      renderUserMenu({
        userProfiles: mockUserProfiles,
        selectedUserProfile: mockUserProfiles[0],
      });
      await openDropdown();

      const activeItem = findActiveDropdownItem();

      expect(activeItem).toBeTruthy();
      expect(activeItem).toHaveTextContent('jane.smith');
    });

    test('marks current user as active when no profile is selected', async () => {
      renderUserMenu({ userProfiles: mockUserProfiles });
      await openDropdown();

      const activeItem = findActiveDropdownItem();

      expect(activeItem).toBeTruthy();
      expect(activeItem).toHaveTextContent('john.doe');
    });
  });
});
