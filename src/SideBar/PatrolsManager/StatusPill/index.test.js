import React from 'react';

import { PATROL_UI_STATES } from '../../../constants';
import { render, screen } from '../../../test-utils';

import StatusPill from './';

describe('SideBar - PatrolsManager - StatusPill', () => {
  const renderStatusPill = (props) => render(<StatusPill state={PATROL_UI_STATES.ACTIVE} {...props} />);

  test('shows the title of the state', () => {
    renderStatusPill();

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('shows the title of every patrol state', () => {
    Object.values(PATROL_UI_STATES).forEach((state) => {
      const { unmount } = renderStatusPill({ state });

      expect(screen.getByText(/\w/)).toBeInTheDocument();

      unmount();
    });
  });

  test('renders the element given to it, with the props it does not use', () => {
    renderStatusPill({ as: 'button', onClick: () => {}, title: 'Change the status', type: 'button' });

    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
  });

  test('shows its children after the state title', () => {
    renderStatusPill({ children: <span>Caret</span> });

    expect(screen.getByText('Caret')).toBeInTheDocument();
  });
});
