import React from 'react';
import { act, render } from '@testing-library/react';
import { point } from '@turf/turf';
import { useSelector } from 'react-redux';

import { createMapMock } from '../__test-helpers/mocks';
import { MapContext } from '../MapContext';
import { selectTileExcludedEventIds } from '../selectors/events-realtime-overlay';
import { SOURCE_IDS } from '../constants';
import { usePreviewFeature } from '../hooks';
import useTileEventFeatures from '../hooks/useTileEventFeatures';

import TileEventFeaturesProvider from './';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../hooks', () => ({ usePreviewFeature: jest.fn() }));
jest.mock('../selectors/events-realtime-overlay', () => ({
  selectTileExcludedEventIds: jest.fn(),
}));

const EVENT_TYPES = [{ value: 'fire', icon_id: 'fire-icon', display: 'Fire' }];

const buildState = ({ timeSliderState = { active: false } } = {}) => ({
  data: {
    eventTypes: EVENT_TYPES,
    eventFilter: { filter: { date_range: { lower: '2026-06-01T00:00:00.000Z' } } },
  },
  view: { timeSliderState },
});

const tileFeature = (id, properties = {}) => point([0, 0], {
  id,
  event_type_value: 'fire',
  priority: 200,
  title: `Event ${id}`,
  event_time_iso: '2026-06-10T00:00:00.000Z',
  event_time_display: 'Jun 10, 00:00 UTC',
  updated_at_iso: '2026-06-10T00:00:00.000Z',
  image: `/static/sprite-src/${id}.svg`,
  ...properties,
});

const centroidFeature = (eventId, properties = {}) => point([1, 1], {
  id: `geom-${eventId}`,
  event_id: eventId,
  event_type_value: 'fire',
  priority: 300,
  title: `Polygon ${eventId}`,
  event_time_iso: '2026-06-10T00:00:00.000Z',
  event_time_display: 'Jun 10, 00:00 UTC',
  updated_at_iso: '2026-06-10T00:00:00.000Z',
  ...properties,
});

const querySourceFeaturesByLayer = ({ events = [], centroids = [] }) => jest.fn(
  (_sourceId, { sourceLayer }) => (sourceLayer === 'event_centroids' ? centroids : events)
);

const Capture = ({ onCapture }) => {
  onCapture(useTileEventFeatures());
  return null;
};

const renderProvider = ({ map, overlayIds = [], state = buildState(), onCapture = () => {} } = {}) => {
  selectTileExcludedEventIds.mockReturnValue(overlayIds);
  useSelector.mockImplementation((selector) =>
    (selector === selectTileExcludedEventIds ? overlayIds : selector(state)));

  return render(
    <MapContext.Provider value={map}>
      <TileEventFeaturesProvider>
        <Capture onCapture={onCapture} />
      </TileEventFeaturesProvider>
    </MapContext.Provider>
  );
};

