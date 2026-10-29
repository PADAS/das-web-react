import { act } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../constants';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen, within } from '../test-utils';
import { report } from '../__test-helpers/fixtures/reports';
import { snareSchemaV2 } from '../__test-helpers/fixtures/event-schemas';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { downloadFileFromUrl } from '../utils/download';
import { GPS_FORMATS } from '../utils/location';
import { fetchEventTypeSchema } from '../ducks/event-schemas';
import { addEventToIncident, createEvent, setEventState } from '../ducks/events';
import { addPatrolSegmentToEvent } from '../utils/events';
import { updateEventFilter } from '../ducks/event-filter';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useNavigate from '../hooks/useNavigate';
import { showToast } from '../utils/toast';

import EventsTable from './EventsTable';

const mockGridProps = [];
const mockGridApi = { deselectAll: jest.fn() };

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

jest.mock('../ducks/event-schemas', () => ({
  ...jest.requireActual('../ducks/event-schemas'),
  fetchEventTypeSchema: jest.fn(),
}));

jest.mock('../ducks/events', () => ({
  ...jest.requireActual('../ducks/events'),
  addEventToIncident: jest.fn(),
  createEvent: jest.fn(),
  setEventState: jest.fn(),
}));

jest.mock('../utils/events', () => ({
  ...jest.requireActual('../utils/events'),
  addPatrolSegmentToEvent: jest.fn(),
}));

jest.mock('../utils/event-filter', () => ({
  ...jest.requireActual('../utils/event-filter'),
  calcEventFilterForRequest: jest.fn(),
}));
jest.mock('../utils/download', () => ({ downloadFileFromUrl: jest.fn() }));
jest.mock('../hooks/useJumpToLocation', () => jest.fn());
jest.mock('../hooks/useNavigate', () => jest.fn());
jest.mock('../utils/toast', () => ({ showToast: jest.fn() }));

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
    addPatrolSegmentToEvent.mockResolvedValue();
    createEvent.mockImplementation(() => () => Promise.resolve({ data: { data: { id: 'new-incident' } } }));

    eventsFeed = {
      events: { next: null, results: [report] },
      loadFeedEvents: jest.fn(),
      loadingEventFeed: false,
    };
    state = {
      data: {
        eventFilter: INITIAL_FILTER_STATE,
        eventSchemas: {},
        eventTypes: [],
        feedEvents: { results: [report] },
      },
      view: { coordinateReferenceSystems: { storedSystems: [] }, userPreferences: { gpsFormat: GPS_FORMATS.DEG } },
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

  test('puts its controls in the spot the feed keeps for them', () => {
    renderEventsTable();

    expect(within(screen.getByTestId('toolbarContainer')).getByRole('button', { name: 'Export CSV' })).toBeVisible();
  });

  test('sorts only the columns the events API orders by, with the feed sort', () => {
    renderEventsTable();

    expect(columnById(DEFAULT_EVENT_SORT[1].value)).toMatchObject({ sort: 'desc', sortable: true });
    expect(columnById('event_time')).toMatchObject({ sort: null, sortable: true });
    expect(columnById('title').sortable).toBeUndefined();
    expect(columnById('priority').sortable).toBeUndefined();
  });

  test('rebuilds its column definitions when the loaded events change, and the grid keeps a dragged order', () => {
    const { rerender } = renderEventsTable();
    const { columnDefs } = lastGridProps();

    rerender(<Provider store={store}>
      <EventsTable events={[{ ...report }]} eventsFeed={eventsFeed} toolbarContainer={document.createElement('div')} />
    </Provider>);

    expect(lastGridProps().columnDefs).not.toBe(columnDefs);
    expect(lastGridProps().maintainColumnOrder).toBe(true);
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

    lastGridProps().onCellClicked({ column: { getColId: () => 'ag-Grid-SelectionColumn' }, data: report });

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

  const selectEvents = (selectedEvents) => act(() => {
    lastGridProps().onGridReady({ api: mockGridApi });
    lastGridProps().onSelectionChanged({ api: { getSelectedRows: () => selectedEvents } });
  });

  const openedModal = () => store.getActions().find((action) => action.type === 'ADD_MODAL').payload;

  test('adds the selected events to a patrol, except those already on one', async () => {
    const onPatrol = { ...report, id: 'on-patrol', patrol_segments: [{ id: 'other-segment' }] };
    renderEventsTable([report, onPatrol]);
    selectEvents([report, onPatrol]);

    await userEvent.click(screen.getByRole('button', { name: 'Add to Patrol' }));
    await act(() => openedModal().onAddToPatrol({ id: 'patrol', patrol_segments: [{ id: 'segment' }] }));

    expect(addPatrolSegmentToEvent).toHaveBeenCalledTimes(1);
    expect(addPatrolSegmentToEvent).toHaveBeenCalledWith('segment', report.id);
    expect(showToast).toHaveBeenCalledWith({ message: '1 event could not be updated' });
    expect(eventsFeed.loadFeedEvents).toHaveBeenCalledWith(true);
  });

  test('adds the selected events to a new incident', async () => {
    const second = { ...report, id: 'second' };
    renderEventsTable([report, second]);
    selectEvents([report, second]);

    await userEvent.click(screen.getByRole('button', { name: 'Add to Incident' }));
    await act(() => openedModal().onAddToNewIncident());

    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'incident_collection' }));
    expect(addEventToIncident).toHaveBeenCalledWith(report.id, 'new-incident');
    expect(addEventToIncident).toHaveBeenCalledWith('second', 'new-incident');
    expect(showToast).toHaveBeenCalledWith({ message: '2 events updated', toastConfig: { type: 'success' } });
  });

  test('adds the selected events to an existing incident', async () => {
    renderEventsTable();
    selectEvents([report]);

    await userEvent.click(screen.getByRole('button', { name: 'Add to Incident' }));
    await act(() => openedModal().onAddToExistingIncident({ id: 'incident' }));

    expect(createEvent).not.toHaveBeenCalled();
    expect(addEventToIncident).toHaveBeenCalledWith(report.id, 'incident');
  });

  test('exports through the events export API with the feed filter', async () => {
    calcEventFilterForRequest.mockReturnValue('state=active');
    downloadFileFromUrl.mockResolvedValue();
    renderEventsTable();

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(downloadFileFromUrl).toHaveBeenCalledWith(expect.stringMatching(/activity\/events\/export\?state=active$/), {});
  });
});
