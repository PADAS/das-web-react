import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { MapContext } from '../../App';

import useMapSource from './';

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
      () => useMapSource(sourcesConfig, defaultConfig),
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

    renderUserMapSource(sourceConfig, baseMap);

    expect(baseMap.addSource).toHaveBeenCalledTimes(1);
    expect(baseMap.addSource).toHaveBeenCalledWith(sourceConfig.id, {
      ...sourceConfig.options,
      data: sourceConfig.data
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
        tolerance: 1.5,
        type: 'geojson',
        lineMetrics: true,
        enabled: true
      }
    };

    renderUserMapSource(sourceConfig, map);

    jest.runAllTimers();

    expect(map.getSource).toHaveBeenCalledTimes(3); // Get called 3 times by: adding source check, updating data, returning the source
    expect(map.getSource).toHaveBeenCalledWith(sourceConfig.id);
    expect(source.setData).toHaveBeenCalledTimes(1);
    expect(source.setData).toHaveBeenCalledWith(sourceConfig.data);

    jest.useRealTimers();
  });

});