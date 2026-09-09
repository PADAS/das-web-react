import React from 'react';

import { PATROL_UI_STATES } from '../../../../../constants';
import { render, screen } from '../../../../../test-utils';

import Header from './';

describe('SideBar - PatrolsManager - LegManager - EditLeg - Header', () => {
  let patrol, patrolSegment;
  beforeEach(() => {
    patrolSegment = { id: '76794b2f-cbb2-49ed-b0dd-9335ae471562', is_pause: false };

    patrol = {
      id: '93485e1d-6804-459b-9243-1d239556bb48',
      patrol_segments: [patrolSegment],
      title: 'Delta Patrol',
    };
  });

  const renderHeader = (props) => render(
    <Header
      legNumber={1}
      legState={PATROL_UI_STATES.ACTIVE}
      patrol={patrol}
      patrolSegment={patrolSegment}
      {...props}
    />
  );

  test('shows the breadcrumb of the route', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Patrols' })).toHaveAttribute('href', '/patrols');
    expect(screen.getByRole('link', { name: 'Delta Patrol' }))
      .toHaveAttribute('href', '/patrols/93485e1d-6804-459b-9243-1d239556bb48');
    expect(screen.getByText('Edit Leg 1', { selector: 'span' })).toHaveAttribute('aria-current', 'page');
  });

  test('titles the view after the leg being edited', () => {
    renderHeader();

    expect(screen.getByRole('heading', { name: 'Edit Leg 1' })).toBeVisible();
  });

  test('shows the state of the leg', () => {
    renderHeader();

    expect(screen.getByText('Active')).toBeVisible();
  });

  test('tells a paused leg apart from the state of the patrol it belongs to', () => {
    patrolSegment.is_pause = true;

    renderHeader({ legState: PATROL_UI_STATES.DONE });

    expect(screen.getByText('Paused')).toBeVisible();
    expect(screen.getByText('Done')).toBeVisible();
  });

  test('does not repeat the paused state of a leg that is paused right now', () => {
    patrolSegment.is_pause = true;

    renderHeader({ legState: PATROL_UI_STATES.PAUSED });

    expect(screen.getAllByText('Paused')).toHaveLength(1);
  });

  test('marks a patrol running from the mobile app', () => {
    patrol.provenance = 'mobile';

    renderHeader();

    expect(screen.getByText('Mobile')).toBeVisible();
  });

  test('does not mark a patrol running from the web client', () => {
    renderHeader();

    expect(screen.queryByText('Mobile')).toBeNull();
  });

  test('closes the sidebar', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });
});
