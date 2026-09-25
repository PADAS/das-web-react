import React from 'react';
import { Provider } from 'react-redux';

import patrolTypes, { dogPatrol } from '../../../../../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { render, screen } from '../../../../../test-utils';

import Header from './';
import SvgIcon from '../../../../../SvgIcon';

jest.mock('../../../../../SvgIcon', () => jest.fn(() => null));

describe('SideBar - PatrolsManager - LegManager - NewLeg - Header', () => {
  const patrol = {
    id: '93485e1d-6804-459b-9243-1d239556bb48',
    patrol_segments: [],
    serial_number: 4867,
    title: 'Delta Patrol',
  };

  const renderHeader = (props) => render(<Provider store={mockStore({ data: { patrolTypes } })}>
    <Header patrol={patrol} patrolType={dogPatrol} {...props} />
  </Provider>);

  test('shows the breadcrumb of the route', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Patrols' })).toHaveAttribute('href', '/patrols');
    expect(screen.getByRole('link', { name: 'Delta Patrol' }))
      .toHaveAttribute('href', '/patrols/93485e1d-6804-459b-9243-1d239556bb48');
    expect(screen.getByText('New Patrol Leg', { selector: 'span' })).toHaveAttribute('aria-current', 'page');
  });

  test('names an untitled patrol after its patrol type in the breadcrumb', () => {
    renderHeader({
      patrol: { ...patrol, patrol_segments: [{ id: 'leg', patrol_type: dogPatrol.value }], title: null },
    });

    expect(screen.getByRole('link', { name: dogPatrol.display }))
      .toHaveAttribute('href', '/patrols/93485e1d-6804-459b-9243-1d239556bb48');
  });

  test('titles the view after the leg being planned', () => {
    renderHeader();

    expect(screen.getByRole('heading', { name: 'New Patrol Leg' })).toBeVisible();
  });

  test('shows the ticker number of the patrol the leg is being added to', () => {
    renderHeader();

    expect(screen.getByText('4867')).toBeVisible();
  });

  test('marks the leg being planned as new', () => {
    renderHeader();

    expect(screen.getByText('New')).toBeVisible();
  });

  test('shows the icon of the patrol type the leg is being planned with', () => {
    renderHeader();

    expect(SvgIcon.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ iconId: 'dog-patrol-icon' }));
  });

  test('shows the patrol type icon in the color of a new leg', () => {
    renderHeader();

    expect(screen.getByTestId('newLegHeader-icon')).toHaveClass('new');
  });

  test('shows the patrol type the leg is being planned with below the title', () => {
    renderHeader();

    expect(screen.getByText('Dog Patrol', { selector: 'p' })).toBeVisible();
  });

  test('closes the sidebar', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });
});
