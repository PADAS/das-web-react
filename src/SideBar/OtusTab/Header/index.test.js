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

    expect(screen.getByRole('heading', { name: 'Atlas' })).toBeVisible();
  });

  test('shows the beta badge', () => {
    renderHeader();

    expect(screen.getByText('Beta')).toBeVisible();
  });

  test('shows the new conversation, recent and close buttons', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'New conversation' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Recent' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Close Atlas' })).toBeVisible();
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

  test('shows the recent button as not pressed when the recent conversations are closed', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('shows the recent button as pressed when the recent conversations are open', () => {
    renderHeader({ isRecentOpen: true });

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('closes the tab when the user clicks the close button', async () => {
    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Close Atlas' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
