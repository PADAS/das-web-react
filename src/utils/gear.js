import { featureCollection } from '@turf/turf';

import { GEAR_FEATURE_CONTENT_TYPE, MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../constants';

/** Point layer styling: single-device vs trawl endpoints (see GearLayer). */
export const GEAR_POINT_ROLE_SINGLE = 'single';
export const GEAR_POINT_ROLE_TRAWL_END = 'trawl_end';

/**
 * One page from GET /api/v1.0/gear — DRF pagination: { count, next, previous, results }.
 * DAS wraps list payloads in `{ data: { … } }` like other v1 endpoints; accept either shape.
 */
export const normalizeGearListPage = (body) => {
  const page = body?.data ?? body;
  return {
    hasNextPage: Boolean(page?.next),
    rows: Array.isArray(page?.results) ? page.results : [],
  };
};

/**
 * Stable { allIds, byId } from an array of gear rows (order preserved on first sighting).
 */
export const buildGearIndexFromRows = (gearRows) => {
  const byId = {};
  const allIds = [];
  (gearRows || []).forEach((row) => {
    if (!row?.id) return;
    const id = row.id;
    if (!byId[id]) {
      allIds.push(id);
    }
    byId[id] = row;
  });
  return { allIds, byId };
};

/** Append/replace rows into an existing id-ordered index (pagination during first load). */
export const mergeGearRowsIntoIndex = (priorAllIds, priorById, incomingRows) => {
  const byId = { ...priorById };
  const allIds = [...priorAllIds];
  const existing = new Set(allIds);
  (incomingRows || []).forEach((row) => {
    if (!row?.id) return;
    if (!existing.has(row.id)) {
      existing.add(row.id);
      allIds.push(row.id);
    }
    byId[row.id] = row;
  });
  return { allIds, byId };
};

/** UUID v4-style (loose) — API often uses this for gear.display_id while hardware id lives on devices. */
const GEAR_DISPLAY_ID_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Operator-facing short label: non-UUID display_id, else first segment of mfr_device_id (e.g. "88CE99E8F7"),
 * else raw display_id / gear id. Aligns with legacy subject popup naming (manufacturer serial / short id).
 */
export const gearHumanReadableLabel = (gear) => {
  if (!gear) return '';
  const rawDisplay = gear.display_id != null ? String(gear.display_id).trim() : '';
  if (rawDisplay && !GEAR_DISPLAY_ID_UUID_RE.test(rawDisplay)) {
    return rawDisplay;
  }
  const firstMfr = (gear.devices || []).find((d) => d?.mfr_device_id != null && String(d.mfr_device_id).trim());
  const mfr = firstMfr?.mfr_device_id != null ? String(firstMfr.mfr_device_id).trim() : '';
  if (mfr) {
    const head = mfr.split('_')[0];
    return head || mfr;
  }
  return rawDisplay || (gear.id != null ? String(gear.id) : '');
};

/** Sidebar list title and default search/display string (human label). */
export const gearDisplayName = (gear) => gearHumanReadableLabel(gear);

/** Case-insensitive match for filter box (label, ids, manufacturer, device fields). */
export const gearMatchesSearchQuery = (gear, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const parts = [
    gearHumanReadableLabel(gear),
    gear?.display_id,
    gear?.id,
    gear?.manufacturer,
    ...(gear?.devices || []).flatMap((d) => [
      d?.mfr_device_id,
      d?.device_id,
      d?.label,
    ]),
  ].filter((p) => p != null && String(p).trim() !== '').map((p) => String(p).toLowerCase());
  return parts.some((p) => p.includes(q));
};

/**
 * Buckets gear for sidebar UI: manufacturers A→Z, items sorted by {@link gearHumanReadableLabel}.
 * Missing/blank manufacturer uses `manufacturerKey: ''` (show a translated "Other" label in UI).
 */
export const groupGearByManufacturer = (gearList) => {
  const map = new Map();
  (gearList || []).forEach((gearItem) => {
    const raw = gearItem?.manufacturer != null ? String(gearItem.manufacturer).trim() : '';
    const key = raw;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(gearItem);
  });

  const byLabel = (left, right) => gearHumanReadableLabel(left).localeCompare(
    gearHumanReadableLabel(right),
    undefined,
    { numeric: true, sensitivity: 'base' },
  );

  return [...map.entries()]
    .map(([manufacturerKey, items]) => ({
      manufacturerKey,
      items: [...items].sort(byLabel),
    }))
    .sort((a, b) => {
      const aEmpty = a.manufacturerKey === '';
      const bEmpty = b.manufacturerKey === '';
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
      return a.manufacturerKey.localeCompare(b.manufacturerKey, undefined, { sensitivity: 'base' });
    });
};

/** Ms since epoch from `gear.last_updated`, or null if missing/invalid. */
export const getGearLastUpdatedMs = (gear) => {
  if (!gear?.last_updated) return null;
  const epochMs = new Date(gear.last_updated).getTime();
  return Number.isNaN(epochMs) ? null : epochMs;
};

const maxGearLastUpdatedMs = (gearList) => {
  let best = null;
  (gearList || []).forEach((gearItem) => {
    const epochMs = getGearLastUpdatedMs(gearItem);
    if (epochMs != null && (best == null || epochMs > best)) best = epochMs;
  });
  return best;
};

export const compareGearAlphabetically = (sortDirection) => (left, right) => {
  const leftVal = gearHumanReadableLabel(left).toLowerCase();
  const rightVal = gearHumanReadableLabel(right).toLowerCase();
  if (leftVal > rightVal) return sortDirection === SORT_DIRECTION.down ? 1 : -1;
  if (leftVal < rightVal) return sortDirection === SORT_DIRECTION.down ? -1 : 1;
  return 0;
};

export const compareGearByLastUpdated = (sortDirection) => (left, right) => {
  const leftTime = getGearLastUpdatedMs(left);
  const rightTime = getGearLastUpdatedMs(right);
  if (leftTime == null) return 1;
  if (rightTime == null) return -1;
  if (rightTime > leftTime) return sortDirection === SORT_DIRECTION.down ? 1 : -1;
  if (rightTime < leftTime) return sortDirection === SORT_DIRECTION.down ? -1 : 1;
  return 0;
};

export const compareGearManufacturerGroups = (sortBy, sortDirection) => (firstGroup, secondGroup) => {
  if (sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE) {
    const ma = maxGearLastUpdatedMs(firstGroup.items);
    const mb = maxGearLastUpdatedMs(secondGroup.items);
    if (ma == null) return 1;
    if (mb == null) return -1;
    if (mb > ma) return sortDirection === SORT_DIRECTION.down ? 1 : -1;
    if (mb < ma) return sortDirection === SORT_DIRECTION.down ? -1 : 1;
    return 0;
  }
  const firstEmpty = firstGroup.manufacturerKey === '';
  const secondEmpty = secondGroup.manufacturerKey === '';
  if (firstEmpty !== secondEmpty) return firstEmpty ? 1 : -1;
  const firstVal = firstGroup.manufacturerKey.toLowerCase();
  const secondVal = secondGroup.manufacturerKey.toLowerCase();
  if (firstVal > secondVal) return sortDirection === SORT_DIRECTION.down ? 1 : -1;
  if (firstVal < secondVal) return sortDirection === SORT_DIRECTION.down ? -1 : 1;
  return 0;
};

/** Flat gear list sorted like Map Layers subject list (alphabetical or last update). */
export const sortGearListForSidebar = (gearList, sortBy, sortDirection) => {
  const itemCompare = sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE
    ? compareGearByLastUpdated(sortDirection)
    : compareGearAlphabetically(sortDirection);
  return [...(gearList || [])].sort(itemCompare);
};

/**
 * Manufacturer groups with per-group item order and group order (Map Layers preferences).
 */
export const sortGearGroupsForSidebar = (groups, sortBy, sortDirection) => {
  const itemCompare = sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE
    ? compareGearByLastUpdated(sortDirection)
    : compareGearAlphabetically(sortDirection);
  const groupCompare = compareGearManufacturerGroups(sortBy, sortDirection);

  return [...groups]
    .map((g) => ({
      ...g,
      items: [...g.items].sort(itemCompare),
    }))
    .sort(groupCompare);
};

/**
 * Build GeoJSON for map rendering from /api/v1.0/gear list rows.
 * Device order from the API defines LineString vertex order. Each device with a valid
 * location gets a Point so multi-device trawls show a marker at every unit (not only
 * the first and last vertices).
 */
export const buildGearMapFeatureCollection = (gearList, hiddenGearIds) => {
  const hidden = new Set(hiddenGearIds || []);
  const features = [];

  (gearList || []).forEach((gear) => {
    if (!gear?.id || hidden.has(gear.id)) return;

    const coords = (gear.devices || [])
      .map((d) => d?.location)
      .filter((loc) => loc != null
        && loc.latitude != null
        && loc.longitude != null)
      .map((loc) => [loc.longitude, loc.latitude]);

    if (!coords.length) return;

    const label = gearHumanReadableLabel(gear);
    const baseProps = {
      id: gear.id,
      content_type: GEAR_FEATURE_CONTENT_TYPE,
      display_id: gear.display_id,
      display_title: label,
      name: label,
      manufacturer: gear.manufacturer,
      gear_type: gear.type,
    };

    if (coords.length === 1) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords[0] },
        properties: { ...baseProps, gearPointRole: GEAR_POINT_ROLE_SINGLE },
      });
      return;
    }

    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: { ...baseProps },
    });

    const trawlVertexProps = { ...baseProps, gearPointRole: GEAR_POINT_ROLE_TRAWL_END };
    coords.forEach((c) => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: c },
        properties: trawlVertexProps,
      });
    });
  });

  return featureCollection(features);
};

/**
 * GeoJSON-style [longitude, latitude] for LocationJumpButton / map fly-to, or null.
 * Uses the centroid of device locations when multiple are present.
 */
export const getGearRepresentativeCoordinates = (gear) => {
  const locations = (gear?.devices || [])
    .map((d) => d?.location)
    .filter((loc) => loc != null && loc.latitude != null && loc.longitude != null);
  if (!locations.length) return null;
  const sumLat = locations.reduce((acc, loc) => acc + Number(loc.latitude), 0);
  const sumLng = locations.reduce((acc, loc) => acc + Number(loc.longitude), 0);
  const n = locations.length;
  return [sumLng / n, sumLat / n];
};
