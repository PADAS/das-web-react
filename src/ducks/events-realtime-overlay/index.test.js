import eventsRealtimeOverlayReducer, {
  ADD_EVENT,
  addRealtimeOverlayEvent,
  REMOVE_EVENT,
  removeRealtimeOverlayEvent,
  PRUNE_EVENTS,
  pruneRealtimeOverlayEvents,
  CLEAR_HIDDEN_EVENTS,
  clearHiddenRealtimeOverlayEvents,
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

  test('removeRealtimeOverlayEvent dispatches the REMOVE_EVENT action with the id', () => {
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

  test('clearHiddenRealtimeOverlayEvents dispatches the CLEAR_HIDDEN_EVENTS action', () => {
    expect(clearHiddenRealtimeOverlayEvents()).toEqual({ type: CLEAR_HIDDEN_EVENTS });
  });

  describe('eventsRealtimeOverlayReducer', () => {
    test('returns the initial state', () => {
      expect(eventsRealtimeOverlayReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles the ADD_EVENT action', () => {
      const action = { payload: { addedAt: 1000, id: 'event-1' }, type: ADD_EVENT };
      const expectedState = { ids: { 'event-1': 1000 }, hiddenIds: {} };

      expect(eventsRealtimeOverlayReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('ADD_EVENT clears a pending hide (the event matches again)', () => {
      const state = { ids: {}, hiddenIds: { 'event-1': true } };
      const action = { payload: { addedAt: 1000, id: 'event-1' }, type: ADD_EVENT };

      expect(eventsRealtimeOverlayReducer(state, action)).toEqual({ ids: { 'event-1': 1000 }, hiddenIds: {} });
    });

    test('REMOVE_EVENT stops overlaying the event and hides it from the stale tile', () => {
      const state = { ids: { 'event-1': 1000, 'event-2': 2000 }, hiddenIds: {} };
      const action = { payload: 'event-1', type: REMOVE_EVENT };

      expect(eventsRealtimeOverlayReducer(state, action)).toEqual({
        ids: { 'event-2': 2000 },
        hiddenIds: { 'event-1': true },
      });
    });

    test('REMOVE_EVENT hides an event even when it was never in the overlay (e.g. a tile-only event)', () => {
      const state = { ids: {}, hiddenIds: {} };
      const action = { payload: 'tile-only', type: REMOVE_EVENT };

      expect(eventsRealtimeOverlayReducer(state, action)).toEqual({ ids: {}, hiddenIds: { 'tile-only': true } });
    });

    test('CLEAR_HIDDEN_EVENTS empties hiddenIds but leaves the overlay members', () => {
      const state = { ids: { 'event-1': 1000 }, hiddenIds: { 'gone-1': true, 'gone-2': true } };
      const action = { type: CLEAR_HIDDEN_EVENTS };

      expect(eventsRealtimeOverlayReducer(state, action)).toEqual({ ids: { 'event-1': 1000 }, hiddenIds: {} });
    });

    test('CLEAR_HIDDEN_EVENTS keeps the same state reference when nothing is hidden', () => {
      const state = { ids: { 'event-1': 1000 }, hiddenIds: {} };

      expect(eventsRealtimeOverlayReducer(state, { type: CLEAR_HIDDEN_EVENTS })).toBe(state);
    });

    test('PRUNE_EVENTS removes overlay members added before the cutoff and never touches hiddenIds', () => {
      const state = {
        ids: { 'event-1': 1000, 'event-2': 2000, 'event-3': 3000 },
        hiddenIds: { 'hidden-old': true },
      };
      const action = { payload: 2000, type: PRUNE_EVENTS };

      expect(eventsRealtimeOverlayReducer(state, action)).toEqual({
        ids: { 'event-2': 2000, 'event-3': 3000 },
        // hiddenIds is filter-cleared, not time-pruned, so the old entry survives the prune.
        hiddenIds: { 'hidden-old': true },
      });
    });

    test('PRUNE_EVENTS keeps the same state reference when no member is pruned', () => {
      const state = { ids: { 'event-1': 3000 }, hiddenIds: { 'hidden-1': true } };
      const action = { payload: 2000, type: PRUNE_EVENTS };

      expect(eventsRealtimeOverlayReducer(state, action)).toBe(state);
    });
  });
});
