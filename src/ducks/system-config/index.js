import { DEFAULT_SHOW_TRACK_DAYS, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { endOfToday, generateDaysAgoDate } from '../../utils/datetime';
import { EVENT_FILTER_STORAGE_KEY, setDefaultDateRange as setDefaultEventDateRange } from '../event-filter';
import { getKeyIsRestorable } from '../../reducers/storage-config';
import { setDefaultDateRange as setDefaultPatrolDateRange } from '../patrol-filter';
import { setSitenameDimension } from '../../utils/analytics';

// Actions
export const SET_SYSTEM_CONFIG = 'SYSTEM_CONFIG.SET_SYSTEM_CONFIG';

// Action creators
export const setSystemConfigFromSystemStatus = (systemStatus) => (dispatch) => {
  // Set the Google Analytics 4 sitename dimension.
  const sitename = systemStatus.site_name || window.location.hostname;
  setSitenameDimension(sitename);

  // Set the system config flags.
  dispatch({
    type: SET_SYSTEM_CONFIG,
    payload: {
      [SYSTEM_CONFIG_FLAGS.ALERTS]: systemStatus[SYSTEM_CONFIG_FLAGS.ALERTS],
      [SYSTEM_CONFIG_FLAGS.ANALYZERS]: systemStatus[SYSTEM_CONFIG_FLAGS.ANALYZERS],
      [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: systemStatus[SYSTEM_CONFIG_FLAGS.DAILY_REPORT],
      [SYSTEM_CONFIG_FLAGS.EVENTS]: systemStatus[SYSTEM_CONFIG_FLAGS.EVENTS],
      [SYSTEM_CONFIG_FLAGS.EULA]: systemStatus[SYSTEM_CONFIG_FLAGS.EULA],
      [SYSTEM_CONFIG_FLAGS.GEOPERMISSIONS]: systemStatus.geoPermissionsEnabled ?? false,
      [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: systemStatus[SYSTEM_CONFIG_FLAGS.KML_EXPORT],
      [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: systemStatus[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT],
      [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: systemStatus[SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES],
      [SYSTEM_CONFIG_FLAGS.SUBJECTS]: systemStatus[SYSTEM_CONFIG_FLAGS.SUBJECTS],
      [SYSTEM_CONFIG_FLAGS.TABLEAU]: systemStatus[SYSTEM_CONFIG_FLAGS.TABLEAU],
      showTrackDays: systemStatus.show_track_days,
      sitename,
    },
  });

  if (systemStatus[SYSTEM_CONFIG_FLAGS.DEFAULT_EVENT_FILTER_FROM_DAYS]) {
    const eventFilterSavedLocally = getKeyIsRestorable(EVENT_FILTER_STORAGE_KEY);
    if (!eventFilterSavedLocally) {
      // If the default event filter from days is set and the event filter is
      // not saved locally, set the default event date range from the system
      // config flag.
      dispatch(setDefaultEventDateRange(
        generateDaysAgoDate(systemStatus[SYSTEM_CONFIG_FLAGS.DEFAULT_EVENT_FILTER_FROM_DAYS]).toISOString(),
        null
      ));
    }
  }

  if (systemStatus[SYSTEM_CONFIG_FLAGS.DEFAULT_PATROL_FILTER_FROM_DAYS]) {
    // If the default patrol filter from days is set, set the default patrol
    // date range from the system config flag.
    dispatch(setDefaultPatrolDateRange(
      generateDaysAgoDate(systemStatus[SYSTEM_CONFIG_FLAGS.DEFAULT_PATROL_FILTER_FROM_DAYS]).toISOString(),
      endOfToday().toISOString()
    ));
  }
};

// Reducer
export const INITIAL_STATE = {
  [SYSTEM_CONFIG_FLAGS.ALERTS]: false,
  [SYSTEM_CONFIG_FLAGS.ANALYZERS]: false,
  [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: false,
  [SYSTEM_CONFIG_FLAGS.EULA]: false,
  [SYSTEM_CONFIG_FLAGS.EVENTS]: false,
  [SYSTEM_CONFIG_FLAGS.GEOPERMISSIONS]: false,
  [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: false,
  [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: false,
  [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: false,
  [SYSTEM_CONFIG_FLAGS.SUBJECTS]: false,
  [SYSTEM_CONFIG_FLAGS.TABLEAU]: false,
  showTrackDays: DEFAULT_SHOW_TRACK_DAYS,
  sitename: '',
};

const systemConfigReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SET_SYSTEM_CONFIG:
    return { ...state, ...action.payload };

  default:
    return state;
  }
};

export default systemConfigReducer;
