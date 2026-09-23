import React from 'react';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';

import { activePatrol, scheduledPatrol } from '../../../__test-helpers/fixtures/patrols';
import { createMapMock } from '../../../__test-helpers/mocks';
import { INITIAL_FILTER_STATE } from '../../../ducks/patrol-filter';
import { MapContext } from '../../../MapContext';
import { mockStore } from '../../../__test-helpers/MockStore';
import { PATROLS_API_URL } from '../../../ducks/patrols';
import { PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../../../constants';
import { render, screen, within } from '../../../test-utils';
import { SidebarScrollProvider } from '../../../SidebarScrollContext';
import { TRACK_LENGTH_ORIGINS } from '../../../ducks/tracks';

import PatrolsFeed from './';

jest.mock('../../../SvgIcon', () => {
  const SvgIcon = ({ iconId }) => <span>{iconId}</span>;

  return SvgIcon;
});

const server = setupServer(
  http.get(PATROLS_API_URL, () => HttpResponse.json({ data: { next: null, results: [] } }))
);

describe('SideBar - PatrolsManager - PatrolsFeed', () => {
  const map = createMapMock();

  let store;

  beforeAll(() => {
    server.listen();

    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2022-02-01'));
  });

  afterEach(() => server.resetHandlers());

  afterAll(() => {
    server.close();

    jest.useRealTimers();
  });

  beforeEach(() => {
    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        eventSchemas: { globalSchema: { properties: { reported_by: { enum_ext: [] } } } },
        patrolFilter: {
          filter: {
            date_range: { ...INITIAL_FILTER_STATE.filter.date_range },
            patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
            patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange,
            text: INITIAL_FILTER_STATE.filter.text,
            tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
          },
          status: INITIAL_FILTER_STATE.status,
        },
        patrolStore: { [activePatrol.id]: activePatrol, [scheduledPatrol.id]: scheduledPatrol },
        patrolTeamAndTrackingOptions: { leaders: [] },
        patrolTypes: [],
        patrolsFeed: [activePatrol.id, scheduledPatrol.id],
        subjectStore: {},
        tracks: {},
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE] } },
      },
      view: {
        patrolTrackState: { hiddenSubjects: {}, pinned: [], visible: [] },
        timeSliderState: { active: false },
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
      },
    };
  });

  const renderPatrolsFeed = () => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <SidebarScrollProvider>
          <PatrolsFeed />
        </SidebarScrollProvider>
      </MapContext.Provider>
    </Provider>,
    { initialEntries: [`/${TAB_KEYS.PATROLS}`] }
  );

  test('lists the patrols of the feed', async () => {
    renderPatrolsFeed();

    const patrolList = await screen.findByRole('list', { name: 'Patrol list' });

    expect(within(patrolList).getAllByRole('listitem')).toHaveLength(2);
  });

  test('orders the patrols by their state', async () => {
    renderPatrolsFeed();

    const patrolList = await screen.findByRole('list', { name: 'Patrol list' });
    const [firstPatrol, secondPatrol] = within(patrolList).getAllByRole('listitem');

    expect(within(firstPatrol).getByRole('link')).toHaveAccessibleName(activePatrol.title);
    expect(within(secondPatrol).getByRole('link')).toHaveAccessibleName(scheduledPatrol.title);
  });

  test('shows an empty state when no patrol matches the filters', async () => {
    store.data.patrolsFeed = [];
    store.data.patrolStore = {};

    renderPatrolsFeed();

    expect(await screen.findByText('No patrols to display.')).toBeVisible();
  });

  test('summarizes how many patrols it is listing', async () => {
    renderPatrolsFeed();

    expect(await screen.findByText(/2 results from/)).toBeVisible();
  });

  test('keeps at most one row menu open at a time', async () => {
    renderPatrolsFeed();

    await screen.findByRole('list', { name: 'Patrol list' });

    const [firstMenuToggle, secondMenuToggle] = screen.getAllByRole('button', { name: 'More options' });

    await userEvent.click(firstMenuToggle);

    expect(firstMenuToggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(secondMenuToggle);

    expect(firstMenuToggle).toHaveAttribute('aria-expanded', 'false');
    expect(secondMenuToggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('lets the user tab from the filters into the patrol list', async () => {
    renderPatrolsFeed();

    await screen.findByRole('list', { name: 'Patrol list' });

    await userEvent.click(screen.getByRole('searchbox', { name: 'Search Patrols...' }));
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();

    expect(screen.getByRole('link', { name: activePatrol.title })).toHaveFocus();
    expect(screen.getByRole('link', { name: activePatrol.title }))
      .toHaveAttribute('href', `/${TAB_KEYS.PATROLS}/${activePatrol.id}`);
  });
});
