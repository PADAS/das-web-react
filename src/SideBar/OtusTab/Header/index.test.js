import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../test-utils';

import Header from './';

describe('SideBar - OtusTab - Header', () => {
  let onClose, onNewConversation, onToggleRecent;
  beforeEach(() => {
    onClose = jest.fn();
    onNewConversation = jest.fn();
    onToggleRecent = jest.fn();
  });

  const renderHeader = (props = {}) => render(<Header
    onClose={onClose}
    onNewConversation={onNewConversation}
    onToggleRecent={onToggleRecent}
    {...props}
  />);

  test('shows the title', () => {
    renderHeader();

    expect(screen.getByRole('heading', { name: 'Otus' })).toBeVisible();
  });

  test('shows the beta badge', () => {
    renderHeader();

    expect(screen.getByText('Beta')).toBeVisible();
  });

  test('shows the new conversation, recent and close buttons', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'New conversation' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Recent' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Close Otus' })).toBeVisible();
  });

  test('starts a new conversation when the user clicks the new conversation button', async () => {
    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'New conversation' }));

    expect(onNewConversation).toHaveBeenCalledTimes(1);
  });

  test('toggles the recent conversations when the user clicks the recent button', async () => {
    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Recent' }));

    expect(onToggleRecent).toHaveBeenCalledTimes(1);
  });

  test('closes the tab when the user clicks the close button', async () => {
    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Close Otus' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