describe('TileEventFeaturesProvider', () => {
  beforeEach(() => {
    usePreviewFeature.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dedupes by id, excludes overlay-owned ids, and normalizes to the GeoJSON shape', () => {
    let value;
    const map = createMapMock({
      querySourceFeatures: jest.fn(() => [
        tileFeature('a'),
        tileFeature('a'), // cross-tile duplicate
        tileFeature('b'), // overlay-owned -> excluded
      ]),
    });

    renderProvider({ map, overlayIds: ['b'], onCapture: (collection) => { value = collection; } });

    expect(value.features).toHaveLength(1);
    const [feature] = value.features;
    expect(feature.properties.id).toBe('a');
    expect(feature.properties.icon_id).toBe('fire-icon');
    expect(feature.properties.event_type).toBe('fire');
    expect(feature.properties.display_title).toBe('Event a\nJun 10, 00:00 UTC');
    expect(feature.geometry.type).toBe('Point');
  });

  it('includes polygon centroids (keyed by event_id) alongside point events', () => {
    let value;
    const map = createMapMock({
      querySourceFeatures: querySourceFeaturesByLayer({
        events: [tileFeature('a')],
        centroids: [centroidFeature('poly-1')],
      }),
    });

    renderProvider({ map, onCapture: (collection) => { value = collection; } });

    const byId = Object.fromEntries(value.features.map((feature) => [feature.properties.id, feature]));
    expect(Object.keys(byId).sort()).toEqual(['a', 'poly-1']);
    expect(byId['poly-1'].properties.icon_id).toBe('fire-icon');
    expect(byId['poly-1'].properties.event_type).toBe('fire');
    expect(byId['poly-1'].geometry.type).toBe('Point');
  });

  it('excludes overlay-owned polygon events from the centroids by event_id', () => {
    let value;
    const map = createMapMock({
      querySourceFeatures: querySourceFeaturesByLayer({ centroids: [centroidFeature('poly-1')] }),
    });

    renderProvider({ map, overlayIds: ['poly-1'], onCapture: (collection) => { value = collection; } });

    expect(value.features).toHaveLength(0);
  });

  it('falls back to the generic icon when the event type is unknown', () => {
    let value;
    const map = createMapMock({
      querySourceFeatures: jest.fn(() => [tileFeature('a', { event_type_value: 'unknown' })]),
    });

    renderProvider({ map, onCapture: (collection) => { value = collection; } });

    expect(value.features[0].properties.icon_id).toBe('generic');
  });

  it('publishes nothing while event types have not loaded yet, rather than every feature normalizing to generic', () => {
    let value;
    const map = createMapMock({ querySourceFeatures: jest.fn(() => [tileFeature('a')]) });
    const state = { ...buildState(), data: { ...buildState().data, eventTypes: [] } };

    renderProvider({ map, state, onCapture: (collection) => { value = collection; } });

    expect(value.features).toHaveLength(0);
  });

  it('gives up waiting for event types after a timeout and publishes anyway, so a failed/empty ' +
    'event-types fetch does not hide every event on the map forever', () => {
    jest.useFakeTimers();

    try {
      let value;
      const map = createMapMock({ querySourceFeatures: jest.fn(() => [tileFeature('a')]) });
      const state = { ...buildState(), data: { ...buildState().data, eventTypes: [] } };

      renderProvider({ map, state, onCapture: (collection) => { value = collection; } });
      expect(value.features).toHaveLength(0);

      act(() => { jest.runOnlyPendingTimers(); });

      expect(value.features).toHaveLength(1);
      expect(value.features[0].properties.icon_id).toBe('generic');
    } finally {
      jest.useRealTimers();
    }
  });

  it('applies the time-slider hide (drops events after the virtual date, keeps timeless events)', () => {
    let value;
    const map = createMapMock({
      querySourceFeatures: jest.fn(() => [
        tileFeature('past', { event_time_iso: '2026-06-05T00:00:00.000Z' }),
        tileFeature('future', { event_time_iso: '2026-06-30T00:00:00.000Z' }),
        tileFeature('timeless', { event_time_iso: undefined }),
      ]),
    });

    renderProvider({
      map,
      state: buildState({ timeSliderState: { active: true, virtualDate: '2026-06-10T00:00:00.000Z' } }),
      onCapture: (collection) => { value = collection; },
    });

    const ids = value.features.map((feature) => feature.properties.id);
    expect(ids).toEqual(expect.arrayContaining(['past', 'timeless']));
    expect(ids).not.toContain('future');
  });

  it('yields an empty collection when the source has no features', () => {
    let value;
    const map = createMapMock({ querySourceFeatures: jest.fn(() => []) });

    renderProvider({ map, onCapture: (collection) => { value = collection; } });

    expect(value.features).toHaveLength(0);
  });

  it('recomputes on sourcedata for the events source and on moveend', () => {
    let value;
    const querySourceFeatures = jest.fn(() => [tileFeature('a')]);
    const map = createMapMock({ querySourceFeatures });

    renderProvider({ map, onCapture: (collection) => { value = collection; } });
    expect(value.features).toHaveLength(1);

    querySourceFeatures.mockReturnValue([tileFeature('a'), tileFeature('b')]);
    act(() => map.__test__.fireHandlers('sourcedata', { sourceId: SOURCE_IDS.EVENTS_VECTOR_SOURCE }));
    expect(value.features).toHaveLength(2);

    querySourceFeatures.mockReturnValue([tileFeature('a')]);
    act(() => map.__test__.fireHandlers('moveend', {}));
    expect(value.features).toHaveLength(1);
  });

  it('ignores sourcedata events for other sources', () => {
    let value;
    const querySourceFeatures = jest.fn(() => [tileFeature('a')]);
    const map = createMapMock({ querySourceFeatures });

    renderProvider({ map, onCapture: (collection) => { value = collection; } });
    querySourceFeatures.mockReturnValue([tileFeature('a'), tileFeature('b')]);

    act(() => map.__test__.fireHandlers('sourcedata', { sourceId: 'some-other-source' }));

    expect(value.features).toHaveLength(1);
  });

  it('does not republish (or re-render consumers) when a viewport move surfaces the same events', () => {
    let value;
    let renders = 0;
    const querySourceFeatures = jest.fn(() => [tileFeature('a'), tileFeature('b')]);
    const map = createMapMock({ querySourceFeatures });

    renderProvider({ map, onCapture: (collection) => { value = collection; renders += 1; } });
    const collectionAfterMount = value;
    const rendersAfterMount = renders;

    // Same set of ids (even in a different order) -> no new collection, no consumer re-render.
    querySourceFeatures.mockReturnValue([tileFeature('b'), tileFeature('a')]);
    act(() => map.__test__.fireHandlers('moveend', {}));
    expect(value).toBe(collectionAfterMount);
    expect(renders).toBe(rendersAfterMount);

    // A changed set -> a fresh collection and one re-render.
    querySourceFeatures.mockReturnValue([tileFeature('a'), tileFeature('b'), tileFeature('c')]);
    act(() => map.__test__.fireHandlers('moveend', {}));
    expect(value).not.toBe(collectionAfterMount);
    expect(value.features).toHaveLength(3);
    expect(renders).toBe(rendersAfterMount + 1);
  });

  it('removes its listeners on unmount', () => {
    const map = createMapMock({ querySourceFeatures: jest.fn(() => []) });

    const { unmount } = renderProvider({ map });
    unmount();

    expect(map.off).toHaveBeenCalledWith('sourcedata', expect.any(Function));
    expect(map.off).toHaveBeenCalledWith('moveend', expect.any(Function));
  });

  describe('when the flag is OFF', () => {
    beforeEach(() => {
      usePreviewFeature.mockReturnValue(false);
    });

    it('yields the empty collection and binds no map listeners', () => {
      let value;
      const querySourceFeatures = jest.fn(() => [tileFeature('a')]);
      const map = createMapMock({ getSource: jest.fn(() => undefined), querySourceFeatures });

      renderProvider({ map, onCapture: (collection) => { value = collection; } });

      expect(value.features).toHaveLength(0);
      expect(querySourceFeatures).not.toHaveBeenCalled();
      expect(map.on).not.toHaveBeenCalledWith('moveend', expect.any(Function));
      expect(map.on).not.toHaveBeenCalledWith('sourcedata', expect.any(Function));
    });
  });
});
