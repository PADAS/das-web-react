import { renderHook } from '@testing-library/react-hooks';

import { useMapEventBinding } from '../../../../../hooks';
import useMapLayers from '../../../../../hooks/useMapLayers';
import useMapSources from '../../../../../hooks/useMapSources';

import useLocationMarkersLayer from '.';

jest.mock('../../../../../hooks', () => ({
  useMapEventBinding: jest.fn(),
}));

jest.mock('../../../../../hooks/useMapLayers', () => jest.fn());

jest.mock('../../../../../hooks/useMapSources', () => jest.fn());

describe('ReportManager - DetailsSection - SchemaForm - Utils - useLocationMarkersLayer', () => {
  const onMarkerClickCallback = jest.fn();

  it('triggers the onMarkerClickCallback when a marker is clicked', () => {
    useMapEventBinding.mockImplementation((eventType, handlerFn) => {
      if (eventType === 'click') {
        handlerFn({ features: [{ properties: { id: 'clicked-marker' } }] });
      }
    });

    renderHook(() =>
      useLocationMarkersLayer(
        { latitude: 10, longitude: 10 },
        onMarkerClickCallback
      )
    );

    expect(onMarkerClickCallback).toHaveBeenCalledTimes(1);
    expect(onMarkerClickCallback).toHaveBeenCalledWith('clicked-marker');
  });

  it('adds the location markers source to the map', () => {
    renderHook(() =>
      useLocationMarkersLayer(
        { latitude: 10, longitude: 10 },
        onMarkerClickCallback
      )
    );

    expect(useMapSources).toHaveBeenCalledTimes(2);
    expect(useMapSources).toHaveBeenCalledWith([
      {
        data: { features: [], type: 'FeatureCollection' },
        id: 'event-location-markers-source',
      },
    ]);
    expect(useMapSources).toHaveBeenCalledWith([
      {
        data: { features: [], type: 'FeatureCollection' },
        id: 'event-location-markers-source-lines',
      },
    ]);
  });

  it('adds the location markers source to the map for an event without location', () => {
    renderHook(() => useLocationMarkersLayer(null, onMarkerClickCallback));

    expect(useMapSources).toHaveBeenCalledTimes(2);
    expect(useMapSources).toHaveBeenCalledWith([
      {
        data: { features: [], type: 'FeatureCollection' },
        id: 'event-location-markers-source',
      },
    ]);
    expect(useMapSources).toHaveBeenCalledWith([
      {
        data: { features: [], type: 'FeatureCollection' },
        id: 'event-location-markers-source-lines',
      },
    ]);
  });

  it('updates the markers in the map', () => {
    const { result } = renderHook(() =>
      useLocationMarkersLayer(
        { latitude: 10, longitude: 10 },
        onMarkerClickCallback
      )
    );

    const { updateLocationMarkers } = result.current;

    expect(useMapSources).toHaveBeenCalledTimes(2);
    expect(useMapSources).toHaveBeenCalledWith([
      {
        data: { features: [], type: 'FeatureCollection' },
        id: 'event-location-markers-source',
      },
    ]);
    expect(useMapSources).toHaveBeenCalledWith([
      {
        data: { features: [], type: 'FeatureCollection' },
        id: 'event-location-markers-source-lines',
      },
    ]);

    updateLocationMarkers({
      'location-1': {
        latitude: 15,
        longitude: 15,
      },
      'location-2': {
        latitude: 20,
        longitude: 20,
      },
    });

    expect(useMapSources).toHaveBeenCalledTimes(4);
    expect(useMapSources).toHaveBeenCalledWith([
      {
        data: {
          features: [
            {
              geometry: {
                coordinates: [15, 15],
                type: 'Point',
              },
              properties: {
                id: 'location-1',
              },
              type: 'Feature',
            },
            {
              geometry: {
                coordinates: [20, 20],
                type: 'Point',
              },
              properties: {
                id: 'location-2',
              },
              type: 'Feature',
            },
          ],
          type: 'FeatureCollection',
        },
        id: 'event-location-markers-source',
      },
    ]);
    expect(useMapSources).toHaveBeenCalledWith([
      {
        data: {
          features: [
            {
              geometry: {
                coordinates: [
                  [15, 15],
                  [10, 10],
                ],
                type: 'LineString',
              },
              properties: {},
              type: 'Feature',
            },
            {
              geometry: {
                coordinates: [
                  [20, 20],
                  [10, 10],
                ],
                type: 'LineString',
              },
              properties: {},
              type: 'Feature',
            },
          ],
          type: 'FeatureCollection',
        },
        id: 'event-location-markers-source-lines',
      },
    ]);
  });

  it('focuses a marker', () => {
    const { result } = renderHook(() =>
      useLocationMarkersLayer(
        { latitude: 10, longitude: 10 },
        onMarkerClickCallback
      )
    );

    const { focusLocationMarker, updateLocationMarkers } = result.current;

    updateLocationMarkers({
      'location-1': {
        latitude: 15,
        longitude: 15,
      },
      'location-2': {
        latitude: 20,
        longitude: 20,
      },
    });

    expect(useMapLayers).toHaveBeenCalledTimes(6);

    focusLocationMarker('location-1');

    expect(useMapLayers).toHaveBeenCalledTimes(9);
    expect(useMapLayers).toHaveBeenCalledWith([
      {
        id: 'event-location-markers-layer',
        layout: {
          'icon-allow-overlap': true,
          'icon-image': [
            'case',
            ['==', ['get', 'id'], 'location-1'],
            'location-dot-blue',
            'location-dot-gray',
          ],
          'icon-offset': [0, -29],
          'icon-size': 0.5,
        },
        paint: { 'icon-color': 'white' },
        sourceId: 'event-location-markers-source',
        type: 'symbol',
      },
    ]);
  });

  it('blurs a marker', () => {
    const { result } = renderHook(() =>
      useLocationMarkersLayer(
        { latitude: 10, longitude: 10 },
        onMarkerClickCallback
      )
    );

    const { blurLocationMarker, focusLocationMarker, updateLocationMarkers } =
      result.current;

    updateLocationMarkers({
      'location-1': {
        latitude: 15,
        longitude: 15,
      },
      'location-2': {
        latitude: 20,
        longitude: 20,
      },
    });

    focusLocationMarker('location-1');
    expect(useMapLayers).toHaveBeenCalledTimes(9);

    blurLocationMarker();

    expect(useMapLayers).toHaveBeenCalledTimes(12);
    expect(useMapLayers.mock.calls[9][0]).toEqual([
      {
        id: 'event-location-markers-layer',
        layout: {
          'icon-allow-overlap': true,
          'icon-image': [
            'case',
            ['==', ['get', 'id'], null],
            'location-dot-blue',
            'location-dot-gray',
          ],
          'icon-offset': [0, -29],
          'icon-size': 0.5,
        },
        paint: { 'icon-color': 'white' },
        sourceId: 'event-location-markers-source',
        type: 'symbol',
      },
    ]);
  });
});
