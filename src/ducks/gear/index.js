import axios from 'axios';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { API_URL } from '../../constants';
import globallyResettableReducer from '../../reducers/global-resettable';
import { generateStorageConfig } from '../../reducers/storage-config';
import { showToast } from '../../utils/toast';
import { parseGearListPagePayload } from '../../utils/gear';

const GEAR_API_URL = `${API_URL}gear`;

const FETCH_GEAR_START = 'FETCH_GEAR_START';
const FETCH_GEAR_APPEND_PAGE = 'FETCH_GEAR_APPEND_PAGE';
const FETCH_GEAR_SUCCESS = 'FETCH_GEAR_SUCCESS';
const FETCH_GEAR_ERROR = 'FETCH_GEAR_ERROR';

const HIDE_GEAR_ON_MAP = 'HIDE_GEAR_ON_MAP';
const SHOW_GEAR_ON_MAP = 'SHOW_GEAR_ON_MAP';

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

const fetchGearError = (error) => ({
  type: FETCH_GEAR_ERROR,
  payload: error,
});

/**
 * Paginate through GET /api/v1.0/gear (default deployed state).
 */
export const fetchAllGear = () => async (dispatch, getState) => {
  const hadDataBeforeFetch = getState().data.gear.allIds.length > 0;

  dispatch({ type: FETCH_GEAR_START });

  try {
    const merged = [];
    let page = 1;
    let hasNext = true;

    while (hasNext && page <= MAX_GEAR_PAGES) {
      const { data } = await axios.get(GEAR_API_URL, {
        params: { page, page_size: GEAR_PAGE_SIZE },
      });
      const { rows, hasNextPage } = parseGearListPagePayload(data);
      merged.push(...rows);
      if (!hadDataBeforeFetch && rows.length > 0) {
        dispatch({ type: FETCH_GEAR_APPEND_PAGE, payload: rows });
      }
      hasNext = hasNextPage;
      page += 1;
    }

    dispatch(fetchGearSuccess(merged));
    return merged;
  } catch (error) {
    dispatch(fetchGearError(error));
    const detail = error?.response?.data?.detail ?? error?.response?.data?.message;
    const message = detail != null ? String(detail) : (error?.message || 'Could not load gear');
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
  hiddenGearIds: [],
  initialLoadInProgress: false,
  loading: false,
  tabEligible: false,
};

const mergeGearResults = (results) => {
  const byId = {};
  const allIds = [];

  (results || []).forEach((row) => {
    if (!row?.id) return;
    const id = row.id;
    if (!byId[id]) {
      allIds.push(id);
    }
    byId[id] = row;
  });

  return { allIds, byId };
};

/** Merge one API page into existing store (first-load pagination only). */
const mergeGearAppendRows = (state, rows) => {
  const byId = { ...state.byId };
  const allIds = [...state.allIds];
  const existing = new Set(allIds);
  (rows || []).forEach((row) => {
    if (!row?.id) return;
    if (!existing.has(row.id)) {
      existing.add(row.id);
      allIds.push(row.id);
    }
    byId[row.id] = row;
  });
  return { allIds, byId };
};

const gearReducer = (state = INITIAL_GEAR_STATE, action) => {
  switch (action.type) {
  case FETCH_GEAR_START:
    return {
      ...state,
      error: null,
      initialLoadInProgress: state.allIds.length === 0,
      loading: true,
    };

  case FETCH_GEAR_APPEND_PAGE: {
    const { allIds, byId } = mergeGearAppendRows(state, action.payload);
    return {
      ...state,
      allIds,
      byId,
      tabEligible: allIds.length > 0,
    };
  }

  case FETCH_GEAR_SUCCESS: {
    const { allIds, byId } = mergeGearResults(action.payload);
    const idSet = new Set(allIds);
    return {
      ...state,
      allIds,
      byId,
      error: null,
      initialLoadInProgress: false,
      loading: false,
      tabEligible: allIds.length > 0,
      hiddenGearIds: state.hiddenGearIds.filter((gid) => idSet.has(gid)),
    };
  }

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
