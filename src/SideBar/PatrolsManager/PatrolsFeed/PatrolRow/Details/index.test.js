import React from 'react';
import { Provider } from 'react-redux';

import { activePatrol } from '../../../../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import * as patrolSelectors from '../../../../../selectors/patrols';
import { render, screen } from '../../../../../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../../../../../ducks/tracks';

import Details from './';

describe('SideBar - PatrolsManager - PatrolsFeed - PatrolRow - Details', () => {
  let store;

  beforeAll(() => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2022-02-01'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        subjectStore: {},
        tracks: {},
      },
      view: {
        patrolTrackState: { hiddenSubjects: {}, pinned: [], visible: [] },
        timeSliderState: { active: false },
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderDetails = (props) => render(
    <Provider store={mockStore(store)}>
      <Details patrol={activePatrol} {...props} />
    </Provider>
  );

  test('leaves the distance out until every leg the patrol ran has reported one', () => {
    jest.spyOn(patrolSelectors, 'selectPatrolLeadSumDistance').mockReturnValue(null);

    renderDetails();

    expect(screen.getByText(/\|\s*-$/)).toBeVisible();
  });

  test('shows the distance the patrol covered', () => {
    jest.spyOn(patrolSelectors, 'selectPatrolLeadSumDistance').mockReturnValue(23.24);

    renderDetails();

    expect(screen.getByText(/23.2km$/)).toBeVisible();
  });

  test('does not name the leg while the patrol is still on its first', () => {
    jest.spyOn(patrolSelectors, 'selectPatrolLeadSumDistance').mockReturnValue(1);

    renderDetails({ legNumber: 1 });

    expect(screen.queryByText(/Leg 1/)).toBeNull();
  });

  test('names the leg once the patrol is past its first', () => {
    jest.spyOn(patrolSelectors, 'selectPatrolLeadSumDistance').mockReturnValue(1);

    renderDetails({ legNumber: 2 });

    expect(screen.getByText(/^Leg 2/)).toBeVisible();
  });
});
