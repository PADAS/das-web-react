import React from 'react';

import { render, screen } from '../../test-utils';

import PatrolsManager from './';

jest.mock('../../hooks/useNavigate', () => jest.fn());
/* eslint-disable-next-line react/display-name */
jest.mock('../PatrolsFeed', () => () => <div>Patrols Feed</div>);
/* eslint-disable-next-line react/display-name */
jest.mock('./LegManager', () => () => <div>Leg Manager</div>);
/* eslint-disable-next-line react/display-name */
jest.mock('./NewPatrol', () => () => <div>New Patrol</div>);
/* eslint-disable-next-line react/display-name */
jest.mock('./PatrolOverview', () => () => <div>Patrol Overview</div>);

describe('SideBar - PatrolsManager', () => {
  const renderPatrolsManager = (initialEntries) => render(<PatrolsManager />, { initialEntries });

  test('renders the patrols feed when the path is /patrols', () => {
    renderPatrolsManager(['/']);

    expect(screen.getByText('Patrols Feed')).toBeInTheDocument();
  });

  test('renders the new patrol when the path is /patrols/new', () => {
    renderPatrolsManager(['/new']);

    expect(screen.getByText('New Patrol')).toBeInTheDocument();
  });

  test('renders the patrol overview when the path is /patrols/:patrolId', () => {
    renderPatrolsManager(['/93485e1d-6804-459b-9243-1d239556bb48']);

    expect(screen.getByText('Patrol Overview')).toBeInTheDocument();
  });

  test('renders the leg manager when the path is /patrols/:patrolId/legs/*', () => {
    renderPatrolsManager(['/93485e1d-6804-459b-9243-1d239556bb48/legs/new']);

    expect(screen.getByText('Leg Manager')).toBeInTheDocument();
  });
});
