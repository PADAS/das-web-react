import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { fetchAnalyzers, FETCH_ANALYZERS_SUCCESS } from './analyzers';

const GOOD_GEOFENCE_LINK = 'http://localhost/spatial-group/good-geofence';
const BAD_PROXIMITY_LINK = 'http://localhost/spatial-group/bad-proximity';
const GOOD_PROXIMITY_LINK = 'http://localhost/spatial-group/good-proximity';

const makeSpatialFeature = (geometry) => ({
  features: [{
    type: 'Feature',
    geometry,
    properties: { pk: 'feature-pk' },
  }],
});

const goodGeofenceAnalyzer = {
  id: 'geofence-id',
  name: 'Good Geofence',
  analyzer_category: 'geofence',
  admin_href: 'http://localhost/admin/geofence',
  spatial_groups: { warning: GOOD_GEOFENCE_LINK },
};

// negative threshold over a line geometry: buffer() returns undefined, so
// reading proximityPoly.geometry throws a TypeError for this analyzer only
const badProximityAnalyzer = {
  id: 'bad-proximity-id',
  name: 'Tourist Road Proximity - Line',
  analyzer_category: 'proximity',
  admin_href: 'http://localhost/admin/bad-proximity',
  threshold_dist_meters: -1.0,
  spatial_groups: { warning: BAD_PROXIMITY_LINK },
};

const goodProximityAnalyzer = {
  id: 'good-proximity-id',
  name: 'Good Proximity',
  analyzer_category: 'proximity',
  admin_href: 'http://localhost/admin/good-proximity',
  threshold_dist_meters: 500,
  spatial_groups: { warning: GOOD_PROXIMITY_LINK },
};

const lineGeometry = {
  type: 'LineString',
  coordinates: [[0, 0], [1, 1]],
};

const pointGeometry = {
  type: 'Point',
  coordinates: [2, 2],
};

const polygonGeometry = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
};

const server = setupServer(
  http.get('*/analyzers/spatial', () => HttpResponse.json({
    data: [goodGeofenceAnalyzer, badProximityAnalyzer, goodProximityAnalyzer],
  })),
  http.get(GOOD_GEOFENCE_LINK, () => HttpResponse.json({
    data: { features: [makeSpatialFeature(polygonGeometry)] },
  })),
  http.get(BAD_PROXIMITY_LINK, () => HttpResponse.json({
    data: { features: [makeSpatialFeature(lineGeometry)] },
  })),
  http.get(GOOD_PROXIMITY_LINK, () => HttpResponse.json({
    data: { features: [makeSpatialFeature(pointGeometry)] },
  })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchAnalyzers', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  test('a single failing analyzer does not prevent the others from being dispatched', async () => {
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);

    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe(FETCH_ANALYZERS_SUCCESS);

    const dispatchedIds = action.payload.map(item => item.id);
    expect(dispatchedIds).toEqual(expect.arrayContaining(['geofence-id', 'good-proximity-id']));
    expect(dispatchedIds).not.toContain('bad-proximity-id');
  });

  test('logs a console.warn including the failed analyzer name and id', async () => {
    const dispatch = jest.fn();

    await fetchAnalyzers()(dispatch);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    const warning = consoleWarnSpy.mock.calls[0][0];
    expect(warning).toContain('Tourist Road Proximity - Line');
    expect(warning).toContain('bad-proximity-id');
    expect(consoleWarnSpy.mock.calls[0][1]).toBeInstanceOf(Error);
  });
});
