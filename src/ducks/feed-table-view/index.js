import { generateOptionalStorageConfig } from '../../reducers/storage-config';

// Actions
export const FEED_TABLE_VIEW_STORAGE_KEY = 'feedTableView';

export const SET_FEED_TABLE_VIEW = 'FEED_TABLE_VIEW.SET_FEED_TABLE_VIEW';

// Action creators
export const setFeedTableView = (tab, isTableView) => ({ payload: { isTableView, tab }, type: SET_FEED_TABLE_VIEW });

// Reducer
export const INITIAL_STATE = { events: false, patrols: false };

export const persistenceConfig = generateOptionalStorageConfig(FEED_TABLE_VIEW_STORAGE_KEY, INITIAL_STATE);

const feedTableViewReducer = (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
  case SET_FEED_TABLE_VIEW:
    return { ...state, [payload.tab]: payload.isTableView };

  default:
    return state;
  }
};

export default feedTableViewReducer;
