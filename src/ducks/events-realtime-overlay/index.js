import globallyResettableReducer from '../../reducers/global-resettable';

// Actions
export const ADD_EVENT = 'EVENTS_REALTIME_OVERLAY.ADD_EVENT';
export const CLEAR_HIDDEN_EVENTS = 'EVENTS_REALTIME_OVERLAY.CLEAR_HIDDEN_EVENTS';
export const PRUNE_EVENTS = 'EVENTS_REALTIME_OVERLAY.PRUNE_EVENTS';
export const REMOVE_EVENT = 'EVENTS_REALTIME_OVERLAY.REMOVE_EVENT';

// Action creators
export const addRealtimeOverlayEvent = (id) => ({ payload: { addedAt: Date.now(), id }, type: ADD_EVENT });

export const clearHiddenRealtimeOverlayEvents = () => ({ type: CLEAR_HIDDEN_EVENTS });

export const removeRealtimeOverlayEvent = (id) => ({ payload: id, type: REMOVE_EVENT });

export const pruneRealtimeOverlayEvents = (cutoff) => ({ payload: cutoff, type: PRUNE_EVENTS });

// Reducer
export const INITIAL_STATE = { ids: {}, hiddenIds: {} };

const reducer = (state, action) => {
  switch (action.type) {
  case ADD_EVENT: {
    const hiddenIds = { ...state.hiddenIds };
    delete hiddenIds[action.payload.id];

    return {
      ...state,
      ids: { ...state.ids, [action.payload.id]: action.payload.addedAt },
      hiddenIds,
    };
  }

  case REMOVE_EVENT: {
    const ids = { ...state.ids };
    delete ids[action.payload];

    return {
      ...state,
      ids,
      hiddenIds: { ...state.hiddenIds, [action.payload]: true },
    };
  }

  case CLEAR_HIDDEN_EVENTS:
    return Object.keys(state.hiddenIds).length ? { ...state, hiddenIds: {} } : state;

  case PRUNE_EVENTS: {
    const entries = Object.entries(state.ids);
    const retained = entries.filter(([, addedAt]) => addedAt >= action.payload);
    if (retained.length === entries.length) {
      return state;
    }

    return { ...state, ids: Object.fromEntries(retained) };
  }

  default:
    return state;
  }
};

export default globallyResettableReducer(reducer, INITIAL_STATE);
