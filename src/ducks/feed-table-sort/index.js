import { DELETE_PATROL_BY_ID, REMOVE_PATROL_FROM_FEED } from '../patrols';
import globallyResettableReducer from '../../reducers/global-resettable';
import { REMOVE_EVENT_BY_ID } from '../events';
import { TAB_KEYS } from '../../constants';

// Actions
export const ADD_FEED_TABLE_FULL_LOAD_PAGE = 'FEED_TABLE_SORT.ADD_FEED_TABLE_FULL_LOAD_PAGE';
export const SET_FEED_TABLE_CLIENT_SORT = 'FEED_TABLE_SORT.SET_FEED_TABLE_CLIENT_SORT';
export const START_FEED_TABLE_FULL_LOAD = 'FEED_TABLE_SORT.START_FEED_TABLE_FULL_LOAD';

// Action creators
export const addFeedTableFullLoadPage = (tab, key, ids, next) => ({
  payload: { ids, key, next, tab },
  type: ADD_FEED_TABLE_FULL_LOAD_PAGE,
});

export const setFeedTableClientSort = (tab, clientSort) => ({
  payload: { clientSort, tab },
  type: SET_FEED_TABLE_CLIENT_SORT,
});

export const startFeedTableFullLoad = (tab, key, url) => ({
  payload: { key, tab, url },
  type: START_FEED_TABLE_FULL_LOAD,
});

// Reducer
export const INITIAL_FULL_LOAD_STATE = { ids: [], key: null, loadingIds: [], next: null, url: null };

const INITIAL_TABLE_STATE = { clientSort: null, fullLoad: INITIAL_FULL_LOAD_STATE };

export const INITIAL_STATE = { [TAB_KEYS.EVENTS]: INITIAL_TABLE_STATE, [TAB_KEYS.PATROLS]: INITIAL_TABLE_STATE };

const appendNewIds = (ids, otherIds) => {
  const knownIds = new Set(ids);

  return [...ids, ...otherIds.filter((id) => !knownIds.has(id))];
};

const removeId = (state, tab, removedId) => {
  const fullLoad = state[tab].fullLoad;

  return {
    ...state,
    [tab]: {
      ...state[tab],
      fullLoad: {
        ...fullLoad,
        ids: fullLoad.ids.filter((id) => id !== removedId),
        loadingIds: fullLoad.loadingIds.filter((id) => id !== removedId),
      },
    },
  };
};

const updateFullLoad = (state, tab, fullLoad) => ({ ...state, [tab]: { ...state[tab], fullLoad } });

const feedTableSortReducer = globallyResettableReducer((state, { payload, type }) => {
  switch (type) {
  case ADD_FEED_TABLE_FULL_LOAD_PAGE: {
    const fullLoad = state[payload.tab].fullLoad;
    if (fullLoad.key !== payload.key) return state;

    const loadingIds = appendNewIds(fullLoad.loadingIds, payload.ids);
    return updateFullLoad(state, payload.tab, payload.next
      ? { ...fullLoad, loadingIds, next: payload.next }
      : { ...fullLoad, ids: loadingIds, loadingIds: [], next: null });
  }

  case DELETE_PATROL_BY_ID:
  case REMOVE_PATROL_FROM_FEED:
    return removeId(state, TAB_KEYS.PATROLS, payload);

  case REMOVE_EVENT_BY_ID:
    return removeId(state, TAB_KEYS.EVENTS, payload);

  case SET_FEED_TABLE_CLIENT_SORT:
    return { ...state, [payload.tab]: { ...state[payload.tab], clientSort: payload.clientSort } };

  // A reload of the same rows keeps showing the old ones until it is done.
  case START_FEED_TABLE_FULL_LOAD: {
    const fullLoad = state[payload.tab].fullLoad;

    return updateFullLoad(state, payload.tab, {
      ids: fullLoad.url === payload.url ? fullLoad.ids : [],
      key: payload.key,
      loadingIds: [],
      next: payload.url,
      url: payload.url,
    });
  }

  default:
    return state;
  }
}, INITIAL_STATE);

export default feedTableSortReducer;
