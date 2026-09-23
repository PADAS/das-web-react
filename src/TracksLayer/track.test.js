import React from 'react';
import { Provider } from 'react-redux';

import { addMapImage } from '../utils/map';
import { createMapMock } from '../__test-helpers/mocks';
import { LAYER_IDS } from '../constants';
import { MapContext } from '../MapContext';
import { mockStore } from '../__test-helpers/MockStore';
import { render } from '../test-utils';

import TrackLayer, { ARROW_IMG_ID } from './track';

jest.mock('../utils/map', () => ({
  ...jest.requireActual('../utils/map'),
  addMapImage: jest.fn(),
}));

describe('TracksLayer - track', () => {
  const { SUBJECT_SYMBOLS, TRACKS_LINES, TRACKS_SOURCE, TRACK_TIMEPOINTS } = LAYER_IDS;

  const trackId = 'a-subject-id';
  const lineSourceId = `${TRACKS_SOURCE}-${trackId}`;
  const pointSourceId = `${lineSourceId}-points`;
  const lineLayerId = `${TRACKS_LINES}-${trackId}`;
  const pointLayerId = `${TRACK_TIMEPOINTS}-${trackId}`;

  const track = { features: [{ properties: { id: trackId }, type: 'Feature' }], type: 'FeatureCollection' };
  const points = { features: [{ properties: { bearing: 90 }, type: 'Feature' }], type: 'FeatureCollection' };

  const trackSegments = {
    features: [
      { properties: { endColor: '#111111', startColor: '#000000' }, type: 'Feature' },
      { properties: { endColor: '#111111', startColor: '#000000' }, type: 'Feature' },
      { properties: { endColor: '#333333', startColor: '#222222' }, type: 'Feature' },
    ],
    type: 'FeatureCollection',
  };

  let map;
  let sources;
  beforeEach(() => {
    sources = {};
    const layers = {};

    map = createMapMock({
      addLayer: jest.fn((layer) => {
        layers[layer.id] = layer;
      }),
      addSource: jest.fn((sourceId) => {
        sources[sourceId] = { setData: jest.fn() };
      }),
      getLayer: jest.fn((layerId) => layers[layerId]),
      getSource: jest.fn((sourceId) => sources[sourceId]),
      hasImage: jest.fn(() => false),
      removeLayer: jest.fn((layerId) => {
        delete layers[layerId];
      }),
      removeSource: jest.fn((sourceId) => {
        delete sources[sourceId];
      }),
    });
  });

  const renderTrackLayer = ({ isTimeOfDayColoringActive = false, ...props } = {}) => render(
    <Provider store={mockStore({ view: { trackSettings: { isTimeOfDayColoringActive } } })}>
      <MapContext.Provider value={map}>
        <TrackLayer id={trackId} trackData={{ points, track, trackSegments }} {...props} />
      </MapContext.Provider>
    </Provider>
  );

  const addedLayer = (layerId) => map.addLayer.mock.calls.find(([layer]) => layer.id === layerId)?.[0];
  const beforeIdOf = (layerId) => map.addLayer.mock.calls.find(([layer]) => layer.id === layerId)?.[1];

  test('draws the track as a line over a source of its own', () => {
    renderTrackLayer();

    expect(map.addSource).toHaveBeenCalledWith(lineSourceId, expect.objectContaining({ type: 'geojson' }));
    expect(addedLayer(lineLayerId)).toEqual(expect.objectContaining({ source: lineSourceId, type: 'line' }));
  });

  test('measures line progress on the track source, so a gradient has something to read', () => {
    renderTrackLayer();

    expect(map.addSource).toHaveBeenCalledWith(lineSourceId, expect.objectContaining({ lineMetrics: true }));
  });

  test('hands the track and its timepoints to their own sources', () => {
    renderTrackLayer();

    expect(sources[lineSourceId].setData).toHaveBeenCalledWith(track);
    expect(sources[pointSourceId].setData).toHaveBeenCalledWith(points);
  });

  test('takes its layers and sources off the map when it unmounts', () => {
    const { unmount } = renderTrackLayer();

    unmount();

    expect(map.removeLayer).toHaveBeenCalledWith(lineLayerId);
    expect(map.removeLayer).toHaveBeenCalledWith(pointLayerId);
    expect(map.removeSource).toHaveBeenCalledWith(lineSourceId);
    expect(map.removeSource).toHaveBeenCalledWith(pointSourceId);
  });

  test('takes a layer off the map before the source it reads from', () => {
    const { unmount } = renderTrackLayer();

    unmount();

    expect(map.removeLayer.mock.invocationCallOrder[0])
      .toBeLessThan(map.removeSource.mock.invocationCallOrder[0]);
  });

  test('registers the arrow the timepoints are drawn with', () => {
    renderTrackLayer();

    expect(addMapImage).toHaveBeenCalledWith(expect.objectContaining({ id: ARROW_IMG_ID }));
  });

  test('leaves the arrow alone when the style already carries it', () => {
    map.hasImage.mockReturnValue(true);

    renderTrackLayer();

    expect(addMapImage).not.toHaveBeenCalled();
  });

  describe('timepoints', () => {
    test('draws them when they are asked for', () => {
      renderTrackLayer({ showTimepoints: true });

      expect(addedLayer(pointLayerId)).toEqual(expect.objectContaining({ source: pointSourceId, type: 'symbol' }));
    });

    test('draws neither them nor their source when they are not asked for', () => {
      renderTrackLayer({ showTimepoints: false });

      expect(addedLayer(pointLayerId)).toBeUndefined();
      expect(map.addSource).not.toHaveBeenCalledWith(pointSourceId, expect.anything());
    });

    test('takes them off the map once they stop being asked for', () => {
      const { rerender } = renderTrackLayer({ showTimepoints: true });

      rerender(
        <Provider store={mockStore({ view: { trackSettings: { isTimeOfDayColoringActive: false } } })}>
          <MapContext.Provider value={map}>
            <TrackLayer id={trackId} showTimepoints={false} trackData={{ points, track, trackSegments }} />
          </MapContext.Provider>
        </Provider>
      );

      expect(map.removeLayer).toHaveBeenCalledWith(pointLayerId);
      expect(map.removeSource).toHaveBeenCalledWith(pointSourceId);
    });
  });

  describe('time of day coloring', () => {
    test('draws a line per pair of colors the track runs between', () => {
      renderTrackLayer({ isTimeOfDayColoringActive: true });

      expect(addedLayer(`${lineLayerId}-colorpair-0`)).toEqual(
        expect.objectContaining({ source: `${lineSourceId}-colorpair-0`, type: 'line' })
      );
      expect(addedLayer(`${lineLayerId}-colorpair-1`)).toEqual(
        expect.objectContaining({ source: `${lineSourceId}-colorpair-1`, type: 'line' })
      );
    });

    test('gives each of those lines the gradient between its own two colors', () => {
      renderTrackLayer({ isTimeOfDayColoringActive: true });

      expect(addedLayer(`${lineLayerId}-colorpair-0`).paint['line-gradient'])
        .toEqual(['interpolate', ['linear'], ['line-progress'], 0, '#000000', 1, '#111111']);
    });

    test('keeps the plain paint values its caller passed on each of those lines', () => {
      renderTrackLayer({ isTimeOfDayColoringActive: true, linePaint: { 'line-offset': -0.75, 'line-opacity': 0.4 } });

      expect(addedLayer(`${lineLayerId}-colorpair-0`).paint)
        .toEqual(expect.objectContaining({ 'line-offset': -0.75, 'line-opacity': 0.4 }));
    });

    test('leaves out the paint values reading properties a segment does not carry', () => {
      renderTrackLayer({ isTimeOfDayColoringActive: true });

      expect(addedLayer(`${lineLayerId}-colorpair-0`).paint).not.toHaveProperty('line-color');
      expect(addedLayer(`${lineLayerId}-colorpair-0`).paint['line-width']).toBe(3);
    });

    test('feeds each of those lines the segments that run between its colors', () => {
      renderTrackLayer({ isTimeOfDayColoringActive: true });

      expect(sources[`${lineSourceId}-colorpair-0`].setData).toHaveBeenCalledWith({
        features: trackSegments.features.slice(0, 2),
        type: 'FeatureCollection',
      });
    });

    test('feeds new positions to the lines rather than building them again', () => {
      const { rerender } = renderTrackLayer({ isTimeOfDayColoringActive: true });

      map.addLayer.mockClear();
      map.removeLayer.mockClear();

      const grownSegments = {
        features: [...trackSegments.features, { properties: { endColor: '#111111', startColor: '#000000' }, type: 'Feature' }],
        type: 'FeatureCollection',
      };

      rerender(
        <Provider store={mockStore({ view: { trackSettings: { isTimeOfDayColoringActive: true } } })}>
          <MapContext.Provider value={map}>
            <TrackLayer id={trackId} trackData={{ points, track, trackSegments: grownSegments }} />
          </MapContext.Provider>
        </Provider>
      );

      expect(map.addLayer).not.toHaveBeenCalled();
      expect(map.removeLayer).not.toHaveBeenCalled();
      expect(sources[`${lineSourceId}-colorpair-0`].setData).toHaveBeenCalledWith({
        features: grownSegments.features.filter((feature) => feature.properties.startColor === '#000000'),
        type: 'FeatureCollection',
      });
    });

    test('leaves the plain line off the map while it is on', () => {
      renderTrackLayer({ isTimeOfDayColoringActive: true });

      expect(addedLayer(lineLayerId)).toBeUndefined();
    });

    test('falls back to the plain line when the track has no segments to color', () => {
      render(
        <Provider store={mockStore({ view: { trackSettings: { isTimeOfDayColoringActive: true } } })}>
          <MapContext.Provider value={map}>
            <TrackLayer id={trackId} trackData={{ points, track }} />
          </MapContext.Provider>
        </Provider>
      );

      expect(addedLayer(lineLayerId)).toBeDefined();
    });
  });

  describe('stacking order', () => {
    test('puts the track under the subject symbols the map already carries', () => {
      map.getLayer.mockImplementation((layerId) => (layerId === SUBJECT_SYMBOLS ? { id: layerId } : undefined));

      renderTrackLayer();

      expect(beforeIdOf(lineLayerId)).toBe(SUBJECT_SYMBOLS);
    });

    test('adds the track on top when the map carries no subject symbols yet', () => {
      renderTrackLayer();

      expect(beforeIdOf(lineLayerId)).toBeUndefined();
    });

    test('puts the track under the layer its caller names instead', () => {
      map.getLayer.mockImplementation((layerId) => (layerId === 'a-layer-of-its-own' ? { id: layerId } : undefined));

      renderTrackLayer({ before: 'a-layer-of-its-own' });

      expect(beforeIdOf(lineLayerId)).toBe('a-layer-of-its-own');
    });
  });

  test('leaves the line in place when its caller rebuilds the paint it passes', () => {
    const { rerender } = renderTrackLayer({ linePaint: { 'line-opacity': 0.4 } });

    map.addLayer.mockClear();

    rerender(
      <Provider store={mockStore({ view: { trackSettings: { isTimeOfDayColoringActive: false } } })}>
        <MapContext.Provider value={map}>
          <TrackLayer
            id={trackId}
            linePaint={{ 'line-opacity': 0.4 }}
            trackData={{ points, track, trackSegments }}
          />
        </MapContext.Provider>
      </Provider>
    );

    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });
});
