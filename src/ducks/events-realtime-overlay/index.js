import globallyResettableReducer from '../../reducers/global-resettable';

// Actions
export const ADD_EVENT = 'EVENTS_REALTIME_OVERLAY.ADD_EVENT';
export const REMOVE_EVENT = 'EVENTS_REALTIME_OVERLAY.REMOVE_EVENT';
export const PRUNE_EVENTS = 'EVENTS_REALTIME_OVERLAY.PRUNE_EVENTS';

// Action creators
export const addRealtimeOverlayEvent = (id) => ({ payload: { addedAt: Date.now(), id }, type: ADD_EVENT });

export const removeRealtimeOverlayEvent = (id) => ({ payload: id, type: REMOVE_EVENT });

export const pruneRealtimeOverlayEvents = (cutoff) => ({ payload: cutoff, type: PRUNE_EVENTS });

// Reducer
export const INITIAL_STATE = { ids: {} };

const reducer = (state, action) => {
  switch (action.type) {
  case ADD_EVENT:
    return { ...state, ids: { ...state.ids, [action.payload.id]: action.payload.addedAt } };

  case REMOVE_EVENT: {
    if (!(action.payload in state.ids)) {
      return state;
    }

    const ids = { ...state.ids };
    delete ids[action.payload];
    return { ...state, ids };
  }

  case PRUNE_EVENTS: {
    const entries = Object.entries(state.ids);
    const retainedEntries = entries.filter(([, addedAt]) => addedAt >= action.payload);
    if (retainedEntries.length === entries.length) {
      return state;
    }
    return { ...state, ids: Object.fromEntries(retainedEntries) };
  }

  default:
    return state;
  }
};

export default globallyResettableReducer(reducer, INITIAL_STATE);
