import React from 'react';
import { Provider } from 'react-redux';

import { mockStore } from '../../../../__test-helpers/MockStore';
import patrolTypes from '../../../../__test-helpers/fixtures/patrol-types';
import { multiLegPatrol } from '../../../../__test-helpers/fixtures/patrols';
import { render, screen } from '../../../../test-utils';

import Overview from './';

describe('SideBar - PatrolsManager - PatrolOverview - Overview', () => {
  const patrolWithLeader = multiLegPatrol;

  let store;
  beforeEach(() => {
    store = {
      data: {
        patrolTypes,
        tracks: {},
      },
      view: {
        timeSliderState: {},
      },
    };
  });

  const renderOverview = (props) => render(
    <Provider store={mockStore(store)}>
      <Overview patrol={patrolWithLeader} {...props} />
    </Provider>
  );

  test('shows the legs', () => {
    renderOverview();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(patrolWithLeader.patrol_segments.length + 1);
  });

  test('shows the activity', () => {
    renderOverview();

    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
  });
});
