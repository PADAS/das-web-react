import eventsRealtimeOverlayReducer, {
  ADD_EVENT,
  addRealtimeOverlayEvent,
  REMOVE_EVENT,
  removeRealtimeOverlayEvent,
  PRUNE_EVENTS,
  pruneRealtimeOverlayEvents,
  INITIAL_STATE,
} from './';

describe('Ducks - Events realtime overlay', () => {
  test('addRealtimeOverlayEvent dispatches the ADD_EVENT action', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1000);

    expect(addRealtimeOverlayEvent('event-1')).toEqual({
      payload: { addedAt: 1000, id: 'event-1' },
      type: ADD_EVENT,
    });
  });

  test('removeRealtimeOverlayEvent dispatches the REMOVE_EVENT action', () => {
    expect(removeRealtimeOverlayEvent('event-1')).toEqual({
      payload: 'event-1',
      type: REMOVE_EVENT,
    });
  });

  test('pruneRealtimeOverlayEvents dispatches the PRUNE_EVENTS action', () => {
    expect(pruneRealtimeOverlayEvents(2000)).toEqual({
      payload: 2000,
      type: PRUNE_EVENTS,
    });
  });

  describe('eventsRealtimeOverlayReducer', () => {
    test('returns the initial state', () => {
      expect(eventsRealtimeOverlayReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles the ADD_EVENT action', () => {
      const action = { payload: { addedAt: 1000, id: 'event-1' }, type: ADD_EVENT };
      const expectedState = { ids: { 'event-1': 1000 } };

      expect(eventsRealtimeOverlayReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles the REMOVE_EVENT action', () => {
      const state = { ids: { 'event-1': 1000, 'event-2': 2000 } };
      const action = { payload: 'event-1', type: REMOVE_EVENT };
      const expectedState = { ids: { 'event-2': 2000 } };

      expect(eventsRealtimeOverlayReducer(state, action)).toEqual(expectedState);
    });

    test('handles the PRUNE_EVENTS action removing the events added before the cutoff', () => {
      const state = { ids: { 'event-1': 1000, 'event-2': 2000, 'event-3': 3000 } };
      const action = { payload: 2000, type: PRUNE_EVENTS };
      const expectedState = { ids: { 'event-2': 2000, 'event-3': 3000 } };

      expect(eventsRealtimeOverlayReducer(state, action)).toEqual(expectedState);
    });
  });
});
