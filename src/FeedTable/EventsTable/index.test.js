import { act } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import {
  DEFAULT_EVENT_SORT,
  EVENT_SORT_OPTIONS,
  PERMISSION_KEYS,
  PERMISSIONS,
  SORT_DIRECTION,
  SYSTEM_CONFIG_FLAGS,
} from '../../constants';
import { INITIAL_FILTER_STATE } from '../../ducks/event-filter';
import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen, within } from '../../test-utils';
import { report } from '../../__test-helpers/fixtures/reports';
import { snareSchemaV2 } from '../../__test-helpers/fixtures/event-schemas';
import { calcEventFilterForRequest } from '../../utils/event-filter';
import { downloadFileFromUrl } from '../../utils/download';
import { GPS_FORMATS } from '../../utils/location';
import { fetchEventTypeSchema } from '../../ducks/event-schemas';
import {
  addEventToIncident,
  addEventToPatrol,
  createEvent,
  fetchNextEventFeedPage,
  setEventState,
} from '../../ducks/events';
import {
  INITIAL_STATE as INITIAL_FEED_TABLE_SORT_STATE,
  setFeedTableClientSort,
  START_FEED_TABLE_FULL_LOAD,
} from '../../ducks/feed-table-sort';
import { updateEventFilter } from '../../ducks/event-filter';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import useNavigate from '../../hooks/useNavigate';
import { showToast } from '../../utils/toast';

import EventsTable, { FULL_LOAD_PAGE_SIZE } from './';

const mockGridProps = [];
const mockGridApi = {
  deselectAll: jest.fn(),
  getAllDisplayedColumns: () => [],
  getDisplayedRowCount: () => 0,
  getFocusedCell: () => null,
  setGridAriaProperty: jest.fn(),
};

jest.mock('ag-grid-react', () => ({
  AgGridReact: function AgGridReactStub(props) {
    mockGridProps.push(props);

    return <div data-testid="grid" />;
  },
}));

const mockLinkModalProps = [];
jest.mock('../../LinkEventModal', () => function LinkEventModalStub(props) {
  mockLinkModalProps.push(props);

  return props.show ? <div data-testid="linkEventModal">{props.event.title}</div> : null;
});

jest.mock('../../ducks/event-filter', () => ({
  ...jest.requireActual('../../ducks/event-filter'),
  updateEventFilter: jest.fn(),
}));

jest.mock('../../ducks/event-schemas', () => ({
  ...jest.requireActual('../../ducks/event-schemas'),
  fetchEventTypeSchema: jest.fn(),
}));

jest.mock('../../ducks/events', () => ({
  ...jest.requireActual('../../ducks/events'),
  addEventToIncident: jest.fn(),
  addEventToPatrol: jest.fn(),
  createEvent: jest.fn(),
  fetchNextEventFeedPage: jest.fn(),
  setEventState: jest.fn(),
}));

jest.mock('../../utils/event-filter', () => ({
  ...jest.requireActual('../../utils/event-filter'),
  calcEventFilterForRequest: jest.fn(),
}));
jest.mock('../../utils/download', () => ({ downloadFileFromUrl: jest.fn() }));
jest.mock('../../hooks/useJumpToLocation', () => jest.fn());
jest.mock('../../hooks/useNavigate', () => jest.fn());
jest.mock('../../utils/toast', () => ({ showToast: jest.fn() }));

const lastGridProps = () => mockGridProps[mockGridProps.length - 1];
const columnById = (colId) => lastGridProps().columnDefs.find((column) => column.colId === colId);

const v1Schema = {
  schema: {
    properties: {
      animal_count: { title: 'Number of animals', type: 'number' },
      herd: { properties: { leader: { type: 'string' } }, title: 'Herd', type: 'object' },
      sighted_at: { format: 'date-time', title: 'Sighted at', type: 'string' },
      species: { enum: ['elephant', 'lion'], title: 'Species', type: 'string' },
    },
  },
  uiSchema: {
    'ui:groups': [{ items: ['species', 'animal_count', 'herd', 'sighted_at'] }],
    species: { 'ui:enumNames': ['Elephant', 'Lion'] },
  },
};

