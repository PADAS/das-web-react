import reducer, {
  appendOverlaySegmentFromSocket,
  setRealtimeOverlay,
} from './realtime-overlay';

const CUTOFF = '2026-05-31T00:00:00.000Z';
const IN_WINDOW = '2026-05-31T00:30:00.000Z';
const STALE = '2026-05-30T00:00:00.000Z';

const segment = ({ startTime, id = 's1', coordinates = [[0, 0], [1, 1]] }) => ({
  type: 'Feature',
  geometry: { type: 'LineString', coordinates },
  properties: { subject_id: id, start_time: startTime },
});

const seedState = (segments) => reducer(undefined, setRealtimeOverlay([], segments));

describe('realtime-overlay reducer — APPEND_OVERLAY_SEGMENT_FROM_SOCKET', () => {
  test('appends a segment within the overlay window', () => {
    const seg = segment({ startTime: IN_WINDOW });
    const next = reducer(undefined, appendOverlaySegmentFromSocket(seg, CUTOFF));

    expect(next.segments.features).toHaveLength(1);
    expect(next.segments.features[0]).toEqual(seg);
  });

  test('ignores an incoming segment whose start_time is before the cutoff', () => {
    const state = reducer(undefined, {});
    const next = reducer(state, appendOverlaySegmentFromSocket(segment({ startTime: STALE }), CUTOFF));

    expect(next).toBe(state);
  });

  test('ignores an incoming segment with no start_time', () => {
    const state = reducer(undefined, {});
    const next = reducer(state, appendOverlaySegmentFromSocket(segment({ startTime: undefined }), CUTOFF));

    expect(next).toBe(state);
  });

  test('ignores an incoming segment with empty coordinates', () => {
    const state = reducer(undefined, {});
    const next = reducer(state, appendOverlaySegmentFromSocket(segment({ startTime: IN_WINDOW, coordinates: [] }), CUTOFF));

    expect(next).toBe(state);
  });

  test('keeps a segment whose offset-formatted start_time is numerically within the window', () => {
    // 06:00-07:00 == 13:00Z, which is after the noon cutoff. The offset string
    // sorts lexicographically before the UTC cutoff, so a string comparison
    // would wrongly discard this in-window segment.
    const noonCutoff = '2026-05-31T12:00:00.000Z';
    const seg = segment({ startTime: '2026-05-31T06:00:00-07:00' });
    const next = reducer(undefined, appendOverlaySegmentFromSocket(seg, noonCutoff));

    expect(next.segments.features).toHaveLength(1);
    expect(next.segments.features[0]).toEqual(seg);
  });

  test('drops stale existing segments when a fresh one is appended', () => {
    const stale = segment({ startTime: STALE, id: 'stale' });
    const fresh = segment({ startTime: IN_WINDOW, id: 'fresh' });
    const state = seedState([stale, fresh]);

    const incoming = segment({ startTime: IN_WINDOW, id: 'incoming' });
    const next = reducer(state, appendOverlaySegmentFromSocket(incoming, CUTOFF));

    const ids = next.segments.features.map((f) => f.properties.subject_id);
    expect(ids).toEqual(['fresh', 'incoming']);
  });
});
