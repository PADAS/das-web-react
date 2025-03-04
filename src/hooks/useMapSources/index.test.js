import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { MapContext } from '../../App';

import useMapSources from './';

describe('hooks - useMapSource', () => {

  const baseMap = {
    getSource: jest.fn(),
    addSource: jest.fn(),
    setData: jest.fn(),
    removeSource: jest.fn(),
  };

  // eslint-disable-next-line react/display-name
  const wrapper = (map) => ({ children }) => <MapContext.Provider value={map}>
    {children}
  </MapContext.Provider>;

  const renderUserMapSource = (sourcesConfig, map, defaultConfig) =>
    renderHook(
      () => useMapSources(sourcesConfig, defaultConfig),
      { wrapper: wrapper(map) }
    );

  test('adds source to map properly', () => {
    const sourceConfig = {
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

    renderUserMapSource([sourceConfig], baseMap);

    expect(baseMap.addSource).toHaveBeenCalledTimes(1);
    expect(baseMap.addSource).toHaveBeenCalledWith(sourceConfig.id, {
      ...sourceConfig.options,
      data: sourceConfig.data
    });
  });

  test('adds multiple sources to map properly', () => {
    const configs = [
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

    renderUserMapSource(configs, baseMap);

    expect(baseMap.addSource).toHaveBeenCalledTimes(configs.length);

    configs.forEach((sourceConfig) => {
      expect(baseMap.addSource).toHaveBeenCalledWith(sourceConfig.id, {
        ...sourceConfig.options,
        data: sourceConfig.data
      });
    });
  });

  test('updates data of existing source', () => {
    jest.useFakeTimers();

    const source = {
      setData: jest.fn()
    };
    const map = {
      ...baseMap,
      getSource: jest.fn(() => {
        return source;
      })
    };
    const sourceConfig = {
      id: 'id',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      options: {
        type: 'geojson',
      }
    };

    renderUserMapSource([sourceConfig], map);

    jest.runAllTimers();

    expect(map.getSource).toHaveBeenCalledTimes(3); // Get called 3 times by: adding source check, updating data, returning the source
    expect(source.setData).toHaveBeenCalledTimes(1);
    expect(map.getSource).toHaveBeenCalledWith(sourceConfig.id);
    expect(source.setData).toHaveBeenCalledWith(sourceConfig.data);

    jest.useRealTimers();
  });

  test('updates data of multiple existing sources', () => {
    jest.useFakeTimers();

    const source = {
      setData: jest.fn()
    };
    const map = {
      ...baseMap,
      getSource: jest.fn(() => {
        return source;
      })
    };
    const sourcesConfig = [
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

    renderUserMapSource(sourcesConfig, map);

    jest.runAllTimers();

    expect(map.getSource).toHaveBeenCalledTimes(3 * sourcesConfig.length ); // Get called 3 times by: adding source check, updating data, returning the source
    expect(source.setData).toHaveBeenCalledTimes(2);

    sourcesConfig.forEach((sourceConfig) => {
      expect(map.getSource).toHaveBeenCalledWith(sourceConfig.id);
      expect(source.setData).toHaveBeenCalledWith(sourceConfig.data);
    });

    jest.useRealTimers();
  });

});