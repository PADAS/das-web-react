import { getKeyIsRestorable } from '../../reducers/storage-config';
import { setDefaultDateRange as setDefaultEventDateRange } from '../event-filter';
import { setDefaultDateRange as setDefaultPatrolDateRange } from '../patrol-filter';
import { setSitenameDimension } from '../../utils/analytics';
import { SYSTEM_CONFIG_FLAGS } from '../../constants';

import systemConfigReducer, { SET_SYSTEM_CONFIG, setSystemConfigFromSystemStatus, INITIAL_STATE } from './';

jest.mock('../../reducers/storage-config', () => ({
  ...jest.requireActual('../../reducers/storage-config'),
  getKeyIsRestorable: jest.fn(),
}));

jest.mock('../event-filter', () => ({
  ...jest.requireActual('../event-filter'),
  setDefaultDateRange: jest.fn(),
}));

jest.mock('../patrol-filter', () => ({
  ...jest.requireActual('../patrol-filter'),
  setDefaultDateRange: jest.fn(),
}));

jest.mock('../../utils/analytics', () => ({
  ...jest.requireActual('../../utils/analytics'),
  setSitenameDimension: jest.fn(),
}));

describe('Ducks - System config', () => {
  beforeEach(() => {
    getKeyIsRestorable.mockImplementation(() => false);
    setDefaultEventDateRange.mockImplementation(() => () => {});
    setDefaultPatrolDateRange.mockImplementation(() => () => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('setSystemConfigFromSystemStatus sets the site name dimension and dispatches the SET_SYSTEM_CONFIG action', async () => {
    const systemStatus = {
      [SYSTEM_CONFIG_FLAGS.ALERTS]: true,
      [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
      [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: true,
      [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
      [SYSTEM_CONFIG_FLAGS.EULA]: true,
      [SYSTEM_CONFIG_FLAGS.GEO_SPAN]: { 'lat': [0, 10], 'lon': [15, 20] },
      [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: true,
      [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
      [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
      [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
      [SYSTEM_CONFIG_FLAGS.TABLEAU]: true,
      geoPermissionsEnabled: true,
      preview_features: { community_input_admin_enabled: true },
      show_track_days: true,
      site_name: 'Site name',
    };
    const dispatch = jest.fn();

    setSystemConfigFromSystemStatus(systemStatus)(dispatch);

    expect(setSitenameDimension).toHaveBeenCalledTimes(1);
    expect(setSitenameDimension).toHaveBeenCalledWith('Site name');
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        [SYSTEM_CONFIG_FLAGS.ALERTS]: true,
        [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
        [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: true,
        [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        [SYSTEM_CONFIG_FLAGS.EULA]: true,
        [SYSTEM_CONFIG_FLAGS.GEOPERMISSIONS]: true,
        [SYSTEM_CONFIG_FLAGS.GEO_SPAN]: { 'lat': [0, 10], 'lon': [15, 20] },
        [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: true,
        [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
        [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
        [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
        [SYSTEM_CONFIG_FLAGS.TABLEAU]: true,
        idp_org_id: null,
        previewFeatures: {
          community_input_admin_enabled: true,
        },
        require_idp: false,
        site_slug: null,
        sitename: 'Site name',
        support_managed_users: false,
        showTrackDays: true,
      },
      type: SET_SYSTEM_CONFIG,
    });
  });

  test('setSystemConfigFromSystemStatus forwards the site slug that names the managed-user connection', async () => {
    const dispatch = jest.fn();

    setSystemConfigFromSystemStatus({ site_name: 'Site name', site_slug: 'gdl-zoo' })(dispatch);

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ site_slug: 'gdl-zoo' }),
      type: SET_SYSTEM_CONFIG,
    }));
  });

  test('setSystemConfigFromSystemStatus reports a null site slug on a server that does not send one', async () => {
    const dispatch = jest.fn();

    setSystemConfigFromSystemStatus({ site_name: 'Site name' })(dispatch);

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ site_slug: null }),
      type: SET_SYSTEM_CONFIG,
    }));
  });

  test('setSystemConfigFromSystemStatus forwards that the site supports managed users', async () => {
    const dispatch = jest.fn();

    setSystemConfigFromSystemStatus({ site_name: 'Site name', support_managed_users: true })(dispatch);

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ support_managed_users: true }),
      type: SET_SYSTEM_CONFIG,
    }));
  });

  test('setSystemConfigFromSystemStatus treats a server that does not send the flag as not supporting managed users', async () => {
    const dispatch = jest.fn();

    setSystemConfigFromSystemStatus({ site_name: 'Site name' })(dispatch);

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ support_managed_users: false }),
      type: SET_SYSTEM_CONFIG,
    }));
  });

  test('setSystemConfigFromSystemStatus sets the default event date range if the event filter is not saved locally', async () => {
    const systemStatus = {
      [SYSTEM_CONFIG_FLAGS.ALERTS]: true,
      [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
      [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: true,
      [SYSTEM_CONFIG_FLAGS.DEFAULT_EVENT_FILTER_FROM_DAYS]: 3,
      [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
      [SYSTEM_CONFIG_FLAGS.EULA]: true,
      [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: true,
      [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
      [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
      [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
      [SYSTEM_CONFIG_FLAGS.TABLEAU]: true,
      geoPermissionsEnabled: true,
      show_track_days: true,
      site_name: 'Site name',
    };
    const dispatch = jest.fn();

    setSystemConfigFromSystemStatus(systemStatus)(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(setDefaultEventDateRange).toHaveBeenCalledTimes(1);
  });

  test('setSystemConfigFromSystemStatus does not set the default event date range if the event filter is saved locally', async () => {
    getKeyIsRestorable.mockImplementation(() => true);

    const systemStatus = {
      [SYSTEM_CONFIG_FLAGS.ALERTS]: true,
      [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
      [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: true,
      [SYSTEM_CONFIG_FLAGS.DEFAULT_EVENT_FILTER_FROM_DAYS]: 3,
      [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
      [SYSTEM_CONFIG_FLAGS.EULA]: true,
      [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: true,
      [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
      [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
      [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
      [SYSTEM_CONFIG_FLAGS.TABLEAU]: true,
      geoPermissionsEnabled: true,
      show_track_days: true,
      site_name: 'Site name',
    };
    const dispatch = jest.fn();

    setSystemConfigFromSystemStatus(systemStatus)(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(setDefaultEventDateRange).not.toHaveBeenCalled();
  });

  test('setSystemConfigFromSystemStatus sets the default patrol date range', async () => {
    const systemStatus = {
      [SYSTEM_CONFIG_FLAGS.ALERTS]: true,
      [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
      [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: true,
      [SYSTEM_CONFIG_FLAGS.DEFAULT_PATROL_FILTER_FROM_DAYS]: 3,
      [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
      [SYSTEM_CONFIG_FLAGS.EULA]: true,
      [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: true,
      [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
      [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
      [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
      [SYSTEM_CONFIG_FLAGS.TABLEAU]: true,
      geoPermissionsEnabled: true,
      show_track_days: true,
      site_name: 'Site name',
    };
    const dispatch = jest.fn();

    setSystemConfigFromSystemStatus(systemStatus)(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(setDefaultPatrolDateRange).toHaveBeenCalledTimes(1);
  });

  describe('systemConfigReducer', () => {
    test('returns the initial state', async () => {
      expect(systemConfigReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a SET_SYSTEM_CONFIG action', async () => {
      const payload = {
        [SYSTEM_CONFIG_FLAGS.ALERTS]: true,
        [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
        [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: true,
        [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        [SYSTEM_CONFIG_FLAGS.EULA]: true,
        [SYSTEM_CONFIG_FLAGS.GEOPERMISSIONS]: true,
        [SYSTEM_CONFIG_FLAGS.GEO_SPAN]: { 'lat': [0, 10], 'lon': [15, 20] },
        [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: true,
        [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
        [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
        [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
        [SYSTEM_CONFIG_FLAGS.TABLEAU]: true,
        previewFeatures: { community_input_admin_enabled: true },
        showTrackDays: true,
        sitename: 'Site name',
      };
      const action = { payload, type: SET_SYSTEM_CONFIG };
      const expectedState = {
        [SYSTEM_CONFIG_FLAGS.ALERTS]: true,
        [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
        [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: true,
        [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        [SYSTEM_CONFIG_FLAGS.EULA]: true,
        [SYSTEM_CONFIG_FLAGS.GEOPERMISSIONS]: true,
        [SYSTEM_CONFIG_FLAGS.GEO_SPAN]: { 'lat': [0, 10], 'lon': [15, 20] },
        [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: true,
        [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
        [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
        [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
        [SYSTEM_CONFIG_FLAGS.TABLEAU]: true,
        idp_org_id: null,
        previewFeatures: { community_input_admin_enabled: true },
        require_idp: null,
        showTrackDays: true,
        site_slug: null,
        sitename: 'Site name',
        support_managed_users: false,
      };

      expect(systemConfigReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });
  });
});
