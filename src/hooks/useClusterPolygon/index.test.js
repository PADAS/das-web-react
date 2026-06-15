import React from 'react';
import { Provider } from 'react-redux';

import { renderHook } from '../../test-utils';
import { createMapMock } from '../../__test-helpers/mocks';
import { MapContext } from '../../MapContext';

import useClusterPolygon from './';
import { mockStore } from '../../__test-helpers/MockStore';

describe('useClusterPolygon', () => {
  const clusterFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-99.1332, 19.4326],
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-99.1338, 19.4330],
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-99.1340, 19.4320],
        },
      },
    ],
  };

  let map, store;
  beforeEach(() => {
    map = createMapMock();

    store = {
      view: {
        mapClusterConfig: {
          showPolygons: true,
        },
      },
    };
  });

  const Wrapper = ({ children }) => <Provider store={mockStore(store)}>
    <MapContext value={map}>{children}</MapContext>
  </Provider>;

  test('adds the cluster polygon source and layer', async () => {
    map.getSource.mockImplementation(() => false);
    map.getLayer.mockImplementation(() => false);
    renderHook(() => useClusterPolygon(), { wrapper: Wrapper });

    expect(map.addSource).toHaveBeenCalledTimes(1);
    expect(map.addSource).toHaveBeenCalledWith('cluster-polygon-source', {
      data: {
        features: [],
        type: 'FeatureCollection',
      },
      type: 'geojson',
    });
    expect(map.addLayer).toHaveBeenCalledTimes(1);
    expect(map.addLayer).toHaveBeenCalledWith({
      id: 'cluster-polygon-layer',
      maxzoom: 18,
      paint: {
        'fill-color': 'rgba(60, 120, 40, 0.4)',
        'fill-outline-color': 'rgba(20, 100, 25, 1)',
      },
      source: 'cluster-polygon-source',
      type: 'fill',
    }, 'clusters-layer');
  });

  test('cleans the cluster polygon source and layer', async () => {
    const { unmount } = renderHook(() => useClusterPolygon(), { wrapper: Wrapper });

    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).not.toHaveBeenCalled();

    unmount();

    expect(map.removeLayer).toHaveBeenCalledTimes(1);
    expect(map.removeSource).toHaveBeenCalledTimes(1);
  });

  test('adds a cluster polygon', async () => {
    const setClusterPolygonSourceData = jest.fn();
    map.getSource.mockImplementation(() => ({ setData: setClusterPolygonSourceData }));
    map.getZoom.mockImplementation(() => 10);
    const { result } = renderHook(() => useClusterPolygon(), { wrapper: Wrapper });

    result.current.addClusterPolygon(clusterFeatureCollection);

    expect(setClusterPolygonSourceData).toHaveBeenCalledTimes(1);
  });

  test('does not add a cluster polygon if the show map cluster polygons setting is off', async () => {
    store.view.mapClusterConfig.showPolygons = false;
    const setClusterPolygonSourceData = jest.fn();
    map.getSource.mockImplementation(() => ({ setData: setClusterPolygonSourceData }));
    map.getZoom.mockImplementation(() => 10);
    const { result } = renderHook(() => useClusterPolygon(), { wrapper: Wrapper });

    result.current.addClusterPolygon(clusterFeatureCollection);

    expect(setClusterPolygonSourceData).not.toHaveBeenCalled();
  });

  test('does not add a cluster polygon if the cluster polygon source is not defined', async () => {
    const setClusterPolygonSourceData = jest.fn();
    map.getSource.mockImplementation(() => null);
    map.getZoom.mockImplementation(() => 10);
    const { result } = renderHook(() => useClusterPolygon(), { wrapper: Wrapper });

    result.current.addClusterPolygon(clusterFeatureCollection);

    expect(setClusterPolygonSourceData).not.toHaveBeenCalled();
  });

  test('does not add a cluster polygon if the map zoom is above the threshold', async () => {
    const setClusterPolygonSourceData = jest.fn();
    map.getSource.mockImplementation(() => ({ setData: setClusterPolygonSourceData }));
    map.getZoom.mockImplementation(() => 20);
    const { result } = renderHook(() => useClusterPolygon(), { wrapper: Wrapper });

    result.current.addClusterPolygon(clusterFeatureCollection);

    expect(setClusterPolygonSourceData).not.toHaveBeenCalled();
  });

  test('does not add a cluster polygon if it is not possible to build a polygon from the cluster feature collection', async () => {
    const setClusterPolygonSourceData = jest.fn();
    map.getSource.mockImplementation(() => ({ setData: setClusterPolygonSourceData }));
    map.getZoom.mockImplementation(() => 10);
    const { result } = renderHook(() => useClusterPolygon(), { wrapper: Wrapper });

    result.current.addClusterPolygon({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-99.1332, 19.4326],
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-99.1338, 19.4330],
          },
        },
      ],
    });

    expect(setClusterPolygonSourceData).not.toHaveBeenCalled();
  });

  test('removes the cluster polygon', async () => {
    const setClusterPolygonSourceData = jest.fn();
    map.getSource.mockImplementation(() => ({ setData: setClusterPolygonSourceData }));
    const { result } = renderHook(() => useClusterPolygon(), { wrapper: Wrapper });

    result.current.removeClusterPolygon();

    expect(setClusterPolygonSourceData).toHaveBeenCalledTimes(1);
    expect(setClusterPolygonSourceData).toHaveBeenCalledWith({ features: [], type: 'FeatureCollection' });
  });
});