describe('EventsTable', () => {
  let eventsFeed, jumpToLocation, navigate, state, store;

  beforeEach(() => {
    mockGridProps.length = 0;
    document.body.innerHTML = '';
    window.localStorage.clear();

    jumpToLocation = jest.fn();
    useJumpToLocation.mockReturnValue(jumpToLocation);
    navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    updateEventFilter.mockImplementation(() => () => {});
    setEventState.mockImplementation(() => () => Promise.resolve());
    fetchEventTypeSchema.mockImplementation(() => () => {});
    addEventToIncident.mockImplementation(() => () => Promise.resolve());
    addEventToPatrol.mockImplementation(() => () => Promise.resolve());
    createEvent.mockImplementation(() => () => Promise.resolve({ data: { data: { id: 'new-incident' } } }));

    fetchNextEventFeedPage.mockImplementation(() => () => Promise.resolve());

    eventsFeed = {
      events: { next: null, results: [report] },
      feedRequest: { id: 1, params: { page_size: 50, sort_by: '-updated_at', state: ['active'] } },
      loadFeedEvents: jest.fn(),
      loadingEventFeed: false,
    };
    state = {
      data: {
        eventCategories: {},
        eventFilter: INITIAL_FILTER_STATE,
        eventSchemas: {},
        eventTypes: [
          { category: { value: 'security' }, value: report.event_type, version: 1 },
          { category: { value: 'security' }, is_collection: true, value: 'incident_collection', version: 1 },
        ],
        feedEvents: { results: [report] },
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ] } },
      },
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        feedTableSort: INITIAL_FEED_TABLE_SORT_STATE,
        systemConfig: { [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true },
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  const filterToOneEventType = (eventType) => {
    state.data.eventTypes = [eventType];
    state.data.eventFilter = {
      ...INITIAL_FILTER_STATE,
      filter: { ...INITIAL_FILTER_STATE.filter, event_type: [eventType.id] },
    };
  };

  const renderEventsTable = (events = [report]) => {
    const toolbarContainer = document.createElement('div');
    toolbarContainer.dataset.testid = 'toolbarContainer';
    document.body.appendChild(toolbarContainer);

    store = mockStore(state);

    return render(
      <Provider store={store}>
        <EventsTable events={events} eventsFeed={eventsFeed} toolbarContainer={toolbarContainer} />
      </Provider>
    );
  };

  test('names its grid Events', () => {
    renderEventsTable();

    act(() => lastGridProps().onGridReady({ api: mockGridApi }));

    expect(mockGridApi.setGridAriaProperty).toHaveBeenCalledWith('label', 'Events');
  });

  test('puts its controls in the spot the feed keeps for them', () => {
    renderEventsTable();

    expect(within(screen.getByTestId('toolbarContainer')).getByRole('button', { name: 'Export all fields (CSV)' })).toBeVisible();
  });

  test('shows the feed sort on the columns the events API orders by', () => {
    renderEventsTable();

    expect(columnById(DEFAULT_EVENT_SORT[1].value)).toMatchObject({ sort: 'desc', sortable: true });
    expect(columnById('event_time')).toMatchObject({ sort: null, sortable: true });
    expect(columnById('title')).toMatchObject({ sort: null, sortable: true });
  });

  const sortInTable = (colId, feedSort = INITIAL_FILTER_STATE.filter.sort) => {
    state.view.feedTableSort = {
      ...INITIAL_FEED_TABLE_SORT_STATE,
      events: { ...INITIAL_FEED_TABLE_SORT_STATE.events, clientSort: { colId, feedSort, sort: 'desc' } },
    };
  };

  test('keeps a sort the events API cannot make for the table, apart from the feed sort', () => {
    renderEventsTable();

    act(() => lastGridProps().onSortChanged({
      api: { getColumnState: () => [{ colId: 'priority', sort: 'desc' }] },
      source: 'uiColumnSorted',
    }));

    expect(updateEventFilter).not.toHaveBeenCalled();
    expect(store.getActions()).toContainEqual(setFeedTableClientSort(
      'events',
      { colId: 'priority', feedSort: INITIAL_FILTER_STATE.filter.sort, sort: 'desc' }
    ));
  });

  test('shows the table sort it keeps instead of the feed sort, such as after an event was open', () => {
    sortInTable('priority');
    renderEventsTable();

    expect(columnById('priority').sort).toBe('desc');
    expect(columnById(DEFAULT_EVENT_SORT[1].value).sort).toBeNull();
  });

  test('shows the feed sort again once the feed is sorted another way', () => {
    sortInTable('priority', [SORT_DIRECTION.up, EVENT_SORT_OPTIONS[0]]);
    renderEventsTable();

    expect(columnById('priority').sort).toBeNull();
    expect(columnById(DEFAULT_EVENT_SORT[1].value).sort).toBe('desc');
  });

  test('goes back to the feed sort when the table sort is cleared', () => {
    sortInTable('priority');
    renderEventsTable();

    act(() => lastGridProps().onSortChanged({ api: { getColumnState: () => [{ colId: 'priority' }] }, source: 'uiColumnSorted' }));

    expect(store.getActions()).toContainEqual(setFeedTableClientSort('events', null));
  });

  const startedFullLoad = () => store.getActions().find((action) => action.type === START_FEED_TABLE_FULL_LOAD);

  test('loads every event of the feed filter behind a table sort, in large cursor pages', () => {
    eventsFeed.events.next = 'https://das/events?page=2';
    sortInTable('priority');
    renderEventsTable();

    const url = new URL(startedFullLoad().payload.url);

    expect(url.searchParams.get('use_cursor')).toBe('true');
    expect(url.searchParams.get('page_size')).toBe(`${FULL_LOAD_PAGE_SIZE}`);
    expect(url.searchParams.get('state')).toBe('active');
    expect(url.searchParams.has('sort_by')).toBe(false);
    expect(startedFullLoad().payload.key).toBe(`1 ${startedFullLoad().payload.url}`);
  });

  test('loads nothing behind the feed sort', () => {
    eventsFeed.events.next = 'https://das/events?page=2';
    renderEventsTable();

    expect(startedFullLoad()).toBeUndefined();
  });

  test('lists the events loaded behind a table sort with the feed events', () => {
    eventsFeed.events.next = 'https://das/events?page=2';
    sortInTable('priority');
    renderEventsTable();
    const { url } = startedFullLoad().payload;

    state.data.eventStore = { 'other-event': { id: 'other-event' } };
    state.view.feedTableSort = {
      ...state.view.feedTableSort,
      events: {
        ...state.view.feedTableSort.events,
        fullLoad: { ids: ['other-event'], key: `1 ${url}`, loadingIds: [], next: null, url },
      },
    };
    renderEventsTable();

    expect(lastGridProps().rowData.map((event) => event.id)).toEqual([report.id, 'other-event']);
  });

  const scrollToEnd = () => act(() => lastGridProps().onBodyScroll({
    api: { getDisplayedRowCount: () => 1, getLastDisplayedRowIndex: () => 0 },
    direction: 'vertical',
  }));

  test('loads the next page once when scrolled again while it loads', () => {
    eventsFeed.events.next = 'https://das/events?page=2';
    fetchNextEventFeedPage.mockImplementation(() => () => new Promise(() => {}));
    renderEventsTable();

    scrollToEnd();
    scrollToEnd();

    expect(fetchNextEventFeedPage).toHaveBeenCalledTimes(1);
  });

  test('loads a page again when a refreshed feed asks for one it loaded before', async () => {
    eventsFeed.events.next = 'https://das/events?page=2';
    renderEventsTable();

    scrollToEnd();
    await act(async () => {});
    scrollToEnd();

    expect(fetchNextEventFeedPage).toHaveBeenCalledTimes(2);
  });

  test('does not page the feed on scroll behind a table sort', () => {
    eventsFeed.events.next = 'https://das/events?page=2';
    sortInTable('priority');
    renderEventsTable();

    scrollToEnd();

    expect(fetchNextEventFeedPage).not.toHaveBeenCalled();
  });

  const rerenderWithNewEvents = (rerender) => rerender(<Provider store={store}>
    <EventsTable events={[{ ...report }]} eventsFeed={eventsFeed} toolbarContainer={document.createElement('div')} />
  </Provider>);

  test('keeps its column definitions when the loaded events change', () => {
    const { rerender } = renderEventsTable();
    const { columnDefs } = lastGridProps();

    rerenderWithNewEvents(rerender);

    expect(lastGridProps().columnDefs).toBe(columnDefs);
  });

  test('keeps the columns of an event type with a schema when the loaded events change', () => {
    filterToOneEventType({ id: 'type-id', value: 'snare', version: 2 });
    state.data.eventSchemas = { snare: { base: snareSchemaV2 } };
    const { rerender } = renderEventsTable();
    const { columnDefs } = lastGridProps();

    rerenderWithNewEvents(rerender);

    expect(lastGridProps().columnDefs).toBe(columnDefs);
  });

  test('shows the event icon in the title column, with no icon column of its own', () => {
    renderEventsTable();

    expect(columnById('icon')).toBeUndefined();
    expect(columnById('title').cellRendererParams.renderIcon(report).props.report).toBe(report);
  });

  test('orders the columns title, ID, type, reporter, updated and event time first', () => {
    renderEventsTable();

    expect(lastGridProps().columnDefs.slice(0, 6).map((column) => column.colId))
      .toEqual(['title', 'serial_number', 'event_type', 'reported_by', 'updated_at', 'event_time']);
  });

  test('ignores column choices saved before the default columns changed', () => {
    window.localStorage.setItem('feedTable.hiddenColumns.events', JSON.stringify({ priority: false, state: false }));
    renderEventsTable();

    expect(columnById('state').hide).toBe(true);
    expect(columnById('priority').hide).toBe(true);
  });

  test('hides the state and priority columns until they are shown', () => {
    renderEventsTable();

    expect(columnById('state').hide).toBe(true);
    expect(columnById('priority').hide).toBe(true);
    expect(columnById('title').hide).toBe(false);
  });

  test('names priorities the way the rest of the app does', () => {
    renderEventsTable();

    const { valueFormatter } = columnById('priority');

    expect([300, 200, 100, 0].map((value) => valueFormatter({ value }))).toEqual(['Red', 'Amber', 'Green', 'None']);
  });

  test('heads the serial number column ID', () => {
    renderEventsTable();

    expect(columnById('serial_number').headerName).toBe('ID');
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

  test('does not open the event when a control inside a cell is clicked', () => {
    renderEventsTable();

    const button = document.createElement('button');
    lastGridProps().onCellClicked({ column: { getColId: () => 'event_details.herd' }, data: report, event: { target: button } });

    expect(navigate).not.toHaveBeenCalled();
  });

  test('does not open the event when its checkbox is clicked', () => {
    renderEventsTable();

    const checkbox = document.createElement('input');
    lastGridProps().onCellClicked({ column: { getColId: () => 'title' }, data: report, event: { target: checkbox } });

    expect(navigate).not.toHaveBeenCalled();
  });

  test('asks for the event type schema when filtered to one event type', () => {
    filterToOneEventType({ id: 'type-id', value: 'wildlife', version: 1 });

    renderEventsTable();

    expect(fetchEventTypeSchema).toHaveBeenCalledWith('wildlife');
  });

  test('adds a column per field of a v1 event type schema, empty or not', () => {
    filterToOneEventType({ id: 'type-id', value: 'wildlife', version: 1 });
    state.data.eventSchemas = { wildlife: { base: v1Schema } };

    renderEventsTable([{ ...report, event_details: { species: 'lion' } }]);

    expect(fetchEventTypeSchema).not.toHaveBeenCalled();
    expect(lastGridProps().columnDefs.filter((column) => column.colId.startsWith('event_details.'))
      .map((column) => column.headerName)).toEqual(['Species', 'Number of animals', 'Herd', 'Sighted at']);
    expect(columnById('event_details.species').valueGetter({ data: { event_details: { species: 'lion' } } }))
      .toBe('Lion');
    expect(columnById('event_details.animal_count').valueGetter({ data: { event_details: {} } })).toBe('');
  });

  test('opens an object field in a read-only view', async () => {
    filterToOneEventType({ id: 'type-id', value: 'wildlife', version: 1 });
    state.data.eventSchemas = { wildlife: { base: v1Schema } };
    renderEventsTable();

    const { cellRenderer: HerdCell, headerName } = columnById('event_details.herd');
    const herd = { leader: 'Matriarch' };
    render(<Provider store={store}><HerdCell colDef={{ headerName }} value={herd} /></Provider>);

    await userEvent.click(screen.getByRole('button', { name: 'View' }));

    expect(store.getActions()).toContainEqual(expect.objectContaining({
      payload: expect.objectContaining({ title: 'Herd', value: herd }),
      type: 'ADD_MODAL',
    }));
  });

  test('opens a v2 collection in the form\'s read-only collection view', async () => {
    const collectionSchemaV2 = {
      json: {
        properties: { sightings: { items: { properties: {}, type: 'object' }, title: 'Sightings', type: 'array' } },
        required: [],
      },
      ui: {
        fields: {
          sightings: {
            buttonText: '',
            columns: 1,
            conditionalDependents: [],
            itemIdentifier: '',
            itemName: 'Sighting',
            leftColumn: [],
            parent: 'section-1',
            rightColumn: [],
            type: 'COLLECTION',
          },
        },
        headers: {},
        order: ['section-1'],
        sections: {
          'section-1': {
            columns: 1,
            conditions: [],
            isActive: true,
            label: '',
            leftColumn: [{ name: 'sightings', type: 'field' }],
            rightColumn: [],
          },
        },
      },
    };
    filterToOneEventType({ id: 'type-id', value: 'sighting', version: 2 });
    state.data.eventSchemas = { sighting: { base: collectionSchemaV2 } };
    renderEventsTable();

    const { cellRenderer: SightingsCell, cellRendererParams, headerName } = columnById('event_details.sightings');
    const sightings = [{ note: 'By the river' }];
    render(<Provider store={store}>
      <SightingsCell colDef={{ headerName }} value={sightings} {...cellRendererParams} />
    </Provider>);

    await userEvent.click(screen.getByRole('button', { name: '1 item' }));

    expect(openedModal()).toEqual(expect.objectContaining({
      fieldName: 'sightings',
      schema: collectionSchemaV2,
      title: 'Sightings',
      value: sightings,
    }));
  });

  test('adds a column per field of a v2 event type schema', () => {
    filterToOneEventType({ id: 'type-id', value: 'snare', version: 2 });
    state.data.eventSchemas = { snare: { base: snareSchemaV2 } };

    renderEventsTable();

    const column = columnById('event_details.number_of_snares_found');
    expect(column.headerName).toBe('Number of Snares Found');
    expect(column.valueGetter({ data: { event_details: { number_of_snares_found: 4 } } })).toBe('4');
  });

  test('falls back to the loaded event details without a schema', () => {
    filterToOneEventType({ id: 'type-id', value: 'wildlife', version: 1 });
    state.data.eventSchemas = { wildlife: { base: { error: new Error('Not found') } } };

    renderEventsTable([{ ...report, event_details: { animal_count: 3, species: { name: 'Elephant', value: 'elephant' } } }]);

    expect(columnById('event_details.animal_count').headerName).toBe('Animal Count');
    expect(columnById('event_details.species').valueGetter({
      data: { event_details: { species: { name: 'Elephant', value: 'elephant' } } },
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
    expect(columnById('reported_by').hide).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.queryByRole('menuitemcheckbox', { name: 'Title' })).toBeNull();

    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Reported by' }));

    expect(columnById('reported_by').hide).toBe(true);
    expect(JSON.parse(window.localStorage.getItem('feedTable.v2.hiddenColumns.events'))).toEqual({ reported_by: true });
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

  const selectEvents = (selectedEvents) => act(() => {
    lastGridProps().onGridReady({ api: mockGridApi });
    lastGridProps().onSelectionChanged({ api: { getSelectedRows: () => selectedEvents } });
  });

  const linkModal = () => mockLinkModalProps[mockLinkModalProps.length - 1];
  const openedModal = () => store.getActions().find((action) => action.type === 'ADD_MODAL').payload;

  test('resolves an incident with the events it contains, once each', async () => {
    const contained = { ...report, id: 'contained' };
    const incident = {
      ...report,
      contains: [{ related_event: contained }],
      event_type: 'incident_collection',
      id: 'incident',
      is_collection: true,
    };
    renderEventsTable([incident, contained]);
    selectEvents([incident, contained]);

    await userEvent.click(screen.getByRole('button', { name: 'Resolve' }));

    expect(setEventState).toHaveBeenCalledTimes(2);
    expect(setEventState).toHaveBeenCalledWith('incident', 'resolved');
    expect(setEventState).toHaveBeenCalledWith('contained', 'resolved');
    expect(showToast).toHaveBeenCalledWith({ message: '2 events updated', toastConfig: { type: 'success' } });
  });

  test('sends at most five updates at a time', async () => {
    const pending = [];
    setEventState.mockImplementation(() => () => new Promise((resolve) => pending.push(resolve)));
    const selectedEvents = Array.from({ length: 7 }, (_, index) => ({ ...report, id: `event-${index}` }));
    renderEventsTable(selectedEvents);
    selectEvents(selectedEvents);

    await userEvent.click(screen.getByRole('button', { name: 'Resolve' }));

    expect(setEventState).toHaveBeenCalledTimes(5);

    await act(async () => pending.splice(0).forEach((resolve) => resolve()));

    expect(setEventState).toHaveBeenCalledTimes(7);
  });

  test('offers only the bulk actions the user may take', () => {
    state.data.eventTypes[0].category = { flag: 'user', permissions: ['read'], value: 'security' };
    state.view.systemConfig = {};
    renderEventsTable();
    selectEvents([report]);

    expect(screen.queryByRole('button', { name: 'Resolve' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reopen' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add to Patrol' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add to Incident' })).toBeNull();
  });

  test('offers a new incident only to a user who may create one', async () => {
    state.data.eventTypes[1].category = { flag: 'user', permissions: ['read'], value: 'security' };
    renderEventsTable();
    selectEvents([report]);

    await userEvent.click(screen.getByRole('button', { name: 'Add to Incident' }));

    expect(linkModal().canCreateIncident).toBe(false);
  });

  test('adds the selected events to a patrol, except those already on one', async () => {
    const onPatrol = { ...report, id: 'on-patrol', patrols: ['other-patrol'] };
    renderEventsTable([report, onPatrol]);
    selectEvents([report, onPatrol]);

    await userEvent.click(screen.getByRole('button', { name: 'Add to Patrol' }));

    expect(screen.getByTestId('linkEventModal')).toHaveTextContent('2 selected');
    expect(linkModal().type).toBe('patrol');

    await act(() => linkModal().onAdd({ id: 'patrol' }));

    expect(addEventToPatrol).toHaveBeenCalledTimes(1);
    expect(addEventToPatrol).toHaveBeenCalledWith(report.id, 'patrol');
    expect(showToast).toHaveBeenCalledWith({ message: '1 event could not be updated' });
    expect(eventsFeed.loadFeedEvents).toHaveBeenCalledWith(true);
  });

  test('adds the selected events to a new incident', async () => {
    const second = { ...report, id: 'second' };
    renderEventsTable([report, second]);
    selectEvents([report, second]);

    await userEvent.click(screen.getByRole('button', { name: 'Add to Incident' }));
    await act(() => linkModal().onCreateIncident());

    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'incident_collection' }));
    expect(addEventToIncident).toHaveBeenCalledWith(report.id, 'new-incident');
    expect(addEventToIncident).toHaveBeenCalledWith('second', 'new-incident');
    expect(showToast).toHaveBeenCalledWith({ message: '2 events updated', toastConfig: { type: 'success' } });
  });

  test('does not offer an incident when none of the selected events can join one', () => {
    const inIncident = { ...report, is_contained_in: [{ related_event: { id: 'incident' } }] };
    renderEventsTable([inIncident]);
    selectEvents([inIncident]);

    expect(screen.queryByRole('button', { name: 'Add to Incident' })).toBeNull();
  });

  test('adds to a new incident only the selected events that can join one', async () => {
    const inIncident = { ...report, id: 'in-incident', is_contained_in: [{ related_event: { id: 'incident' } }] };
    renderEventsTable([report, inIncident]);
    selectEvents([report, inIncident]);

    await userEvent.click(screen.getByRole('button', { name: 'Add to Incident' }));
    await act(() => linkModal().onCreateIncident());

    expect(createEvent).toHaveBeenCalledTimes(1);
    expect(addEventToIncident).toHaveBeenCalledTimes(1);
    expect(addEventToIncident).toHaveBeenCalledWith(report.id, 'new-incident');
    expect(showToast).toHaveBeenCalledWith({ message: '1 event could not be updated' });
  });

  test('adds the selected events to an existing incident', async () => {
    renderEventsTable();
    selectEvents([report]);

    await userEvent.click(screen.getByRole('button', { name: 'Add to Incident' }));
    expect(linkModal().type).toBe('incident');
    await act(() => linkModal().onAdd({ id: 'incident' }));

    expect(createEvent).not.toHaveBeenCalled();
    expect(addEventToIncident).toHaveBeenCalledWith(report.id, 'incident');
  });

  test('exports through the events export API with the feed filter', async () => {
    calcEventFilterForRequest.mockReturnValue('state=active');
    downloadFileFromUrl.mockResolvedValue();
    renderEventsTable();

    await userEvent.click(screen.getByRole('button', { name: 'Export all fields (CSV)' }));

    expect(downloadFileFromUrl).toHaveBeenCalledWith(expect.stringMatching(/activity\/events\/export\?state=active$/), {});
  });

  test('exports in the order the table is sorted by', async () => {
    const serialSort = [SORT_DIRECTION.up, EVENT_SORT_OPTIONS.find((option) => option.value === 'serial_number')];
    state.data.eventFilter = { ...INITIAL_FILTER_STATE, filter: { ...INITIAL_FILTER_STATE.filter, sort: serialSort } };
    downloadFileFromUrl.mockResolvedValue();
    renderEventsTable();

    await userEvent.click(screen.getByRole('button', { name: 'Export all fields (CSV)' }));

    expect(calcEventFilterForRequest).toHaveBeenCalledWith({}, serialSort);
  });

  test('shows dates as plain text in the table date format', () => {
    renderEventsTable();

    expect(columnById('updated_at').valueFormatter({ value: '2026-03-04T05:06:00Z' })).toBe('04 Mar 26 05:06');
    expect(columnById('updated_at').valueFormatter({ value: '' })).toBe('');
  });
});
