import axios from 'axios';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { API_URL, SYSTEM_CONFIG_FLAGS } from '../../constants';
import globallyResettableReducer from '../../reducers/global-resettable';
import { generateStorageConfig } from '../../reducers/storage-config';
import { showToast } from '../../utils/toast';
import {
  buildGearIndexFromRows,
  mergeGearRowsIntoIndex,
  normalizeGearListPage,
} from '../../utils/gear';

const GEAR_API_URL = `${API_URL}gear`;

/** Interval for background refresh of the gear list (ms). */
export const GEAR_LIST_POLL_INTERVAL_MS = 10 * 60 * 1000;

const FETCH_GEAR_START = 'FETCH_GEAR_START';
const FETCH_GEAR_APPEND_PAGE = 'FETCH_GEAR_APPEND_PAGE';
const FETCH_GEAR_SUCCESS = 'FETCH_GEAR_SUCCESS';
const FETCH_GEAR_ERROR = 'FETCH_GEAR_ERROR';

const HIDE_GEAR_ON_MAP = 'HIDE_GEAR_ON_MAP';
const SHOW_GEAR_ON_MAP = 'SHOW_GEAR_ON_MAP';
const GEAR_ENDPOINT_UNAVAILABLE = 'GEAR_ENDPOINT_UNAVAILABLE';

const MAX_GEAR_PAGES = 500;
const GEAR_PAGE_SIZE = 100;

export const hideGearOnMap = (...gearIds) => ({
  type: HIDE_GEAR_ON_MAP,
  payload: gearIds,
});

export const showGearOnMap = (...gearIds) => ({
  type: SHOW_GEAR_ON_MAP,
  payload: gearIds,
});

const fetchGearSuccess = (results) => ({
  type: FETCH_GEAR_SUCCESS,
  payload: results,
});

const fetchGearError = (message) => ({
  type: FETCH_GEAR_ERROR,
  payload: message,
});

const gearFetchErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return typeof error?.message === 'string' ? error.message : 'Could not load gear';
};

/**
 * Paginate through GET /api/v1.0/gear (default deployed state).
 */
export const fetchAllGear = () => async (dispatch, getState) => {
  if (getState().view?.systemConfig?.[SYSTEM_CONFIG_FLAGS.GEAR] === false) {
    return [];
  }

  const hadDataBeforeFetch = getState().data.gear.allIds.length > 0;

  dispatch({ type: FETCH_GEAR_START });

  try {
    const mergedRows = [];
    let page = 1;
    let hasNext = true;

    while (hasNext && page <= MAX_GEAR_PAGES) {
      const { data } = await axios.get(GEAR_API_URL, {
        params: { page, page_size: GEAR_PAGE_SIZE },
      });
      const { rows, hasNextPage } = normalizeGearListPage(data);
      mergedRows.push(...rows);
      if (!hadDataBeforeFetch && rows.length > 0) {
        dispatch({ type: FETCH_GEAR_APPEND_PAGE, payload: rows });
      }
      hasNext = hasNextPage;
      page += 1;
    }

    dispatch(fetchGearSuccess(mergedRows));
    return mergedRows;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 405) {
      dispatch({ type: GEAR_ENDPOINT_UNAVAILABLE });
      return [];
    }
    const message = gearFetchErrorMessage(error);
    dispatch(fetchGearError(message));
    showToast({
      message,
      toastConfig: { type: 'error' },
    });
    return [];
  }
};

export const INITIAL_GEAR_STATE = {
  allIds: [],
  byId: {},
  error: null,
  gearEndpointUnavailable: false,
  hiddenGearIds: [],
  initialLoadInProgress: false,
  loading: false,
  hasGear: false,
};

export const gearReducer = (state = INITIAL_GEAR_STATE, action) => {
  switch (action.type) {
  case FETCH_GEAR_START:
    return {
      ...state,
      error: null,
      gearEndpointUnavailable: false,
      initialLoadInProgress: state.allIds.length === 0,
      loading: true,
    };

  case FETCH_GEAR_APPEND_PAGE: {
    const { allIds, byId } = mergeGearRowsIntoIndex(state.allIds, state.byId, action.payload);
    return {
      ...state,
      allIds,
      byId,
      hasGear: allIds.length > 0,
    };
  }

  case FETCH_GEAR_SUCCESS: {
    const { allIds, byId } = buildGearIndexFromRows(action.payload);
    const idSet = new Set(allIds);
    return {
      ...state,
      allIds,
      byId,
      error: null,
      gearEndpointUnavailable: false,
      initialLoadInProgress: false,
      loading: false,
      hasGear: allIds.length > 0,
      hiddenGearIds: state.hiddenGearIds.filter((gid) => idSet.has(gid)),
    };
  }

  case GEAR_ENDPOINT_UNAVAILABLE:
    return {
      ...state,
      error: null,
      gearEndpointUnavailable: true,
      initialLoadInProgress: false,
      loading: false,
    };

  case FETCH_GEAR_ERROR:
    return {
      ...state,
      error: action.payload,
      initialLoadInProgress: false,
      loading: false,
    };

  case HIDE_GEAR_ON_MAP:
    return {
      ...state,
      hiddenGearIds: [...new Set([...state.hiddenGearIds, ...action.payload])],
    };

  case SHOW_GEAR_ON_MAP:
    return {
      ...state,
      hiddenGearIds: state.hiddenGearIds.filter((id) => !action.payload.includes(id)),
    };

  default:
    return state;
  }
};

const gearPersistConfig = {
  ...generateStorageConfig('gear'),
  storage,
  whitelist: ['hiddenGearIds'],
};

export default persistReducer(
  gearPersistConfig,
  globallyResettableReducer(gearReducer, INITIAL_GEAR_STATE),
);
