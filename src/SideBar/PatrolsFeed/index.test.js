import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { activePatrol, donePatrol } from '../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../__test-helpers/MockStore';
import PatrolList from '../../PatrolList';
import { render, screen } from '../../test-utils';
import useNavigate from '../../hooks/useNavigate';
import useFetchPatrolsFeed from '../useFetchPatrolsFeed';

import PatrolsFeed from './';

jest.mock('../../hooks/useNavigate', () => jest.fn());
jest.mock('../useFetchPatrolsFeed', () => jest.fn());
/* eslint-disable-next-line react/display-name */
jest.mock('../../PatrolFilter', () => () => <h6>Patrol Filter</h6>);
jest.mock('../../PatrolList', () => jest.fn());

describe('SideBar - PatrolsFeed', () => {
  let store, navigate;

  beforeEach(() => {
    store = {
      data: {
        patrolsFeed: [],
        patrolStore: {},
      },
      view: {},
    };

    navigate = jest.fn();
    useNavigate.mockImplementation(() => navigate);
    useFetchPatrolsFeed.mockImplementation(() => ({ loadingPatrolsFeed: false }));
    PatrolList.mockImplementation(() => null);
  });

  const renderPatrolsFeed = () => render(
    <Provider store={mockStore(store)}>
      <PatrolsFeed />
    </Provider>
  );

  test('shows the patrol filter', () => {
    renderPatrolsFeed();

    expect(screen.getByRole('heading', { name: 'Patrol Filter' })).toBeInTheDocument();
  });

  test('shows the patrol list while loading the patrols feed', () => {
    useFetchPatrolsFeed.mockImplementation(() => ({ loadingPatrolsFeed: true }));
    PatrolList.mockImplementation(({ loading }) => <div>{loading ? 'Loading patrols' : 'Patrols loaded'}</div>);

    renderPatrolsFeed();

    expect(screen.getByText('Loading patrols')).toBeInTheDocument();
  });

  test('shows the patrol list with the sorted patrols', () => {
    store.data.patrolsFeed = [donePatrol.id, activePatrol.id];
    store.data.patrolStore = {
      [donePatrol.id]: donePatrol,
      [activePatrol.id]: activePatrol,
    };

    PatrolList.mockImplementation(({ patrols }) => (
      <ul>
        {patrols.map((patrol) => <li key={patrol.id}>{patrol.title}</li>)}
      </ul>
    ));

    renderPatrolsFeed();

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      activePatrol.title,
      donePatrol.title,
    ]);
  });

  test('navigates to the patrol overview when a patrol is clicked', async () => {
    store.data.patrolsFeed = [activePatrol.id];
    store.data.patrolStore = { [activePatrol.id]: activePatrol };

    PatrolList.mockImplementation(({ patrols, onItemClick }) => (
      <ul>
        {patrols.map((patrol) => (
          <li key={patrol.id}>
            <button onClick={() => onItemClick(patrol.id)}>{patrol.title}</button>
          </li>
        ))}
      </ul>
    ));

    renderPatrolsFeed();

    await userEvent.click(screen.getByRole('button', { name: activePatrol.title }));

    expect(navigate).toHaveBeenCalledWith(activePatrol.id);
  });
});
