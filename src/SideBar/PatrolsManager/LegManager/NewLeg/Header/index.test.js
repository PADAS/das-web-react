import React from 'react';

import { render, screen } from '../../../../../test-utils';

import Header from './';

describe('SideBar - PatrolsManager - LegManager - NewLeg - Header', () => {
  const renderHeader = () => render(
    <Header patrolId="93485e1d-6804-459b-9243-1d239556bb48" patrolTitle="Delta Patrol" />
  );

  test('shows the breadcrumb of the route', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Patrols' })).toHaveAttribute('href', '/patrols');
    expect(screen.getByRole('link', { name: 'Delta Patrol' }))
      .toHaveAttribute('href', '/patrols/93485e1d-6804-459b-9243-1d239556bb48');
    expect(screen.getByText('New Patrol Leg', { selector: 'span' })).toHaveAttribute('aria-current', 'page');
  });

  test('titles the view after the leg being planned', () => {
    renderHeader();

    expect(screen.getByRole('heading', { name: 'New Patrol Leg' })).toBeVisible();
  });

  test('closes the sidebar', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });
});
