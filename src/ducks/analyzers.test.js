import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import analyzersReducer, {
  ANALYZERS_API_URL,
  fetchAnalyzers,
  FETCH_ANALYZERS_ERROR,
  FETCH_ANALYZERS_SUCCESS,
} from './analyzers';

const GOOD_GEOFENCE_LINK = 'http://localhost/spatial-group/good-geofence';
const UNREACHABLE_GEOFENCE_LINK = 'http://localhost/spatial-group/unreachable-geofence';
const MIXED_GEOFENCE_LINK = 'http://localhost/spatial-group/mixed-geofence';
const BAD_PROXIMITY_LINK = 'http://localhost/spatial-group/bad-proximity';
const GOOD_PROXIMITY_LINK = 'http://localhost/spatial-group/good-proximity';

const lineGeometry = { type: 'LineString', coordinates: [[0, 0], [1, 1]] };
const pointGeometry = { type: 'Point', coordinates: [2, 2] };
const polygonGeometry = { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] };

const makeSpatialFeature = (geometry, pk = 'feature-pk') => ({
  features: [{ type: 'Feature', geometry, properties: { pk } }],
});

const partiallyUnreachableGeofenceAnalyzer = {
  id: 'geofence-id',
  name: 'Good Geofence',
  analyzer_category: 'geofence',
  admin_href: 'http://localhost/admin/geofence',
  spatial_groups: {
    warning_group: GOOD_GEOFENCE_LINK,
    critical_group: UNREACHABLE_GEOFENCE_LINK,
    containment_regions_group: null,
  },
};

const mixedGeofenceAnalyzer = {
  ...partiallyUnreachableGeofenceAnalyzer,
  id: 'mixed-geofence-id',
  name: 'Mixed Geofence',
  spatial_groups: { warning_group: MIXED_GEOFENCE_LINK },
};

const badProximityAnalyzer = {
  id: 'bad-proximity-id',
  name: 'Tourist Road Proximity - Line',
  analyzer_category: 'proximity',
  admin_href: 'http://localhost/admin/bad-proximity',
  threshold_dist_meters: -1.0,
  spatial_groups: { proximity_group: BAD_PROXIMITY_LINK },
};

const goodProximityAnalyzer = {
  id: 'good-proximity-id',
  name: 'Good Proximity',
  analyzer_category: 'proximity',
  admin_href: 'http://localhost/admin/good-proximity',
  threshold_dist_meters: 500,
  spatial_groups: { proximity_group: GOOD_PROXIMITY_LINK },
};

const spatialGroupResponse = (...features) => HttpResponse.json({ data: { features } });

const analyzerListHandler = (...analyzers) =>
  http.get('*/analyzers/spatial', () => HttpResponse.json({ data: analyzers }));

