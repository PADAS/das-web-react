import React from 'react';

import { dogPatrol } from '../../../../../__test-helpers/fixtures/patrol-types';
import { render, screen } from '../../../../../test-utils';

import Header from './';
import SvgIcon from '../../../../../SvgIcon';

jest.mock('../../../../../SvgIcon', () => jest.fn(() => null));

describe('SideBar - PatrolsManager - LegManager - NewLeg - Header', () => {
  const renderHeader = (props) => render(
    <Header
      patrolId="93485e1d-6804-459b-9243-1d239556bb48"
      patrolTitle="Delta Patrol"
      patrolType={dogPatrol}
      {...props}
    />
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

  test('marks the leg being planned as new', () => {
    renderHeader();

    expect(screen.getByText('New')).toBeVisible();
  });

  test('shows the icon of the patrol type the leg is being planned with', () => {
    renderHeader();

    expect(SvgIcon.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ iconId: 'dog-patrol-icon' }));
  });

  test('closes the sidebar', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });
});
