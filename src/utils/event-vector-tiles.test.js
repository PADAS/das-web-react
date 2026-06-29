import { booleanPointInPolygon, point, polygon } from '@turf/turf';

import {
  buildEventTimeSliderFadeColor,
  buildEventTimeSliderHideFilter,
  buildEventTypeValueMap,
  interiorPointOnSurface,
  isFeatureVisibleAtVirtualDate,
  normalizeTileEventFeature,
  resolveEventTimeSliderParameters,
  TIME_SLIDER_DEFAULT_LABEL_COLOR,
} from './event-vector-tiles';

describe('utils - Event vector tiles', () => {
  describe('resolveEventTimeSliderParameters', () => {
    const dateRange = { lower: '2026-06-01T00:00:00.000Z', upper: '2026-06-25T00:00:00.000Z' };

    test('returns inactive when the slider is off', () => {
      expect(resolveEventTimeSliderParameters({ active: false, virtualDate: null }, dateRange))
        .toEqual({ active: false });
    });

    test('falls back to now when active without a virtual date (parity with the flag-OFF path)', () => {
      const parameters = resolveEventTimeSliderParameters({ active: true, virtualDate: null }, dateRange);

      expect(parameters.active).toBe(true);
      expect(typeof parameters.virtualDateMs).toBe('number');
      expect(typeof parameters.virtualDateIso).toBe('string');
    });

    test('returns the normalized iso/ms and the filter-range length when active', () => {
      const parameters = resolveEventTimeSliderParameters(
        { active: true, virtualDate: '2026-06-20T00:00:00.000Z' },
        dateRange
      );

      expect(parameters).toEqual({
        active: true,
        virtualDateIso: '2026-06-20T00:00:00.000Z',
        virtualDateMs: new Date('2026-06-20T00:00:00.000Z').getTime(),
        totalRangeDistance: new Date(dateRange.upper) - new Date(dateRange.lower),
      });
    });
  });

  describe('buildEventTimeSliderHideFilter', () => {
    test('returns null when inactive', () => {
      expect(buildEventTimeSliderHideFilter(false)).toBeNull();
    });

    test('keeps events at or before the virtual date when active', () => {
      expect(buildEventTimeSliderHideFilter(true, '2026-06-20T00:00:00.000Z')).toEqual(
        ['<=', ['coalesce', ['get', 'event_time_iso'], ''], '2026-06-20T00:00:00.000Z']
      );
    });
  });

  describe('buildEventTypeValueMap', () => {
    test('indexes event types by value and tolerates a missing list', () => {
      const map = buildEventTypeValueMap([
        { value: 'fire', icon_id: 'fire-icon', display: 'Fire' },
        { icon_id: 'no-value' },
      ]);

      expect(map.get('fire')).toEqual({ value: 'fire', icon_id: 'fire-icon', display: 'Fire' });
      expect(map.size).toBe(1);
      expect(buildEventTypeValueMap(undefined).size).toBe(0);
    });
  });

  describe('normalizeTileEventFeature', () => {
    const valueMap = buildEventTypeValueMap([{ value: 'fire', icon_id: 'fire-icon', display: 'Fire' }]);

    test('keys on `id` by default (point events)', () => {
      const feature = point([0, 0], { id: 'point-id', event_id: 'should-be-ignored', event_type_value: 'fire' });

      expect(normalizeTileEventFeature(feature, valueMap).properties.id).toBe('point-id');
    });

    test('keys on `event_id` when idField is event_id (polygon centroids/geometries)', () => {
      // On the centroid layer `id` is the EventGeometry id; the normalized feature must carry the
      // real event id so clustering/click/exclusion treat it like the underlying event.
      const feature = point([0, 0], { id: 'geometry-id', event_id: 'evt-id', event_type_value: 'fire' });

      expect(normalizeTileEventFeature(feature, valueMap, { idField: 'event_id' }).properties.id).toBe('evt-id');
    });

    test('resolves icon_id/display_title/event_type/updated_at from tile fields', () => {
      const feature = point([0, 0], {
        id: 'a',
        event_type_value: 'fire',
        priority: 200,
        title: 'Burn',
        event_time_display: 'Jun 10, 00:00 UTC',
        updated_at_iso: '2026-06-10T00:00:00.000Z',
      });

      const { properties } = normalizeTileEventFeature(feature, valueMap);

      expect(properties.icon_id).toBe('fire-icon');
      expect(properties.display_title).toBe('Burn\nJun 10, 00:00 UTC');
      expect(properties.event_type).toBe('fire');
      expect(properties.updated_at).toBe('2026-06-10T00:00:00.000Z');
    });

    test('uses the type display when there is no title, generic icon when type is unknown', () => {
      const titled = normalizeTileEventFeature(
        point([0, 0], { id: 'a', event_type_value: 'fire' }),
        valueMap
      );
      expect(titled.properties.display_title).toBe('Fire');

      const unknown = normalizeTileEventFeature(
        point([0, 0], { id: 'b', event_type_value: 'mystery' }),
        valueMap
      );
      expect(unknown.properties.icon_id).toBe('generic');
    });

    test('does not prepend a blank line to display_title when there is no title or type display', () => {
      const { properties } = normalizeTileEventFeature(
        point([0, 0], { id: 'a', event_type_value: 'mystery', event_time_display: 'Jun 10, 00:00 UTC' }),
        valueMap
      );

      expect(properties.display_title).toBe('Jun 10, 00:00 UTC');
    });

    test('display_title is just the title when there is no timestamp', () => {
      const { properties } = normalizeTileEventFeature(
        point([0, 0], { id: 'a', event_type_value: 'fire' }),
        valueMap
      );

      expect(properties.display_title).toBe('Fire');
    });

    test('captures geometry exposed as a getter (querySourceFeatures returns Mapbox Feature objects)', () => {
      const geometry = { type: 'Point', coordinates: [1, 2] };
      const mapboxLikeFeature = {
        type: 'Feature',
        properties: { id: 'a', event_type_value: 'fire', priority: 200 },
        get geometry() { return geometry; },
      };

      const normalized = normalizeTileEventFeature(mapboxLikeFeature, valueMap);

      expect(normalized.geometry).toEqual(geometry);
      expect(Object.prototype.hasOwnProperty.call(normalized, 'geometry')).toBe(true);
    });
  });

  describe('interiorPointOnSurface', () => {
    test('returns the centre for a convex polygon (matches centerOfMass there)', () => {
      const square = polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);

      expect(interiorPointOnSurface(square).geometry.coordinates).toEqual([0.5, 0.5]);
    });

    test('returns a point INSIDE a concave (U-shaped) polygon, unlike centerOfMass', () => {
      // centerOfMass lands in the notch (outside); the interior point must be inside an arm.
      const u = polygon([[[0, 0], [3, 0], [3, 3], [2, 3], [2, 1], [1, 1], [1, 3], [0, 3], [0, 0]]]);

      const result = interiorPointOnSurface(u);
      expect(booleanPointInPolygon(result, u)).toBe(true);
    });

    test('returns a point INSIDE the ring of a donut polygon (not in the hole)', () => {
      const donut = polygon([
        [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
        [[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]],
      ]);

      const result = interiorPointOnSurface(donut);
      expect(booleanPointInPolygon(result, donut)).toBe(true);
    });

    test('accepts a bare geometry as well as a Feature', () => {
      const geometry = { type: 'Polygon', coordinates: [[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]] };

      expect(interiorPointOnSurface(geometry).geometry.coordinates).toEqual([1, 1]);
    });

    test('falls back to the first vertex for a degenerate (zero-area) ring', () => {
      const degenerate = { type: 'Polygon', coordinates: [[[5, 7], [5, 7], [5, 7]]] };

      expect(interiorPointOnSurface(degenerate).geometry.coordinates).toEqual([5, 7]);
    });

    test('returns null (not a [0,0] anchor) for missing/empty geometry', () => {
      expect(interiorPointOnSurface(undefined)).toBeNull();
      expect(interiorPointOnSurface({ type: 'Polygon', coordinates: [] })).toBeNull();
      expect(interiorPointOnSurface({ geometry: { type: 'Polygon', coordinates: [[]] } })).toBeNull();
    });

    test('returns null for a non-Polygon geometry (e.g. MultiPolygon) rather than misreading it', () => {
      const multi = { type: 'MultiPolygon', coordinates: [[[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]] };

      expect(interiorPointOnSurface(multi)).toBeNull();
    });
  });

  describe('isFeatureVisibleAtVirtualDate', () => {
    const feature = (event_time_iso) => point([0, 0], { event_time_iso });

    test('keeps everything when the slider is inactive', () => {
      expect(isFeatureVisibleAtVirtualDate(feature('2030-01-01T00:00:00.000Z'), { active: false })).toBe(true);
    });

    test('hides events after the virtual date and keeps timeless events', () => {
      const params = { active: true, virtualDateIso: '2026-06-10T00:00:00.000Z' };
      expect(isFeatureVisibleAtVirtualDate(feature('2026-06-05T00:00:00.000Z'), params)).toBe(true);
      expect(isFeatureVisibleAtVirtualDate(feature('2026-06-30T00:00:00.000Z'), params)).toBe(false);
      expect(isFeatureVisibleAtVirtualDate(feature(undefined), params)).toBe(true);
    });
  });

  describe('buildEventTimeSliderFadeColor', () => {
    test('returns the default label color when inactive', () => {
      expect(buildEventTimeSliderFadeColor(false)).toBe(TIME_SLIDER_DEFAULT_LABEL_COLOR);
    });

    test('returns the default label color when the range length is zero', () => {
      expect(buildEventTimeSliderFadeColor(true, 0, 1000))
        .toBe(TIME_SLIDER_DEFAULT_LABEL_COLOR);
    });

    test('interpolates on the event age when active, guarding features without event_time_ms', () => {
      expect(buildEventTimeSliderFadeColor(true, 10000, 5000)).toEqual([
        'case',
        ['has', 'event_time_ms'],
        [
          'interpolate',
          ['linear'],
          ['/', ['abs', ['-', 5000, ['get', 'event_time_ms']]], 10000],
          0, 'rgba(255, 255, 126, 1)',
          0.3, TIME_SLIDER_DEFAULT_LABEL_COLOR,
        ],
        TIME_SLIDER_DEFAULT_LABEL_COLOR,
      ]);
    });
  });
});
