import { API_URL } from '../constants';

// Ordered day thresholds matching the vector tile service `range` param values.
// Pick the smallest bucket that covers the requested track length.
const VT_RANGE_STEPS = [30, 45, 60, 90, 150, 210, 365, 500];

export const getVtRangeParam = (trackLengthInDays) => {
  const step = VT_RANGE_STEPS.find((s) => trackLengthInDays <= s);
  return step !== undefined ? String(step) : 'all';
};

const VECTOR_TILE_BASE = `${API_URL}observations/segments/tiles/{z}/{x}/{y}.pbf`;
export const buildVtTileUrl = (rangeParam) => `${VECTOR_TILE_BASE}?range=${rangeParam}`;

// Single shared vector tile source for both track segments and subjects.
// TrackSegmentsLayer (always mounted) owns its lifecycle; SubjectTileLayer
// shares it so the same .pbf tiles are not fetched twice.
export const VECTOR_TILE_SOURCE = 'track-segments-source';
