import React from 'react';

import { renderHook } from '../../test-utils';
import { createMapMock } from '../../__test-helpers/mocks';
import { MapContext } from '../../App';

import useMapSources from './';

describe('hooks - useMapSource', () => {
  let map;
  beforeEach(() => {
    map = createMapMock();
  });


  const Wrapper = ({ children }) => <MapContext.Provider value={map}>
    {children}
  </MapContext.Provider>;

  test('adds a single source to the map', () => {
    map.getSource.mockImplementation(() => undefined);

    const sourceConfiguration = {
      id: 'id',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      options: {
        tolerance: 1.5,
        type: 'geojson',
        lineMetrics: true,
        enabled: true
      }
    };

    expect(map.addSource).not.toHaveBeenCalled();

    renderHook(() => useMapSources([sourceConfiguration]), { wrapper: Wrapper });

    expect(map.addSource).toHaveBeenCalledTimes(1);
    expect(map.addSource).toHaveBeenCalledWith(sourceConfiguration.id, {
      ...sourceConfiguration.options,
      data: sourceConfiguration.data
    });
  });

  test('adds multiple sources to the map', () => {
    map.getSource.mockImplementation(() => undefined);

    const sourceConfigurations = [
      {
        id: 'firstConfig',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        options: {
          type: 'geojson',
        }
      },
      {
        id: 'secondConfig',
        data: {
          type: 'FeatureCollection',
          features: [{ some: 'data' }]
        },
        options: {
          type: 'geojson',
        }
      },
    ];

    expect(map.addSource).not.toHaveBeenCalled();

    renderHook(() => useMapSources(sourceConfigurations), { wrapper: Wrapper });

    expect(map.addSource).toHaveBeenCalledTimes(sourceConfigurations.length);
    sourceConfigurations.forEach((sourceConfiguration) => {
      expect(map.addSource).toHaveBeenCalledWith(sourceConfiguration.id, {
        ...sourceConfiguration.options,
        data: sourceConfiguration.data
      });
    });
  });

  test('updates the data of an existing source', () => {
    const source = { setData: jest.fn() };
    map.getSource.mockImplementation(() => source);

    const sourceConfiguration = {
      id: 'id',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      options: {
        type: 'geojson',
      }
    };

    expect(source.setData).not.toHaveBeenCalled();

    renderHook(() => useMapSources([sourceConfiguration]), { wrapper: Wrapper });

    expect(source.setData).toHaveBeenCalledTimes(1);
    expect(source.setData).toHaveBeenCalledWith(sourceConfiguration.data);
  });

  test('updates data of multiple existing sources', () => {
    const source = { setData: jest.fn() };
    map.getSource.mockImplementation(() => source);

    const sourceConfigurations = [
      {
        id: 'id',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        options: {
          type: 'geojson',
        }
      },
      {
        id: 'idSource',
        data: {
          type: 'FeatureCollection',
          features: [{ data: 3 }]
        },
        options: {
          type: 'geojson',
        }
      }
    ];

    expect(source.setData).not.toHaveBeenCalled();

    renderHook(() => useMapSources(sourceConfigurations), { wrapper: Wrapper });

    expect(source.setData).toHaveBeenCalledTimes(2);

    sourceConfigurations.forEach((sourceConfiguration) => {
      expect(source.setData).toHaveBeenCalledWith(sourceConfiguration.data);
    });
  });
});
