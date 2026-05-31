import React from 'react';
import { waitFor } from '@testing-library/dom';

import { renderHook } from '../../../../../test-utils';
import { addMapImage } from '../../../../../utils/map';
import { createMapMock } from '../../../../../__test-helpers/mocks';
import { MapContext } from '../../../../../App';

import useMapLocationMarkers from '.';

jest.mock('../../../../../utils/map', () => ({
  ...jest.requireActual('../../../../../utils/map'),
  addMapImage: jest.fn(),
}));

describe('ReportManager - DetailsSection - SchemaForm - Utils - useMapLocationMarkers', () => {
  let map;
  beforeEach(() => {
    map = createMapMock();
  });

  const Wrapper = ({ children }) => (
    <MapContext.Provider value={map}>{children}</MapContext.Provider>
  );

  it('adds the markers and marker connecting lines sources to the map', () => {
    map.getSource.mockImplementation(() => undefined);

    expect(map.addSource).not.toHaveBeenCalled();

    renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    expect(map.addSource).toHaveBeenCalledTimes(2);
    expect(map.addSource).toHaveBeenCalledWith(
      'event-location-markers-source-event-id',
      { data: { features: [], type: 'FeatureCollection' }, type: 'geojson' }
    );
    expect(map.addSource).toHaveBeenCalledWith(
      'event-location-markers-source-lines-event-id',
      { data: { features: [], type: 'FeatureCollection' }, type: 'geojson' }
    );
  });

  it('updates the the markers source data when the markers change', async () => {
    const source = { setData: jest.fn() };
    map.getSource.mockImplementation((sourceId) =>
      sourceId === 'event-location-markers-source-event-id' ? source : undefined
    );

    expect(source.setData).not.toHaveBeenCalled();

    const { result } = renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    const { setLocationMarkers } = result.current;

    expect(source.setData).toHaveBeenCalledTimes(1);
    expect(source.setData).toHaveBeenCalledWith({
      features: [],
      type: 'FeatureCollection',
    });

    setLocationMarkers({
      'location-1': {
        latitude: 15,
        longitude: 15,
      },
      'location-2': {
        latitude: 20,
        longitude: 20,
      },
    });

    await waitFor(() => {
      expect(source.setData).toHaveBeenCalledTimes(2);
      expect(source.setData).toHaveBeenCalledWith({
        features: [
          {
            geometry: { coordinates: [15, 15], type: 'Point' },
            properties: { id: 'location-1' },
            type: 'Feature',
          },
          {
            geometry: { coordinates: [20, 20], type: 'Point' },
            properties: { id: 'location-2' },
            type: 'Feature',
          },
        ],
        type: 'FeatureCollection',
      });
    });
  });

  it('adds the marker connecting lines sources to the map when the event location is not defined', () => {
    map.getSource.mockImplementation(() => undefined);

    expect(map.addSource).not.toHaveBeenCalled();

    renderHook(() => useMapLocationMarkers('event-id'), { wrapper: Wrapper });

    expect(map.addSource).toHaveBeenCalledTimes(2);
    expect(map.addSource).toHaveBeenCalledWith(
      'event-location-markers-source-lines-event-id',
      { data: { features: [], type: 'FeatureCollection' }, type: 'geojson' }
    );
  });

  it('updates the the marker connecting lines source data when the markers change', async () => {
    const source = { setData: jest.fn() };
    map.getSource.mockImplementation((sourceId) =>
      sourceId === 'event-location-markers-source-lines-event-id'
        ? source
        : undefined
    );

    expect(source.setData).not.toHaveBeenCalled();

    const { result } = renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    const { setLocationMarkers } = result.current;

    expect(source.setData).toHaveBeenCalledTimes(1);
    expect(source.setData).toHaveBeenCalledWith({
      features: [],
      type: 'FeatureCollection',
    });

    setLocationMarkers({
      'location-1': {
        latitude: 15,
        longitude: 15,
      },
      'location-2': {
        latitude: 20,
        longitude: 20,
      },
    });

    await waitFor(() => {
      expect(source.setData).toHaveBeenCalledTimes(2);
      expect(source.setData).toHaveBeenCalledWith({
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
      });
    });
  });

  it('adds the markers, marker connecting lines and marker connecting outlines layers to the map', () => {
    map.getLayer.mockImplementation(() => undefined);

    expect(map.addLayer).not.toHaveBeenCalled();

    renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    expect(map.addLayer).toHaveBeenCalledTimes(3);
    expect(map.addLayer).toHaveBeenCalledWith({
      id: 'event-location-markers-layer-event-id',
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
      source: 'event-location-markers-source-event-id',
      type: 'symbol',
    });
    expect(map.addLayer).toHaveBeenCalledWith(
      {
        id: 'event-location-markers-layer-lines-event-id',
        paint: { 'line-color': 'black', 'line-width': 1 },
        source: 'event-location-markers-source-lines-event-id',
        type: 'line',
      },
      'event-location-markers-layer-event-id'
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      {
        id: 'event-location-markers-layer-outlines-event-id',
        paint: { 'line-color': 'white', 'line-width': 5 },
        source: 'event-location-markers-source-lines-event-id',
        type: 'line',
      },
      'event-location-markers-layer-lines-event-id'
    );
  });

  it('updates the markers layer icon-image layout property when the focused marker changes', async () => {
    const layer = {};
    map.getLayer.mockImplementation((layerId) =>
      layerId === 'event-location-markers-layer-event-id' ? layer : undefined
    );

    expect(map.setLayoutProperty).not.toHaveBeenCalled();

    const { result } = renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    const { focusLocationMarker, setLocationMarkers } = result.current;

    setLocationMarkers({
      'location-1': {
        latitude: 15,
        longitude: 15,
      },
      'location-2': {
        latitude: 20,
        longitude: 20,
      },
    });

    expect(map.setLayoutProperty).toHaveBeenCalledTimes(4);
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'event-location-markers-layer-event-id',
      'icon-image',
      [
        'case',
        ['==', ['get', 'id'], null],
        'location-dot-blue',
        'location-dot-gray',
      ]
    );

    focusLocationMarker('location-1');

    await waitFor(() => {
      expect(map.setLayoutProperty).toHaveBeenCalledTimes(5);
      expect(map.setLayoutProperty).toHaveBeenCalledWith(
        'event-location-markers-layer-event-id',
        'icon-image',
        [
          'case',
          ['==', ['get', 'id'], 'location-1'],
          'location-dot-blue',
          'location-dot-gray',
        ]
      );
    });
  });

  it('adds click and mouse listeners to the markers layer if the onMarkerClick callback is defined', () => {
    const canvas = {
      style: {
        cursor: '',
      },
    };
    map.getCanvas.mockImplementation(() => canvas);

    const onMarkerClick = jest.fn();

    renderHook(
      () =>
        useMapLocationMarkers(
          'event-id',
          { latitude: 10, longitude: 10 },
          onMarkerClick
        ),
      { wrapper: Wrapper }
    );

    expect(map.getCanvas().style.cursor).toBe('');

    map.__test__.fireHandlers('mouseenter');

    expect(map.getCanvas().style.cursor).toBe('pointer');
    expect(onMarkerClick).not.toHaveBeenCalled();

    map.__test__.fireHandlers('click', {
      features: [
        {
          properties: {
            id: 'location-1',
          },
        },
      ],
    });

    expect(onMarkerClick).toHaveBeenCalledTimes(1);
    expect(onMarkerClick).toHaveBeenCalledWith('location-1');

    map.__test__.fireHandlers('mouseleave');

    expect(map.getCanvas().style.cursor).toBe('');
  });

  it('does not add click and mouse listeners to the markers layer if the onMarkerClick callback is not defined', () => {
    const canvas = {
      style: {
        cursor: '',
      },
    };
    map.getCanvas.mockImplementation(() => canvas);

    renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    expect(map.getCanvas().style.cursor).toBe('');

    map.__test__.fireHandlers('mouseenter');

    expect(map.getCanvas().style.cursor).toBe('');
  });

  it('adds the location dot images to the map if they are not loaded yet', () => {
    expect(addMapImage).not.toHaveBeenCalled();

    renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    expect(addMapImage).toHaveBeenCalledTimes(2);
    expect(addMapImage).toHaveBeenCalledWith({
      id: 'location-dot-blue',
      src: 'location-dot-blue.png',
    });
    expect(addMapImage).toHaveBeenCalledWith({
      id: 'location-dot-gray',
      src: 'location-dot-gray.png',
    });
  });

  it('doest not add the location dot images to the map if they are loaded already', () => {
    map.hasImage.mockImplementation(() => true);

    renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    expect(addMapImage).not.toHaveBeenCalled();
  });

  it('removes all layers and sources when the hook unmounts', () => {
    const { unmount } = renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).not.toHaveBeenCalled();

    // Layers exist on the map at teardown; safeRemoveMapLayer guards on getLayer.
    map.getLayer.mockReturnValue(true);

    unmount();

    expect(map.removeLayer).toHaveBeenCalledTimes(3);
    expect(map.removeLayer).toHaveBeenCalledWith(
      'event-location-markers-layer-outlines-event-id'
    );
    expect(map.removeLayer).toHaveBeenCalledWith(
      'event-location-markers-layer-lines-event-id'
    );
    expect(map.removeLayer).toHaveBeenCalledWith(
      'event-location-markers-layer-event-id'
    );
    expect(map.removeSource).toHaveBeenCalledTimes(2);
    expect(map.removeSource).toHaveBeenCalledWith(
      'event-location-markers-source-lines-event-id'
    );
    expect(map.removeSource).toHaveBeenCalledWith(
      'event-location-markers-source-event-id'
    );
  });

  it('hides the layers', () => {
    expect(map.setLayoutProperty).not.toHaveBeenCalled();

    renderHook(
      () =>
        useMapLocationMarkers(
          'event-id',
          { latitude: 10, longitude: 10 },
          null,
          true
        ),
      { wrapper: Wrapper }
    );

    expect(map.setLayoutProperty).toHaveBeenCalledTimes(3);
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'event-location-markers-layer-outlines-event-id',
      'visibility',
      'none'
    );
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'event-location-markers-layer-lines-event-id',
      'visibility',
      'none'
    );
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'event-location-markers-layer-event-id',
      'visibility',
      'none'
    );
  });

  it('shows the layers', () => {
    expect(map.setLayoutProperty).not.toHaveBeenCalled();

    renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    expect(map.setLayoutProperty).toHaveBeenCalledTimes(3);
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'event-location-markers-layer-outlines-event-id',
      'visibility',
      'visible'
    );
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'event-location-markers-layer-lines-event-id',
      'visibility',
      'visible'
    );
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'event-location-markers-layer-event-id',
      'visibility',
      'visible'
    );
  });

  it('updates the markers layer icon-image layout property when the markers are blurred', async () => {
    const layer = {};
    map.getLayer.mockImplementation((layerId) =>
      layerId === 'event-location-markers-layer-event-id' ? layer : undefined
    );

    const { result } = renderHook(
      () => useMapLocationMarkers('event-id', { latitude: 10, longitude: 10 }),
      { wrapper: Wrapper }
    );

    const { blurLocationMarker, focusLocationMarker, setLocationMarkers } =
      result.current;

    setLocationMarkers({
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

    await waitFor(() => {
      expect(map.setLayoutProperty).toHaveBeenCalledTimes(5);
    });

    blurLocationMarker();

    await waitFor(() => {
      expect(map.setLayoutProperty).toHaveBeenCalledTimes(6);
      expect(map.setLayoutProperty.mock.calls[5][0]).toBe(
        'event-location-markers-layer-event-id'
      );
      expect(map.setLayoutProperty.mock.calls[5][1]).toBe('icon-image');
      expect(map.setLayoutProperty.mock.calls[5][2]).toEqual([
        'case',
        ['==', ['get', 'id'], null],
        'location-dot-blue',
        'location-dot-gray',
      ]);
    });
  });
});
