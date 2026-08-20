import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { fetchAnalyzers, FETCH_ANALYZERS_SUCCESS } from './analyzers';

const GOOD_GEOFENCE_LINK = 'http://localhost/spatial-group/good-geofence';
const UNREACHABLE_GEOFENCE_LINK = 'http://localhost/spatial-group/unreachable-geofence';
const MIXED_PROXIMITY_LINK = 'http://localhost/spatial-group/mixed-proximity';
const BAD_PROXIMITY_LINK = 'http://localhost/spatial-group/bad-proximity';
const GOOD_PROXIMITY_LINK = 'http://localhost/spatial-group/good-proximity';

const lineGeometry = { type: 'LineString', coordinates: [[0, 0], [1, 1]] };
const pointGeometry = { type: 'Point', coordinates: [2, 2] };
const polygonGeometry = { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] };

const makeSpatialFeature = (geometry, pk = 'feature-pk') => ({
  features: [{ type: 'Feature', geometry, properties: { pk } }],
});

// a geofence whose `critical` spatial group can't be fetched at all: its
// `warning` group is still usable and the analyzer should survive on it
const partiallyUnreachableGeofenceAnalyzer = {
  id: 'geofence-id',
  name: 'Good Geofence',
  analyzer_category: 'geofence',
  admin_href: 'http://localhost/admin/geofence',
  spatial_groups: { warning: GOOD_GEOFENCE_LINK, critical: UNREACHABLE_GEOFENCE_LINK, unset: null },
};

// the real-world ERA-13536 failure: a negative trigger distance over a line
// geometry, which can't be buffered into a display footprint
const badProximityAnalyzer = {
  id: 'bad-proximity-id',
  name: 'Tourist Road Proximity - Line',
  analyzer_category: 'proximity',
  admin_href: 'http://localhost/admin/bad-proximity',
  threshold_dist_meters: -1.0,
  spatial_groups: { warning: BAD_PROXIMITY_LINK },
};

// same bad trigger distance, but its spatial group also holds a polygon, which
// a negative distance simply shrinks rather than making unbufferable
const mixedProximityAnalyzer = {
  ...badProximityAnalyzer,
  id: 'mixed-proximity-id',
  name: 'Mixed Proximity',
  spatial_groups: { warning: MIXED_PROXIMITY_LINK },
};

const goodProximityAnalyzer = {
  id: 'good-proximity-id',
  name: 'Good Proximity',
  analyzer_category: 'proximity',
  admin_href: 'http://localhost/admin/good-proximity',
  threshold_dist_meters: 500,
  spatial_groups: { warning: GOOD_PROXIMITY_LINK },
};

const spatialGroupResponse = (...features) => HttpResponse.json({ data: { features } });

const analyzerListHandler = (...analyzers) =>
  http.get('*/analyzers/spatial', () => HttpResponse.json({ data: analyzers }));

const server = setupServer(
  analyzerListHandler(partiallyUnreachableGeofenceAnalyzer, badProximityAnalyzer, goodProximityAnalyzer),
  http.get(GOOD_GEOFENCE_LINK, () => spatialGroupResponse(makeSpatialFeature(polygonGeometry))),
  http.get(UNREACHABLE_GEOFENCE_LINK, () => new HttpResponse(null, { status: 500 })),
  http.get(BAD_PROXIMITY_LINK, () => spatialGroupResponse(makeSpatialFeature(lineGeometry))),
  http.get(MIXED_PROXIMITY_LINK, () => spatialGroupResponse(
    makeSpatialFeature(lineGeometry, 'unbufferable-pk'),
    makeSpatialFeature(polygonGeometry, 'bufferable-pk'),
  )),
  http.get(GOOD_PROXIMITY_LINK, () => spatialGroupResponse(makeSpatialFeature(pointGeometry))),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchAnalyzers', () => {
  let consoleWarnSpy;

  const dispatchedAnalyzers = (dispatch) => {
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

    const dispatchedIds = dispatchedAnalyzers(dispatch).map(({ id }) => id);
    expect(dispatchedIds).toEqual(expect.arrayContaining(['geofence-id', 'good-proximity-id']));
    expect(dispatchedIds).not.toContain('bad-proximity-id');
  });

  test('names the analyzer and the reason it could not be processed', async () => {
    await fetchAnalyzers()(jest.fn());

    const [warning, error] = warningsMatching(/Tourist Road Proximity - Line/)[0];
    expect(warning).toContain('bad-proximity-id');
    expect(warning).toContain('spatial group "warning"');
    // assert the failure contract explicitly: a proximity analyzer whose
    // geometry cannot be buffered is reported as such, rather than the test
    // silently depending on whatever turf happens to return for this input
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('could not buffer LineString geometry by -1m');
  });

  test('a failed spatial group does not discard its sibling groups', async () => {
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    const geofence = dispatchedAnalyzers(dispatch).find(({ id }) => id === 'geofence-id');
    expect(geofence.geojson.features).toHaveLength(1);
    expect(geofence.geojson.features[0].properties.spatial_group).toBe('Polygon.warning');
    expect(warningsMatching(/spatial group "critical" of analyzer "Good Geofence"/)).toHaveLength(1);
  });

  test('an unusable feature does not discard the rest of its spatial group', async () => {
    server.use(analyzerListHandler(mixedProximityAnalyzer));
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    const [mixed] = dispatchedAnalyzers(dispatch);
    expect(mixed.geojson.features).toHaveLength(1);
    expect(mixed.geojson.features[0].properties.id).toBe('bufferable-pk');
    expect(warningsMatching(/Mixed Proximity/)).toHaveLength(1);
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
});
