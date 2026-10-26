import { MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../constants';

import {
  buildGearIndexFromRows,
  buildGearMapFeatureCollection,
  gearDisplayName,
  gearHumanReadableLabel,
  gearMatchesSearchQuery,
  getGearRepresentativeCoordinates,
  groupGearByManufacturer,
  GEAR_POINT_ROLE_SINGLE,
  GEAR_POINT_ROLE_TRAWL_END,
  mergeGearRowsIntoIndex,
  normalizeGearListPage,
  sortGearGroupsForSidebar,
  sortGearListForSidebar,
} from './gear';

describe('gear utils', () => {
  describe('normalizeGearListPage', () => {
    test('reads DRF paginated GET /gear page body', () => {
      const rows = [{ id: 'a' }];
      expect(normalizeGearListPage({ results: rows, next: 'http://x?page=2' }))
        .toEqual({ rows, hasNextPage: true });
      expect(normalizeGearListPage({ results: rows, next: null }))
        .toEqual({ rows, hasNextPage: false });
    });

    test('unwraps DAS { data: { results, next } } envelope', () => {
      const rows = [{ id: 'b' }];
      expect(normalizeGearListPage({
        data: { results: rows, next: 'http://x?page=2' },
      })).toEqual({ rows, hasNextPage: true });
      expect(normalizeGearListPage({ data: { results: rows, next: null } }))
        .toEqual({ rows, hasNextPage: false });
    });

    test('returns empty rows when body is missing results', () => {
      expect(normalizeGearListPage({})).toEqual({ rows: [], hasNextPage: false });
      expect(normalizeGearListPage(null)).toEqual({ rows: [], hasNextPage: false });
    });
  });

  describe('buildGearIndexFromRows / mergeGearRowsIntoIndex', () => {
    test('buildGearIndexFromRows preserves order and overwrites by id', () => {
      const rows = [{ id: '1', name: 'a' }, { id: '2', name: 'b' }, { id: '1', name: 'c' }];
      const { allIds, byId } = buildGearIndexFromRows(rows);
      expect(allIds).toEqual(['1', '2']);
      expect(byId['1'].name).toBe('c');
    });

    test('mergeGearRowsIntoIndex appends new ids only', () => {
      const merged = mergeGearRowsIntoIndex(['1'], { 1: { id: '1' } }, [{ id: '2' }, { id: '1', x: 1 }]);
      expect(merged.allIds).toEqual(['1', '2']);
      expect(merged.byId['1']).toEqual({ id: '1', x: 1 });
      expect(merged.byId['2']).toEqual({ id: '2' });
    });
  });

  describe('buildGearMapFeatureCollection', () => {
    test('builds a Point for single valid device', () => {
      const fc = buildGearMapFeatureCollection([{
        id: 'g1',
        display_id: 'Set-A',
        devices: [{ location: { latitude: 1, longitude: 2 } }],
      }], []);
      expect(fc.features).toHaveLength(1);
      expect(fc.features[0].geometry.type).toBe('Point');
      expect(fc.features[0].geometry.coordinates).toEqual([2, 1]);
      expect(fc.features[0].properties.gearPointRole).toBe(GEAR_POINT_ROLE_SINGLE);
      expect(fc.features[0].properties.display_title).toBe('Set-A');
    });

    test('uses hardware-style label when display_id is a UUID', () => {
      const uuid = 'b7983b60-392f-46cf-be21-2f84ee48d571';
      const fc = buildGearMapFeatureCollection([{
        id: 'g1',
        display_id: uuid,
        devices: [{
          mfr_device_id: '88CE99E8F7_longtail',
          location: { latitude: 1, longitude: 2 },
        }],
      }], []);
      expect(fc.features[0].properties.display_title).toBe('88CE99E8F7');
      expect(fc.features[0].properties.display_id).toBe(uuid);
    });

    test('builds a LineString plus a Point per device for multiple devices in API order', () => {
      const fc = buildGearMapFeatureCollection([{
        id: 'g2',
        display_id: 'Trawl',
        devices: [
          { location: { latitude: 0, longitude: 0 } },
          { location: { latitude: 1, longitude: 1 } },
        ],
      }], []);
      expect(fc.features).toHaveLength(3);
      const line = fc.features.find((f) => f.geometry.type === 'LineString');
      const points = fc.features.filter((f) => f.geometry.type === 'Point');
      expect(line.geometry.coordinates).toEqual([[0, 0], [1, 1]]);
      expect(points).toHaveLength(2);
      expect(points.every((p) => p.properties.gearPointRole === GEAR_POINT_ROLE_TRAWL_END)).toBe(true);
      expect(points.map((p) => p.geometry.coordinates)).toEqual([[0, 0], [1, 1]]);
    });

    test('builds a Point for each vertex on a three-device trawl (including the middle)', () => {
      const fc = buildGearMapFeatureCollection([{
        id: 'g3',
        display_id: 'Trawl-3',
        devices: [
          { location: { latitude: 0, longitude: 0 } },
          { location: { latitude: 1, longitude: 1 } },
          { location: { latitude: 2, longitude: 2 } },
        ],
      }], []);
      expect(fc.features).toHaveLength(4);
      const points = fc.features.filter((f) => f.geometry.type === 'Point');
      expect(points).toHaveLength(3);
      expect(points.map((p) => p.geometry.coordinates)).toEqual([[0, 0], [1, 1], [2, 2]]);
    });

    test('omits hidden gear ids', () => {
      const fc = buildGearMapFeatureCollection([{ id: 'x', devices: [{ location: { latitude: 0, longitude: 0 } }] }], ['x']);
      expect(fc.features).toHaveLength(0);
    });
  });

  describe('gearHumanReadableLabel', () => {
    test('returns non-UUID display_id as-is', () => {
      expect(gearHumanReadableLabel({ display_id: 'Set-A', devices: [] })).toBe('Set-A');
    });

    test('uses first segment of mfr_device_id when display_id looks like a UUID', () => {
      expect(gearHumanReadableLabel({
        display_id: 'b7983b60-392f-46cf-be21-2f84ee48d571',
        devices: [{ mfr_device_id: '88CE99E8F7_suffix' }],
      })).toBe('88CE99E8F7');
    });
  });

  describe('gearDisplayName', () => {
    test('matches human-readable label', () => {
      expect(gearDisplayName({ display_id: 'ABC' })).toBe('ABC');
    });
  });

  describe('groupGearByManufacturer', () => {
    test('sorts manufacturers and items within each group', () => {
      const groups = groupGearByManufacturer([
        { id: '1', manufacturer: 'Beta', display_id: 'b' },
        { id: '2', manufacturer: 'Alpha', display_id: 'z' },
        { id: '3', manufacturer: 'Alpha', display_id: 'a' },
        { id: '4', manufacturer: '', display_id: 'solo' },
      ]);
      expect(groups.map((g) => g.manufacturerKey)).toEqual(['Alpha', 'Beta', '']);
      expect(groups[0].items.map((x) => x.id)).toEqual(['3', '2']);
      expect(groups[1].items.map((x) => x.id)).toEqual(['1']);
      expect(groups[2].items.map((x) => x.id)).toEqual(['4']);
    });
  });

  describe('gearMatchesSearchQuery', () => {
    test('matches manufacturer and UUID display_id', () => {
      const gear = {
        display_id: 'b7983b60-392f-46cf-be21-2f84ee48d571',
        manufacturer: 'EdgeTech',
        devices: [{ mfr_device_id: '88CE99E8F7_x' }],
      };
      expect(gearMatchesSearchQuery(gear, 'edge')).toBe(true);
      expect(gearMatchesSearchQuery(gear, 'b7983b60')).toBe(true);
      expect(gearMatchesSearchQuery(gear, '88CE')).toBe(true);
      expect(gearMatchesSearchQuery(gear, 'nomatch')).toBe(false);
    });
  });

  describe('sortGearListForSidebar', () => {
    test('sorts alphabetically', () => {
      const list = [
        { id: 'b', display_id: 'Bravo' },
        { id: 'a', display_id: 'Alpha' },
      ];
      const sorted = sortGearListForSidebar(
        list,
        MAP_LAYER_SORT_VALUES.ALPHABETICAL,
        SORT_DIRECTION.down,
      );
      expect(sorted.map((g) => g.id)).toEqual(['a', 'b']);
    });

    test('sorts by last_updated (newer first when sort down)', () => {
      const list = [
        { id: 'old', display_id: 'O', last_updated: '2020-01-01T00:00:00Z' },
        { id: 'new', display_id: 'N', last_updated: '2024-06-01T12:00:00Z' },
      ];
      const sorted = sortGearListForSidebar(
        list,
        MAP_LAYER_SORT_VALUES.LAST_UPDATE,
        SORT_DIRECTION.down,
      );
      expect(sorted.map((g) => g.id)).toEqual(['new', 'old']);
    });
  });

  describe('sortGearGroupsForSidebar', () => {
    test('orders manufacturer groups by newest item when sorting by last update', () => {
      const groups = groupGearByManufacturer([
        { id: 'a1', manufacturer: 'MfrA', display_id: 'x', last_updated: '2020-01-01T00:00:00Z' },
        { id: 'b1', manufacturer: 'MfrB', display_id: 'y', last_updated: '2025-01-01T00:00:00Z' },
      ]);
      const sorted = sortGearGroupsForSidebar(
        groups,
        MAP_LAYER_SORT_VALUES.LAST_UPDATE,
        SORT_DIRECTION.down,
      );
      expect(sorted.map((g) => g.manufacturerKey)).toEqual(['MfrB', 'MfrA']);
    });
  });

  describe('getGearRepresentativeCoordinates', () => {
    test('returns null when no device locations', () => {
      expect(getGearRepresentativeCoordinates({ devices: [] })).toBeNull();
      expect(getGearRepresentativeCoordinates(null)).toBeNull();
    });

    test('returns [lng, lat] for a single device', () => {
      expect(getGearRepresentativeCoordinates({
        devices: [{ location: { latitude: 1, longitude: 2 } }],
      })).toEqual([2, 1]);
    });

    test('returns centroid for multiple devices', () => {
      expect(getGearRepresentativeCoordinates({
        devices: [
          { location: { latitude: 0, longitude: 0 } },
          { location: { latitude: 2, longitude: 4 } },
        ],
      })).toEqual([2, 1]);
    });
  });
});