const server = setupServer(
  analyzerListHandler(partiallyUnreachableGeofenceAnalyzer, badProximityAnalyzer, goodProximityAnalyzer),
  http.get(GOOD_GEOFENCE_LINK, () => spatialGroupResponse(makeSpatialFeature(polygonGeometry))),
  http.get(UNREACHABLE_GEOFENCE_LINK, () => new HttpResponse(null, { status: 500 })),
  http.get(MIXED_GEOFENCE_LINK, () => spatialGroupResponse(
    { features: null },
    makeSpatialFeature(polygonGeometry, 'usable-pk'),
  )),
  http.get(BAD_PROXIMITY_LINK, () => spatialGroupResponse(makeSpatialFeature(lineGeometry))),
  http.get(GOOD_PROXIMITY_LINK, () => spatialGroupResponse(makeSpatialFeature(pointGeometry))),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchAnalyzers', () => {
  let consoleWarnSpy;

  const dispatchedPayload = (dispatch) => {
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe(FETCH_ANALYZERS_SUCCESS);

    return dispatch.mock.calls[0][0].payload;
  };

  const warningsMatching = (pattern) => consoleWarnSpy.mock.calls.filter(([message]) => pattern.test(message));

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jest.restoreAllMocks();
  });

  test('an analyzer that cannot be processed does not prevent the others from being dispatched', async () => {
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    const dispatchedIds = dispatchedPayload(dispatch).analyzers.map(({ id }) => id);
    expect(dispatchedIds).toEqual(expect.arrayContaining(['geofence-id', 'good-proximity-id']));
    expect(dispatchedIds).not.toContain('bad-proximity-id');
  });

  test('describes each analyzer by the fields the sidebar and the map layers read', async () => {
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    const proximity = dispatchedPayload(dispatch).analyzers.find(({ id }) => id === 'good-proximity-id');
    expect(proximity).toEqual(expect.objectContaining({
      id: 'good-proximity-id',
      name: 'Good Proximity',
      type: 'proximity',
    }));

    const [feature] = proximity.geojson.features;
    expect(feature.id).toEqual(expect.any(Number));
    expect(feature.properties).toEqual(expect.objectContaining({
      admin_href: 'http://localhost/admin/good-proximity',
      analyzer_type: 'proximity',
      id: 'feature-pk',
      title: 'Good Proximity',
    }));
  });

  test('buffers a proximity feature into a polygon routed to the proximity map layer', async () => {
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    const proximity = dispatchedPayload(dispatch).analyzers.find(({ id }) => id === 'good-proximity-id');
    expect(proximity.geojson.features[0].properties.spatial_group).toBe('Polygon.proximity_group');
  });

  test('names the analyzer and the reason it could not be processed', async () => {
    await fetchAnalyzers()(jest.fn());

    const [warning, error] = warningsMatching(/Tourist Road Proximity - Line/)[0];
    expect(warning).toContain('bad-proximity-id');
    expect(warning).toContain('spatial group "proximity_group"');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('could not buffer LineString geometry by -1m');
  });

  test.each([0, -1])('reports a %sm trigger distance rather than shrinking the footprint', async (distance) => {
    server.use(analyzerListHandler({
      ...goodProximityAnalyzer,
      spatial_groups: { proximity_group: GOOD_GEOFENCE_LINK },
      threshold_dist_meters: distance,
    }));
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    expect(dispatchedPayload(dispatch).analyzers).toHaveLength(0);
    const [, error] = warningsMatching(/Good Proximity/)[0];
    expect(error.message).toBe(`could not buffer Polygon geometry by ${distance}m`);
  });

  test('falls back to the default display radius when no trigger distance is set', async () => {
    server.use(analyzerListHandler({ ...goodProximityAnalyzer, threshold_dist_meters: undefined }));
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    const [proximity] = dispatchedPayload(dispatch).analyzers;
    expect(proximity.geojson.features[0].geometry.type).toBe('Polygon');
  });

  test('a failed spatial group does not discard its sibling groups', async () => {
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    const geofence = dispatchedPayload(dispatch).analyzers.find(({ id }) => id === 'geofence-id');
    expect(geofence.geojson.features).toHaveLength(1);
    expect(geofence.geojson.features[0].properties.spatial_group).toBe('Polygon.warning_group');
    expect(warningsMatching(/spatial group "critical_group" of analyzer "Good Geofence"/)).toHaveLength(1);
  });

  test('a malformed feature entry does not discard the rest of its spatial group', async () => {
    server.use(analyzerListHandler(mixedGeofenceAnalyzer));
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    const [mixed] = dispatchedPayload(dispatch).analyzers;
    expect(mixed.geojson.features).toHaveLength(1);
    expect(mixed.geojson.features[0].properties.id).toBe('usable-pk');
    expect(warningsMatching(/Mixed Geofence/)).toHaveLength(1);
  });

  test('reports that something failed alongside the analyzers that survived', async () => {
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    expect(dispatchedPayload(dispatch).hasFailures).toBe(true);
  });

  test('reports no failures when every analyzer is usable', async () => {
    server.use(analyzerListHandler(goodProximityAnalyzer));
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    expect(dispatchedPayload(dispatch).hasFailures).toBe(false);
  });

  test('reports an unreachable analyzer list without throwing at the call site', async () => {
    server.use(http.get('*/analyzers/spatial', () => new HttpResponse(null, { status: 503 })));
    const dispatch = jest.fn((action) => action);

    await expect(fetchAnalyzers()(dispatch)).resolves.toEqual({ type: FETCH_ANALYZERS_ERROR });
  });

  test('reports an analyzer list response that carries no analyzers', async () => {
    server.use(http.get('*/analyzers/spatial', () => HttpResponse.json({ data: null })));
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    expect(dispatch).toHaveBeenCalledWith({ type: FETCH_ANALYZERS_ERROR });
  });

  test('a nullish entry in the analyzer list does not discard the rest of it', async () => {
    server.use(analyzerListHandler(null, goodProximityAnalyzer));
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    const { analyzers, hasFailures } = dispatchedPayload(dispatch);
    expect(analyzers.map(({ id }) => id)).toEqual(['good-proximity-id']);
    expect(hasFailures).toBe(true);
  });

  test('a cancelled request leaves the existing list alone and is not reported as a failure', async () => {
    const { get } = axios;
    jest.spyOn(axios, 'get').mockImplementation((url, config) => url === GOOD_PROXIMITY_LINK
      ? Promise.reject(new axios.CanceledError('canceled'))
      : get(url, config));
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    expect(dispatch).not.toHaveBeenCalled();
    expect(warningsMatching(/Good Proximity/)).toHaveLength(0);
  });

  test('a cancelled analyzer list request is not reported as a failure', async () => {
    const { get } = axios;
    jest.spyOn(axios, 'get').mockImplementation((url, config) => url === ANALYZERS_API_URL
      ? Promise.reject(new axios.CanceledError('canceled'))
      : get(url, config));
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('analyzersReducer', () => {
  const analyzer = { geojson: { features: [{}] }, id: 'a', name: 'A', type: 'geofence' };

  test('stores the analyzers a successful load produced', () => {
    const state = analyzersReducer(
      { data: [], hasFailures: false },
      { type: FETCH_ANALYZERS_SUCCESS, payload: { analyzers: [analyzer], hasFailures: false } }
    );

    expect(state).toEqual({ data: [analyzer], hasFailures: false });
  });

  test('keeps the analyzers already rendering when every one of them failed to load', () => {
    const state = analyzersReducer(
      { data: [analyzer], hasFailures: false },
      { type: FETCH_ANALYZERS_SUCCESS, payload: { analyzers: [], hasFailures: true } }
    );

    expect(state).toEqual({ data: [analyzer], hasFailures: true });
  });

  test('empties the list when the load succeeded and returned no analyzers', () => {
    const state = analyzersReducer(
      { data: [analyzer], hasFailures: false },
      { type: FETCH_ANALYZERS_SUCCESS, payload: { analyzers: [], hasFailures: false } }
    );

    expect(state).toEqual({ data: [], hasFailures: false });
  });

  test('flags a failure without discarding the analyzers already rendering', () => {
    const state = analyzersReducer({ data: [analyzer], hasFailures: false }, { type: FETCH_ANALYZERS_ERROR });

    expect(state).toEqual({ data: [analyzer], hasFailures: true });
  });
});
