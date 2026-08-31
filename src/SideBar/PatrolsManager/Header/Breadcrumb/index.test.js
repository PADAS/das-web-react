import React from 'react';

import { render, screen } from '../../../../test-utils';

import Breadcrumb from './';

describe('SideBar - PatrolsManager - Header - Breadcrumb', () => {
  const renderBreadcrumb = (props) => render(<Breadcrumb
    aria-label="Patrol navigation"
    crumbs={[
      { label: 'Patrols', to: '/patrols' },
      { label: 'Delta Patrol', to: '/patrols/123' },
      { label: 'New Patrol Leg' },
    ]}
    {...props}
  />);

  test('labels the navigation landmark', () => {
    renderBreadcrumb();

    expect(screen.getByRole('navigation', { name: 'Patrol navigation' })).toBeVisible();
  });

  test('shows every crumb but the last one as a link', () => {
    renderBreadcrumb();

    expect(screen.getByRole('link', { name: 'Patrols' })).toHaveAttribute('href', '/patrols');
    expect(screen.getByRole('link', { name: 'Delta Patrol' })).toHaveAttribute('href', '/patrols/123');
    expect(screen.queryByRole('link', { name: 'New Patrol Leg' })).toBeNull();
  });

  test('marks the last crumb as the current page', () => {
    renderBreadcrumb();

    expect(screen.getByText('New Patrol Leg')).toHaveAttribute('aria-current', 'page');
  });

  test('shows a single crumb as the current page', () => {
    renderBreadcrumb({ crumbs: [{ label: 'Patrols', to: '/patrols' }] });

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Patrols')).toHaveAttribute('aria-current', 'page');
  });
});
