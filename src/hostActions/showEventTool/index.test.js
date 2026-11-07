import { fetchEvent } from '../../ducks/events';
import { HOST_TOOL_ERROR_CODES } from '../HostToolError';
import { mockStore } from '../../__test-helpers/MockStore';

import showEventTool from './';

jest.mock('../../ducks/events', () => ({
  ...jest.requireActual('../../ducks/events'),
  fetchEvent: jest.fn(),
}));

const EVENT = {
  event_type: 'snare_rep',
  geojson: { geometry: { coordinates: [36.8, -1.3], type: 'Point' }, properties: {}, type: 'Feature' },
  id: 'snare-event',
  priority: 300,
  serial_number: 4471,
  state: 'active',
  title: 'Snare at the river',
};

describe('hostActions - showEventTool', () => {
  let jumpToLocation, state, store;
  beforeEach(() => {
    jest.useFakeTimers();
    fetchEvent.mockImplementation(() => () => Promise.resolve());
    jumpToLocation = jest.fn();
    state = {
      data: { eventStore: { [EVENT.id]: EVENT }, eventTypes: [], mapLayerFilter: { showReportsOnMap: true } },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const runTool = (args) => {
    store = mockStore(() => state);

    return showEventTool.run(args, { dispatch: store.dispatch, getState: store.getState, jumpToLocation });
  };

  test('centers the map on the event and bounces it', async () => {
    await runTool({ event_id: EVENT.id });
    jest.runAllTimers();

    expect(jumpToLocation).toHaveBeenCalledWith([36.8, -1.3]);
    expect(store.getActions()).toEqual([
      { payload: [], type: 'SET_BOUNCE_EVENT_ID' },
      { payload: [EVENT.id], type: 'SET_BOUNCE_EVENT_ID' },
    ]);
  });

  test('resolves with what Otus needs to confirm it and link to it', async () => {
    await expect(runTool({ event_id: EVENT.id })).resolves.toEqual({
      detail_url: `${window.location.origin}/events/${EVENT.id}?lnglat=36.8,-1.3`,
      event_id: EVENT.id,
      events_layer_visible: true,
      map_centered: true,
      priority: 'red',
      serial_number: 4471,
      state: 'active',
      title: 'Snare at the river',
    });
  });

  test('does not move the map for an event without a location', async () => {
    state.data.eventStore[EVENT.id] = { ...EVENT, geojson: null };

    const result = await runTool({ event_id: EVENT.id });

    expect(jumpToLocation).not.toHaveBeenCalled();
    expect(result.map_centered).toBe(false);
  });

  test('fetches an event the store does not hold yet', async () => {
    fetchEvent.mockImplementation((eventId) => () => {
      state.data.eventStore[eventId] = { ...EVENT, id: eventId };

      return Promise.resolve();
    });

    const result = await runTool({ event_id: 'fetched-event' });

    expect(fetchEvent).toHaveBeenCalledWith('fetched-event');
    expect(result.event_id).toBe('fetched-event');
  });

  test('rejects as not found when the site has no such event', async () => {
    fetchEvent.mockImplementation(() => () => Promise.reject({ response: { status: 404 } }));

    await expect(runTool({ event_id: 'unknown-event' }))
      .rejects.toMatchObject({ code: HOST_TOOL_ERROR_CODES.NOT_FOUND });
  });
});
