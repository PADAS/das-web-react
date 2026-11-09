import { act } from 'react';
import { Provider } from 'react-redux';

import { activePatrol } from '../../__test-helpers/fixtures/patrols';
import { fetchNextPatrolsFeedPage } from '../../ducks/patrols';
import {
  INITIAL_STATE as INITIAL_FEED_TABLE_SORT_STATE,
  setFeedTableClientSort,
  START_FEED_TABLE_FULL_LOAD,
} from '../../ducks/feed-table-sort';
import { governingPatrolSegment, iconIdForPatrolSegment } from '../../utils/patrols';
import { mockStore } from '../../__test-helpers/MockStore';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { render, screen } from '../../test-utils';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import useNavigate from '../../hooks/useNavigate';

import PatrolsTable from './';

const mockGridProps = [];

jest.mock('ag-grid-react', () => ({
  AgGridReact: function AgGridReactStub(props) {
    mockGridProps.push(props);

    return <div data-testid="grid" />;
  },
}));

jest.mock('../../ducks/patrols', () => ({
  ...jest.requireActual('../../ducks/patrols'),
  fetchNextPatrolsFeedPage: jest.fn(),
}));
jest.mock('../../hooks/useJumpToLocation', () => jest.fn());
jest.mock('../../hooks/useNavigate', () => jest.fn());

const lastGridProps = () => mockGridProps[mockGridProps.length - 1];
const columnById = (colId) => lastGridProps().columnDefs.find((column) => column.colId === colId);

