import { act } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../constants';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';
import { report } from '../__test-helpers/fixtures/reports';
import { setEventState } from '../ducks/events';
import { updateEventFilter } from '../ducks/event-filter';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useNavigate from '../hooks/useNavigate';

import EventsTable from './EventsTable';

const mockGridProps = [];
const mockGridApi = { deselectAll: jest.fn(), exportDataAsCsv: jest.fn() };

jest.mock('ag-grid-react', () => ({
  AgGridReact: function AgGridReactStub(props) {
    mockGridProps.push(props);

    return <div data-testid="grid" />;
  },
}));

jest.mock('../ducks/event-filter', () => ({
  ...jest.requireActual('../ducks/event-filter'),
  updateEventFilter: jest.fn(),
}));

jest.mock('../ducks/events', () => ({
  ...jest.requireActual('../ducks/events'),
  setEventState: jest.fn(),
}));

jest.mock('../hooks/useJumpToLocation', () => jest.fn());
jest.mock('../hooks/useNavigate', () => jest.fn());
jest.mock('../utils/toast', () => ({ showToast: jest.fn() }));

const lastGridProps = () => mockGridProps[mockGridProps.length - 1];
const columnById = (colId) => lastGridProps().columnDefs.find((column) => column.colId === colId);

describe('EventsTable', () => {
  let eventsFeed, jumpToLocation, navigate, state;

  beforeEach(() => {
    mockGridProps.length = 0;
    window.localStorage.clear();

    jumpToLocation = jest.fn();
    useJumpToLocation.mockReturnValue(jumpToLocation);
    navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    updateEventFilter.mockImplementation(() => () => {});
    setEventState.mockImplementation(() => () => Promise.resolve());

    eventsFeed = {
      events: { next: null, results: [report] },
      loadFeedEvents: jest.fn(),
      loadingEventFeed: false,
    };
    state = { data: { eventFilter: INITIAL_FILTER_STATE, eventTypes: [], feedEvents: { results: [report] } }, view: {} };
  });

  const renderEventsTable = (events = [report]) => render(
    <Provider store={mockStore(state)}>
      <EventsTable events={events} eventsFeed={eventsFeed} />
    </Provider>
  );

  test('sorts only the columns the events API orders by, with the feed sort', () => {
    renderEventsTable();

    expect(columnById(DEFAULT_EVENT_SORT[1].value)).toMatchObject({ sort: 'desc', sortable: true });
    expect(columnById('event_time')).toMatchObject({ sort: null, sortable: true });
    expect(columnById('title').sortable).toBeUndefined();
    expect(columnById('priority').sortable).toBeUndefined();
  });

  test('sorts the feed when a column header is sorted', () => {
    renderEventsTable();

    lastGridProps().onSortChanged({
      api: { getColumnState: () => [{ colId: 'title' }, { colId: 'event_time', sort: 'asc' }] },
      source: 'uiColumnSorted',
    });

    expect(updateEventFilter).toHaveBeenCalledWith({
      filter: { sort: [SORT_DIRECTION.up, EVENT_SORT_OPTIONS.find((option) => option.value === 'event_time')] },
    });
  });

  test('ignores sort changes the grid makes on its own', () => {
    renderEventsTable();

    lastGridProps().onSortChanged({
      api: { getColumnState: () => [{ colId: 'event_time', sort: 'asc' }] },
      source: 'gridOptionsUpdated',
    });

    expect(updateEventFilter).not.toHaveBeenCalled();
  });

  test('opens the event and moves the map to it when a row is clicked', () => {
    renderEventsTable();

    lastGridProps().onCellClicked({ column: { getColId: () => 'title' }, data: report });

    expect(navigate).toHaveBeenCalledWith(`/events/${report.id}`);
    expect(jumpToLocation).toHaveBeenCalledWith(report.geojson.geometry.coordinates);
  });

  test('does not open the event when its checkbox is clicked', () => {
    renderEventsTable();

    lastGridProps().onCellClicked({ column: { getColId: () => 'ag-Grid-SelectionColumn' }, data: report });

    expect(navigate).not.toHaveBeenCalled();
  });

  test('adds a column per event detail when filtered to one event type', () => {
    state.data.eventFilter = {
      ...INITIAL_FILTER_STATE,
      filter: { ...INITIAL_FILTER_STATE.filter, event_type: ['type-id'] },
    };

    renderEventsTable([{ ...report, event_details: { animal_count: 3, species: { name: 'Elephant' } } }]);

    expect(columnById('event_details.animal_count').headerName).toBe('Animal Count');
    expect(columnById('event_details.species').valueGetter({
      data: { event_details: { species: { name: 'Elephant' } } },
    })).toBe('Elephant');
  });

  test('has no event detail columns across event types', () => {
    renderEventsTable([{ ...report, event_details: { animal_count: 3 } }]);

    expect(columnById('event_details.animal_count')).toBeUndefined();
  });

  test('hides the created and location columns by default and remembers column choices', async () => {
    renderEventsTable();

    expect(columnById('created_at').hide).toBe(true);
    expect(columnById('location').hide).toBe(true);
    expect(columnById('title').hide).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Title' }));

    expect(columnById('title').hide).toBe(true);
    expect(JSON.parse(window.localStorage.getItem('feedTable.hiddenColumns.events'))).toEqual({ title: true });
  });

  test('resolves the selected events', async () => {
    renderEventsTable();

    act(() => {
      lastGridProps().onGridReady({ api: mockGridApi });
      lastGridProps().onSelectionChanged({ api: { getSelectedRows: () => [report] } });
    });

    expect(screen.getByText('1 selected')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Resolve' }));

    expect(setEventState).toHaveBeenCalledWith(report.id, 'resolved');
    expect(mockGridApi.deselectAll).toHaveBeenCalled();
    expect(eventsFeed.loadFeedEvents).toHaveBeenCalledWith(true);
  });

  test('exports only the selected events when some are selected', async () => {
    renderEventsTable();

    act(() => {
      lastGridProps().onGridReady({ api: mockGridApi });
      lastGridProps().onSelectionChanged({ api: { getSelectedRows: () => [report] } });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Export selected' }));

    expect(mockGridApi.exportDataAsCsv).toHaveBeenCalledWith(expect.objectContaining({
      fileName: 'earthranger-events.csv',
      onlySelected: true,
    }));
  });
});
