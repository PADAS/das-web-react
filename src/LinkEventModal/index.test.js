import { Provider } from 'react-redux';
import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { EVENT_LINK_TARGET_TYPES } from '../constants';
import { EVENTS_API_URL } from '../ducks/events';
import { mockStore } from '../__test-helpers/MockStore';
import { PATROLS_API_URL } from '../ducks/patrols';
import { render, screen, waitFor, within } from '../test-utils';

import LinkEventModal from './';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

describe('LinkEventModal', () => {
  const makePatrol = (id, serialNumber, segment, otherAttributes = {}) => ({
    id,
    patrol_segments: [{ id: `${id}-leg`, leader: null, patrol_type: 'foot', scheduled_start: null, ...segment }],
    serial_number: serialNumber,
    state: 'open',
    title: `Patrol ${serialNumber}`,
    ...otherAttributes,
  });

  const activePatrol = makePatrol('active-patrol', 101, { time_range: { end_time: null, start_time: '2020-01-01T08:00:00Z' } });
  const plannedCancelledPatrol = makePatrol(
    'planned-cancelled-patrol',
    102,
    { scheduled_start: '2020-01-01T08:00:00Z', time_range: { end_time: null, start_time: null } },
    { state: 'cancelled' }
  );
  const ranCancelledPatrol = makePatrol(
    'ran-cancelled-patrol',
    103,
    { time_range: { end_time: '2020-01-01T10:00:00Z', start_time: '2020-01-01T08:00:00Z' } },
    { state: 'cancelled' }
  );
  const incident = {
    contains: [{ related_event: { id: 'a' } }, { related_event: { id: 'b' } }],
    event_type: 'incident_collection',
    id: 'incident-id',
    is_collection: true,
    serial_number: 201,
    title: 'Poaching ring',
    updated_at: '2020-01-01T08:00:00Z',
  };

  let event;
  let onAdd;
  let onCreateIncident;
  let onHide;
  let patrolRequests;
  let incidentRequests;
  let store;

  beforeEach(() => {
    event = { event_type: 'snare_rep', id: 'event-id', serial_number: 10, title: 'Snare found' };
    onAdd = jest.fn();
    onCreateIncident = jest.fn();
    onHide = jest.fn();
    patrolRequests = [];
    incidentRequests = [];
    store = mockStore({ data: { eventTypes: [], patrolTypes: [] }, view: {} });

    server.use(
      http.get(PATROLS_API_URL, ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        patrolRequests.push(searchParams);

        return HttpResponse.json({
          data: { count: 3, next: null, results: [activePatrol, plannedCancelledPatrol, ranCancelledPatrol] },
        });
      }),
      http.get(EVENTS_API_URL, ({ request }) => {
        incidentRequests.push(new URL(request.url).searchParams);

        return HttpResponse.json({ data: { count: 1, next: null, results: [incident] } });
      })
    );
  });

  const renderLinkEventModal = (props) => render(
    <Provider store={store}>
      <LinkEventModal
        event={event}
        onAdd={onAdd}
        onCreateIncident={onCreateIncident}
        onHide={onHide}
        show
        type={EVENT_LINK_TARGET_TYPES.PATROL}
        {...props}
      />
    </Provider>
  );

  test('names the event being linked', async () => {
    renderLinkEventModal();

    expect(await screen.findByRole('dialog', { name: 'Add to Patrol' })).toHaveTextContent('10Snare found');
  });

  test('lists the patrols that began, leaving out the cancelled ones that never ran', async () => {
    renderLinkEventModal();

    const list = await screen.findByRole('list', { name: 'Patrols' });

    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByRole('button', { name: 'Add to patrol 101 Patrol 101' })).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: 'Add to patrol 103 Patrol 103' })).toBeInTheDocument();
    expect(within(list).queryByRole('button', { name: 'Add to patrol 102 Patrol 102' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 patrols');
  });

  test('focuses the search box when it opens', async () => {
    renderLinkEventModal();

    await waitFor(() => expect(screen.getByRole('searchbox', { name: 'Search patrols' })).toHaveFocus());
  });

  test('searches once the user stops typing', async () => {
    renderLinkEventModal();

    await screen.findByRole('list', { name: 'Patrols' });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search patrols' }), 'boat');

    await waitFor(() => expect(patrolRequests.at(-1).get('filter')).toBe(JSON.stringify({ text: 'boat' })));
    expect(patrolRequests).toHaveLength(2);
  });

  test('adds the event to the patrol the user picks', async () => {
    renderLinkEventModal();

    await userEvent.click(await screen.findByRole('button', { name: 'Add to patrol 103 Patrol 103' }));

    expect(onAdd).toHaveBeenCalledWith(ranCancelledPatrol);
  });

  const renderLinkingLinkEventModal = (rerender, props) => rerender(<Provider store={store}>
    <LinkEventModal
      event={event}
      isLinking
      onAdd={onAdd}
      onCreateIncident={onCreateIncident}
      onHide={onHide}
      show
      type={EVENT_LINK_TARGET_TYPES.PATROL}
      {...props}
    />
  </Provider>);

  test('shows the link under way on the patrol picked and keeps the focus on it', async () => {
    const { rerender } = renderLinkEventModal();

    const addButton = await screen.findByRole('button', { name: 'Add to patrol 103 Patrol 103' });
    addButton.focus();
    await userEvent.keyboard('{Enter}');

    renderLinkingLinkEventModal(rerender);

    expect(addButton).toHaveAttribute('aria-busy', 'true');
    expect(addButton).toHaveAttribute('aria-disabled', 'true');
    expect(addButton).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Add to patrol 101 Patrol 101' })).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('button', { name: 'Add to patrol 101 Patrol 101' })).toHaveAttribute('aria-disabled', 'true');
  });

  test('ignores another patrol picked while a link is under way', async () => {
    const { rerender } = renderLinkEventModal();

    await userEvent.click(await screen.findByRole('button', { name: 'Add to patrol 103 Patrol 103' }));
    renderLinkingLinkEventModal(rerender);
    await userEvent.click(screen.getByRole('button', { name: 'Add to patrol 101 Patrol 101' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(ranCancelledPatrol);
  });

  test('ignores a new incident requested while a link is under way', async () => {
    const { rerender } = renderLinkEventModal({ canCreateIncident: true, type: EVENT_LINK_TARGET_TYPES.INCIDENT });

    renderLinkingLinkEventModal(rerender, { canCreateIncident: true, type: EVENT_LINK_TARGET_TYPES.INCIDENT });
    await userEvent.click(screen.getByRole('button', { name: 'Create new incident' }));

    expect(screen.getByRole('button', { name: 'Create new incident' })).toHaveAttribute('aria-disabled', 'true');
    expect(onCreateIncident).not.toHaveBeenCalled();
  });

  test('closes without linking when the user cancels', async () => {
    renderLinkEventModal();

    await screen.findByRole('list', { name: 'Patrols' });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onHide).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  test('closes from its close button', async () => {
    renderLinkEventModal();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onHide).toHaveBeenCalled();
  });

  test('wraps the focus around when the user tabs past its last or first control', async () => {
    renderLinkEventModal();

    await screen.findByRole('list', { name: 'Patrols' });
    screen.getByRole('button', { name: 'Cancel' }).focus();
    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

    await userEvent.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  test('says so when no patrol matches the search', async () => {
    server.use(http.get(PATROLS_API_URL, () => HttpResponse.json({ data: { count: 0, next: null, results: [] } })));
    renderLinkEventModal();

    expect(await screen.findByText('No patrols to display.')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search patrols' }), 'boat');

    expect(await screen.findByText('No results found.')).toBeInTheDocument();
    expect(screen.getByText('Adjust your search to find what you are looking for.')).toBeInTheDocument();
  });

  test('lets the user try again when the patrols could not be loaded', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(PATROLS_API_URL, () => new HttpResponse(null, { status: 500 }), { once: true }));
    renderLinkEventModal();

    expect(await screen.findByText('Could not load patrols. Please try again.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: 'Add to patrol 101 Patrol 101' })).toBeInTheDocument();
  });

  test('loads the next page of patrols once the list is scrolled to its end', async () => {
    jest.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function () {
      return this.parentNode;
    });
    const nextPagePatrol = makePatrol('next-page-patrol', 104, { time_range: { start_time: '2020-01-01T08:00:00Z' } });
    server.use(http.get(PATROLS_API_URL, ({ request }) => HttpResponse.json({
      data: new URL(request.url).searchParams.get('page') === '2'
        ? { count: 2, next: null, results: [nextPagePatrol] }
        : { count: 2, next: `${PATROLS_API_URL}?page=2`, results: [activePatrol] },
    })));
    renderLinkEventModal();

    expect(await screen.findByRole('button', { name: 'Add to patrol 104 Patrol 104' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to patrol 101 Patrol 101' })).toBeInTheDocument();
  });

  test('lists the incidents with how many events each holds', async () => {
    renderLinkEventModal({ type: EVENT_LINK_TARGET_TYPES.INCIDENT });

    const addButton = await screen.findByRole('button', { name: 'Add to incident 201 Poaching ring' });

    expect(screen.getByRole('dialog', { name: 'Add to Incident' })).toBeInTheDocument();
    expect(addButton.closest('li')).toHaveTextContent('2 events');
    expect(incidentRequests[0].get('is_collection')).toBe('true');

    await userEvent.click(addButton);

    expect(onAdd).toHaveBeenCalledWith(incident);
  });

  test('offers to create an incident only to a user who may', async () => {
    const { unmount } = renderLinkEventModal({ type: EVENT_LINK_TARGET_TYPES.INCIDENT });

    expect(screen.queryByRole('button', { name: 'Create new incident' })).not.toBeInTheDocument();

    unmount();
    renderLinkEventModal({ canCreateIncident: true, type: EVENT_LINK_TARGET_TYPES.INCIDENT });

    await userEvent.click(screen.getByRole('button', { name: 'Create new incident' }));

    expect(onCreateIncident).toHaveBeenCalled();
  });

  test('does not offer to create a patrol', () => {
    renderLinkEventModal({ canCreateIncident: true });

    expect(screen.queryByRole('button', { name: 'Create new incident' })).not.toBeInTheDocument();
  });
});
