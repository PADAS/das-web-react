import React from 'react';
import { Provider } from 'react-redux';

import { fetchPatrol } from '../../../ducks/patrols';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import patrols from '../../../__test-helpers/fixtures/patrols';
import { render, screen } from '../../../test-utils';
import * as trackUtils from '../../../utils/tracks';

import PatrolOverview from './';

jest.mock('../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../ducks/patrols'),
  fetchPatrol: jest.fn(),
}));

describe('SideBar - PatrolsManager - PatrolOverview', () => {
  const patrolWithoutLeader = patrols[0];
  const patrolWithLeader = patrols[1];

  let store;
  beforeEach(() => {
    jest.clearAllMocks();

    fetchPatrol.mockReturnValue({ type: 'FETCH_PATROL' });
    jest.spyOn(trackUtils, 'fetchTracksIfNecessary').mockImplementation(() => Promise.resolve({}));

    store = {
      data: {
        patrolStore: {},
        patrolTypes,
        subjectStore: {},
        tracks: {},
      },
      view: {
        patrolTrackState: {
          pinned: [],
          visible: [],
        },
        timeSliderState: {
          active: false,
        },
      },
    };
  });

  const renderPatrolOverview = (patrolId) => render(
    <Provider store={mockStore(store)}>
      <PatrolOverview />
    </Provider>,
    { initialEntries: [`/patrols/${patrolId}`] }
  );

  test('fetches the patrol if it is not in the store', () => {
    renderPatrolOverview(patrolWithoutLeader.id);

    expect(fetchPatrol).toHaveBeenCalledWith(patrolWithoutLeader.id);
  });

  test('does not fetch the patrol if it is in the store', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(fetchPatrol).not.toHaveBeenCalled();
  });

  test('fetches the patrol leg tracks if necessary', () => {
    store.data.patrolStore[patrolWithLeader.id] = patrolWithLeader;

    renderPatrolOverview(patrolWithLeader.id);

    const segment = patrolWithLeader.patrol_segments[0];

    expect(trackUtils.fetchTracksIfNecessary).toHaveBeenCalledWith(
      [segment.leader.id],
      {
        optionalDateBoundaries: {
          since: segment.time_range.start_time,
          until: segment.time_range.end_time,
        },
      },
    );
  });

  test('shows a loader if the patrol is not in the store', () => {
    renderPatrolOverview(patrolWithoutLeader.id);

    expect(screen.getByTestId('patrolOverview-loader')).toBeInTheDocument();
    expect(screen.queryByTestId('patrolOverview-title')).not.toBeInTheDocument();
  });

  test('shows the header', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(screen.getByTestId('patrolOverview-title')).toHaveValue(patrolWithoutLeader.title);
  });

  test('shows the tabs', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(screen.getByTestId('patrolOverview-overviewTab')).toBeInTheDocument();
    expect(screen.getByTestId('patrolOverview-historyTab')).toBeInTheDocument();
  });

  test('shows the footer', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(screen.getByText('Save Patrol')).toBeInTheDocument();
  });
});
