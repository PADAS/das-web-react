import { Provider } from 'react-redux';
import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

import { act, renderHook, waitFor } from '../../../test-utils';
import { EVENT_LINK_TARGET_TYPES } from '../../../constants';
import { EVENTS_API_URL } from '../../../ducks/events';
import { mockStore } from '../../../__test-helpers/MockStore';
import { PATROLS_API_URL } from '../../../ducks/patrols';

import useLinkTargets from './';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

describe('LinkEventModal - utils - useLinkTargets', () => {
  const makePatrol = (id, timeRange, otherAttributes = {}) => ({
    id,
    patrol_segments: [{ id: `${id}-leg`, scheduled_start: '2020-01-01T08:00:00Z', time_range: timeRange }],
    state: 'open',
    ...otherAttributes,
  });

  const activePatrol = makePatrol('active-patrol', { end_time: null, start_time: '2020-01-01T08:00:00Z' });
  const plannedCancelledPatrol = makePatrol(
    'planned-cancelled-patrol',
    { end_time: null, start_time: null },
    { state: 'cancelled' }
  );
  const incidents = [{ id: 'incident-a' }, { id: 'incident-b' }, { id: 'incident-c' }];

  let incidentRequests;

  beforeEach(() => {
    incidentRequests = [];

    server.use(
      http.get(EVENTS_API_URL, ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        incidentRequests.push(searchParams);

        return HttpResponse.json({
          data: searchParams.get('page') === '2'
            ? { next: null, results: [incidents[1], incidents[2]] }
            : { next: `${EVENTS_API_URL}?page=2`, results: [incidents[0], incidents[1]] },
        });
      }),
      http.get(PATROLS_API_URL, ({ request }) => HttpResponse.json({
        data: new URL(request.url).searchParams.get('page') === '2'
          ? { next: null, results: [activePatrol] }
          : { next: `${PATROLS_API_URL}?page=2`, results: [plannedCancelledPatrol] },
      }))
    );
  });

  const renderUseLinkTargets = (type, searchText = '') => renderHook(() => useLinkTargets(type, searchText), {
    wrapper: ({ children }) => <Provider store={mockStore({ data: {}, view: {} })}>{children}</Provider>,
  });

  test('loads the incidents matching the search', async () => {
    const { result } = renderUseLinkTargets(EVENT_LINK_TARGET_TYPES.INCIDENT, 'snare');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(JSON.parse(incidentRequests[0].get('filter'))).toEqual({ text: 'snare' });
    expect(result.current.linkTargets).toEqual([incidents[0], incidents[1]]);
    expect(result.current.hasNextPage).toBe(true);
  });

  test('adds the next page without repeating a target that moved into it', async () => {
    const { result } = renderUseLinkTargets(EVENT_LINK_TARGET_TYPES.INCIDENT);

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    act(() => result.current.fetchNextPage());

    await waitFor(() => expect(result.current.linkTargets).toEqual(incidents));
    expect(result.current.hasNextPage).toBe(false);
  });

  test('reads past a page whose patrols all never began', async () => {
    const { result } = renderUseLinkTargets(EVENT_LINK_TARGET_TYPES.PATROL);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.linkTargets).toEqual([activePatrol]);
    expect(result.current.hasNextPage).toBe(false);
  });

  test('keeps the error until the user tries again', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(EVENTS_API_URL, () => new HttpResponse(null, { status: 500 }), { once: true }));
    const { result } = renderUseLinkTargets(EVENT_LINK_TARGET_TYPES.INCIDENT);

    await waitFor(() => expect(result.current.error).toBeTruthy());

    act(() => {
      result.current.fetchLinkTargets();
    });

    await waitFor(() => expect(result.current.linkTargets).toEqual([incidents[0], incidents[1]]));
    expect(result.current.error).toBeNull();
  });
});