describe('FeedTable - PatrolsTable', () => {
  let navigate, resolveNextPage, state, store;

  beforeEach(() => {
    mockGridProps.length = 0;
    document.body.innerHTML = '';
    window.localStorage.clear();

    navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useJumpToLocation.mockReturnValue(jest.fn());
    fetchNextPatrolsFeedPage.mockImplementation(() => () => new Promise((resolve) => {
      resolveNextPage = resolve;
    }));

    state = {
      data: {
        patrolsFeed: { count: 1, next: null, results: [activePatrol.id] },
        patrolStore: { [activePatrol.id]: activePatrol },
        patrolTypes,
        tracks: {},
      },
      view: {
        feedTableSort: INITIAL_FEED_TABLE_SORT_STATE,
        patrolTrackState: { pinned: [], visible: [] },
        timeSliderState: { active: false },
      },
    };
  });

  const renderPatrolsTable = (patrols = [activePatrol]) => {
    const toolbarContainer = document.createElement('div');
    document.body.appendChild(toolbarContainer);

    store = mockStore(state);

    return render(
      <Provider store={store}>
        <PatrolsTable loading={false} patrols={patrols} toolbarContainer={toolbarContainer} />
      </Provider>
    );
  };

  test('loads the next page when scrolled near the end, one page at a time', async () => {
    state.data.patrolsFeed = { count: 400, next: 'page-2', results: [activePatrol.id] };
    renderPatrolsTable();

    act(() => {
      lastGridProps().onBodyScroll({
        api: { getDisplayedRowCount: () => 1, getLastDisplayedRowIndex: () => 0 },
        direction: 'vertical',
      });
      lastGridProps().onBodyScroll({
        api: { getDisplayedRowCount: () => 1, getLastDisplayedRowIndex: () => 0 },
        direction: 'vertical',
      });
    });

    expect(fetchNextPatrolsFeedPage).toHaveBeenCalledTimes(1);
    expect(fetchNextPatrolsFeedPage).toHaveBeenCalledWith('page-2');

    await act(async () => resolveNextPage());
  });

  test('does not load more once every page is loaded', () => {
    renderPatrolsTable();

    act(() => lastGridProps().onBodyScroll({
      api: { getDisplayedRowCount: () => 1, getLastDisplayedRowIndex: () => 0 },
      direction: 'vertical',
    }));

    expect(fetchNextPatrolsFeedPage).not.toHaveBeenCalled();
  });

  test('says how many of the patrols are loaded while some are not', () => {
    state.data.patrolsFeed = { count: 400, next: 'page-2', results: [activePatrol.id] };
    renderPatrolsTable();

    expect(screen.getByText('Showing 1 of 400 patrols')).toHaveAttribute('role', 'status');
  });

  test('says nothing about loading once every patrol is loaded', () => {
    renderPatrolsTable();

    expect(screen.queryByText(/Showing/)).toBeNull();
  });

  const sortInTable = (colId) => {
    state.view.feedTableSort = {
      ...INITIAL_FEED_TABLE_SORT_STATE,
      patrols: { ...INITIAL_FEED_TABLE_SORT_STATE.patrols, clientSort: { colId, sort: 'asc' } },
    };
  };

  test('keeps the sort of the table, so it outlasts an open patrol', () => {
    renderPatrolsTable();

    act(() => lastGridProps().onSortChanged({
      api: { getColumnState: () => [{ colId: 'title', sort: 'asc' }] },
      source: 'uiColumnSorted',
    }));

    expect(store.getActions()).toContainEqual(setFeedTableClientSort('patrols', { colId: 'title', sort: 'asc' }));
  });

  test('shows the sort it keeps', () => {
    sortInTable('title');
    renderPatrolsTable();

    expect(columnById('title').sort).toBe('asc');
    expect(columnById('state').sort).toBeNull();
  });

  test('loads every patrol of the filter behind a sort, in cursor pages', () => {
    state.data.patrolsFeed = { count: 400, next: 'page-2', results: [activePatrol.id] };
    sortInTable('title');
    renderPatrolsTable();

    const url = new URL(store.getActions().find((action) => action.type === START_FEED_TABLE_FULL_LOAD).payload.url);

    expect(url.searchParams.get('use_cursor')).toBe('true');
    expect(url.searchParams.get('include_pauses')).toBe('true');
  });

  test('does not page the feed on scroll behind a sort', () => {
    state.data.patrolsFeed = { count: 400, next: 'page-2', results: [activePatrol.id] };
    sortInTable('title');
    renderPatrolsTable();

    act(() => lastGridProps().onBodyScroll({
      api: { getDisplayedRowCount: () => 1, getLastDisplayedRowIndex: () => 0 },
      direction: 'vertical',
    }));

    expect(fetchNextPatrolsFeedPage).not.toHaveBeenCalled();
  });

  test('offers no row selection, as patrols have no bulk actions', () => {
    renderPatrolsTable();

    expect(lastGridProps().rowSelection).toBeUndefined();
  });

  test('takes the type and leader from the leg the patrol is on, not a later one', () => {
    const now = Date.now();
    const twoLegPatrol = {
      ...activePatrol,
      patrol_segments: [
        {
          ...activePatrol.patrol_segments[0],
          id: 'current-leg',
          leader: { name: 'Current leader' },
          time_range: { end_time: null, start_time: new Date(now - 3600000).toISOString() },
        },
        {
          ...activePatrol.patrol_segments[0],
          id: 'next-leg',
          leader: { name: 'Next leader' },
          scheduled_start: new Date(now + 3600000).toISOString(),
          time_range: { end_time: null, start_time: new Date(now + 3600000).toISOString() },
        },
      ],
    };
    renderPatrolsTable([twoLegPatrol]);

    expect(columnById('leader').valueGetter({ data: twoLegPatrol })).toBe('Current leader');
  });

  test('shows the icon of the leg the patrol is on', () => {
    renderPatrolsTable();

    expect(lastGridProps().columnDefs[0].colId).toBe('icon');
    expect(columnById('icon').valueGetter({ data: activePatrol })).toBe(
      iconIdForPatrolSegment(patrolTypes, governingPatrolSegment(activePatrol))
    );
  });

  test('opens the patrol when its row is clicked', () => {
    renderPatrolsTable();

    act(() => lastGridProps().onCellClicked({
      column: { getColId: () => 'title' },
      data: activePatrol,
      event: { target: document.body },
    }));

    expect(navigate).toHaveBeenCalledWith(`/patrols/${activePatrol.id}`);
  });
});
