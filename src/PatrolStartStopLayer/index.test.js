import React from 'react';
import { Provider } from 'react-redux';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { createMapMock } from '../__test-helpers/mocks';
import { MapContext } from '../MapContext';
import { mockStore } from '../__test-helpers/MockStore';
import { render, waitFor } from '../test-utils';
import { selectPatrolMapTrackData, selectPatrolsWithTracks } from '../selectors/patrols';
import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';

import PatrolStartStopLayer, { PatrolMarkers } from './';

jest.mock('../LabeledPatrolSymbolLayer', () => jest.fn(() => null));

jest.mock('../selectors/patrols', () => ({
  ...jest.requireActual('../selectors/patrols'),
  selectPatrolMapTrackData: jest.fn(),
  selectPatrolsWithTracks: jest.fn(),
}));

jest.mock('../utils/map', () => ({
  ...jest.requireActual('../utils/map'),
  addFeatureCollectionImagesToMap: jest.fn(),
}));

describe('PatrolStartStopLayer', () => {
  const pin = {
    geometry: { coordinates: [0, 0], type: 'Point' },
    properties: { image: 'pin-image', markerKind: 'start' },
    type: 'Feature',
  };
  const dash = {
    geometry: { coordinates: [[0, 0], [1, 1]], type: 'LineString' },
    properties: { stroke: '#C87850' },
    type: 'Feature',
  };

  const trackDataWith = (points, lines = [dash]) => ({
    startStopGeometries: {
      lines: { features: lines, type: 'FeatureCollection' },
      points: { features: points, type: 'FeatureCollection' },
    },
  });

  let map;
  beforeEach(() => {
    jest.clearAllMocks();
    map = createMapMock();

    selectPatrolsWithTracks.mockReturnValue([{ id: 'a-patrol-id' }]);
    selectPatrolMapTrackData.mockReturnValue(trackDataWith([pin]));
    addFeatureCollectionImagesToMap.mockResolvedValue([]);
  });

  const withProviders = (children) => <Provider store={mockStore({ view: {} })}>
    <MapContext.Provider value={map}>{children}</MapContext.Provider>
  </Provider>;

  const renderLayer = () => render(withProviders(<PatrolStartStopLayer />));

  const renderMarkers = (patrolTrackData) => {
    if (patrolTrackData !== undefined) {
      selectPatrolMapTrackData.mockReturnValue(patrolTrackData);
    }

    return render(withProviders(<PatrolMarkers patrol={{ id: 'a-patrol-id' }} />));
  };

  const lastSourceData = () => map.getSource().setData.mock.calls.at(-1)?.[0] ?? null;

  test('draws the markers of every patrol whose track is on the map', () => {
    selectPatrolsWithTracks.mockReturnValue([{ id: 'one-patrol' }, { id: 'another-patrol' }]);

    renderLayer();

    expect(map.addLayer).toHaveBeenCalledTimes(2);
  });

  test('draws nothing while no patrol has its track on the map', () => {
    selectPatrolsWithTracks.mockReturnValue([]);

    renderLayer();

    expect(map.addLayer).not.toHaveBeenCalled();
  });

  test('gives each patrol a source of its own', () => {
    map.getSource.mockReturnValue(undefined);
    selectPatrolsWithTracks.mockReturnValue([{ id: 'one-patrol' }, { id: 'another-patrol' }]);

    renderLayer();

    const sourceIds = map.addSource.mock.calls.map(([sourceId]) => sourceId);

    expect(new Set(sourceIds).size).toBe(2);
  });

  describe('the source and the layer a patrol keeps on the map', () => {
    let layers;
    beforeEach(() => {
      layers = {};
      const sources = {};

      map.addLayer.mockImplementation((layer) => {
        layers[layer.id] = layer;
      });
      map.addSource.mockImplementation((sourceId) => {
        sources[sourceId] = { setData: jest.fn() };
      });
      map.getLayer.mockImplementation((layerId) => layers[layerId]);
      map.getSource.mockImplementation((sourceId) => sources[sourceId]);
      map.getStyle.mockImplementation(() => ({ layers: Object.values(layers) }));
      map.removeLayer.mockImplementation((layerId) => {
        delete layers[layerId];
      });
      map.removeSource.mockImplementation((sourceId) => {
        delete sources[sourceId];
      });
    });

    const addedLineLayer = () => map.addLayer.mock.calls.map(([layer]) => layer)
      .find((layer) => layer.id.endsWith('-lines'));

    test('draws the dashes between the markers as a line of its own', () => {
      renderMarkers();

      expect(addedLineLayer()).toEqual(expect.objectContaining({ type: 'line' }));
      expect(map.addSource)
        .toHaveBeenCalledWith(addedLineLayer().source, expect.objectContaining({ type: 'geojson' }));
    });

    test('takes the dashes and their source off the map when it unmounts', () => {
      const { unmount } = renderMarkers();
      const lineLayer = addedLineLayer();

      unmount();

      expect(map.removeLayer).toHaveBeenCalledWith(lineLayer.id);
      expect(map.removeSource).toHaveBeenCalledWith(lineLayer.source);
    });

    test('takes the dashes off the map before the source they read from', () => {
      const { unmount } = renderMarkers();

      unmount();

      expect(map.removeLayer.mock.invocationCallOrder[0])
        .toBeLessThan(map.removeSource.mock.invocationCallOrder[0]);
    });

    test('takes a marker layer the symbols left on the source off with it', () => {
      const { unmount } = renderMarkers();
      const sourceId = addedLineLayer().source;

      map.addLayer({ id: 'patrol_symbols-of-the-symbol-layer', source: sourceId, type: 'symbol' });

      unmount();

      expect(map.removeLayer).toHaveBeenCalledWith('patrol_symbols-of-the-symbol-layer');
      expect(map.removeSource).toHaveBeenCalledWith(sourceId);
    });

    test('adds the source before the layer that reads from it', () => {
      renderMarkers();

      expect(map.addSource.mock.invocationCallOrder[0]).toBeLessThan(map.addLayer.mock.invocationCallOrder[0]);
    });
  });

  describe('the pins of a patrol', () => {
    test('keeps a pin out of the map until its icon is in the style, dashes going in regardless', async () => {
      let loadImages;
      addFeatureCollectionImagesToMap.mockReturnValue(new Promise((resolve) => {
        loadImages = resolve;
      }));

      renderMarkers();

      expect(lastSourceData().features).toEqual([dash]);

      loadImages([{ icon_id: 'pin-image-x-x', img: 'the pin image' }]);

      await waitFor(() => expect(lastSourceData().features).toHaveLength(2));
      expect(map.addImage).toHaveBeenCalledWith('pin-image-x-x', 'the pin image');
    });

    test('leaves an icon the style already carries alone', async () => {
      map.hasImage.mockReturnValue(true);
      addFeatureCollectionImagesToMap.mockResolvedValue([{ icon_id: 'pin-image-x-x', img: 'the pin image' }]);

      renderMarkers();

      await waitFor(() => expect(lastSourceData().features).toHaveLength(2));
      expect(map.addImage).not.toHaveBeenCalled();
    });

    test('draws them on the source of their own patrol once their icons are in the style', async () => {
      addFeatureCollectionImagesToMap.mockResolvedValue([{ icon_id: 'pin-image-x-x', img: 'the pin image' }]);

      renderMarkers();

      await waitFor(() => expect(LabeledPatrolSymbolLayer).toHaveBeenCalled());
      expect(LabeledPatrolSymbolLayer.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({
        id: expect.stringMatching(/^patrol_symbols-/),
        sourceId: expect.stringMatching(/^patrol-symbol-source-/),
      }));
    });

    test('takes the pins off the map once the patrol has none left to draw', async () => {
      addFeatureCollectionImagesToMap.mockResolvedValue([{ icon_id: 'pin-image-x-x', img: 'the pin image' }]);

      const { rerender } = renderMarkers();

      await waitFor(() => expect(lastSourceData().features).toHaveLength(2));

      selectPatrolMapTrackData.mockReturnValue({ startStopGeometries: null });
      rerender(withProviders(<PatrolMarkers patrol={{ id: 'a-patrol-id' }} />));

      expect(lastSourceData().features).toEqual([]);
    });
  });

  describe('the label a marker carries', () => {
    const renderMarker = async (properties) => {
      addFeatureCollectionImagesToMap.mockResolvedValue([{ icon_id: 'pin-image-x-x', img: 'the pin image' }]);

      renderMarkers(trackDataWith([{ ...pin, properties: { ...pin.properties, ...properties } }], []));

      await waitFor(() => expect(lastSourceData().features).toHaveLength(1));

      return lastSourceData().features[0].properties.title;
    };

    test('names where the patrol started', async () => {
      expect(await renderMarker({ markerKind: 'start' })).toBe('Patrol Start');
    });

    test('says when where the patrol started is an estimate', async () => {
      expect(await renderMarker({ isEstimated: true, markerKind: 'start' })).toBe('Patrol Start (Est)');
    });

    test('names the leg a hand-over marker opens', async () => {
      expect(await renderMarker({ legNumber: 3, markerKind: 'leg' })).toBe('Leg 3');
    });

    test('numbers a pause among the pauses', async () => {
      expect(await renderMarker({ markerKind: 'pause', pauseNumber: 2 })).toBe('Pause 2');
    });

    test('names where the patrol both started and ended', async () => {
      expect(await renderMarker({ markerKind: 'startAndEnd' })).toBe('Patrol Start & Patrol End');
    });

    test('leaves a feature that is no marker of the patrol unlabelled', async () => {
      expect(await renderMarker({ markerKind: undefined })).toBeUndefined();
    });
  });
});
