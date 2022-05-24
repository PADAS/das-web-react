import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { useLocation as useRouterLocation } from 'react-router-dom';

import { createMapMock } from '../../__test-helpers/mocks';
import { MapContext } from '../../App';
import useJumpToLocation from './';
import { useMatchMedia } from '../';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('../', () => ({
  ...jest.requireActual('../'),
  useMatchMedia: jest.fn(),
}));

describe('useJumpToLocation', () => {
  let map, useRouterLocationMock, useMatchMediaMock;
  beforeEach(() => {
    useRouterLocationMock = jest.fn(() => ({ pathname: '/' }),);
    useRouterLocation.mockImplementation(useRouterLocationMock);
    useMatchMediaMock = jest.fn(() => true);
    useMatchMedia.mockImplementation(useMatchMediaMock);

    map = createMapMock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fits the bounds of the coordinates in the map when there are multiple coordinates', async () => {
    const coordinates = [
      [-104.19557197413907, 20.75709101172957],
      [-105.19557197413907, 21.75709101172957],
    ];

    const Component = () => {
      const jumpToLocation = useJumpToLocation();
      useEffect(() => { jumpToLocation(coordinates); }, [jumpToLocation]);
      return null;
    };

    render(
      <MapContext.Provider value={map}>
        <Component />
      </MapContext.Provider>
    );

    await waitFor(() => {
      expect(map.fitBounds).toHaveBeenCalledTimes(1);
      expect(map.fitBounds).toHaveBeenCalledWith({
        _ne: { lat: 21.75709101172957, lng: -104.19557197413907 },
        _sw: { lat: 20.75709101172957, lng: -105.19557197413907 },
      }, { linear: true, padding: {}, speed: 200 });
    });
  });

  test('eases to the coordinates when they are a single item array', async () => {
    const coordinates = [[-104.19557197413907, 20.75709101172957]];

    const Component = () => {
      const jumpToLocation = useJumpToLocation();
      useEffect(() => { jumpToLocation(coordinates, 12); }, [jumpToLocation]);
      return null;
    };

    render(
      <MapContext.Provider value={map}>
        <Component />
      </MapContext.Provider>
    );

    await waitFor(() => {
      expect(map.easeTo).toHaveBeenCalledTimes(1);
      expect(map.easeTo).toHaveBeenCalledWith({
        center: [-104.19557197413907, 20.75709101172957],
        padding: {},
        speed: 200,
        zoom: 12,
      });
    });
  });

  test('sets the zooma and eases to the coordinates when they are not an array', async () => {
    const coordinates = [-104.19557197413907, 20.75709101172957];

    const Component = () => {
      const jumpToLocation = useJumpToLocation();
      useEffect(() => { jumpToLocation(coordinates, 12); }, [jumpToLocation]);
      return null;
    };

    render(
      <MapContext.Provider value={map}>
        <Component />
      </MapContext.Provider>
    );

    await waitFor(() => {
      expect(map.setZoom).toHaveBeenCalledTimes(1);
      expect(map.setZoom).toHaveBeenCalledWith(12);
      expect(map.easeTo).toHaveBeenCalledTimes(1);
      expect(map.easeTo).toHaveBeenCalledWith({
        center: [-104.19557197413907, 20.75709101172957],
        padding: {},
        speed: 200,
        zoom: 12,
      });
    });
  });

  test('sets the right padding if a sidebar tab is open', async () => {
    useRouterLocationMock = jest.fn(() => ({ pathname: '/reports' }),);
    useRouterLocation.mockImplementation(useRouterLocationMock);

    const coordinates = [-104.19557197413907, 20.75709101172957];

    const Component = () => {
      const jumpToLocation = useJumpToLocation();
      useEffect(() => { jumpToLocation(coordinates, 12); }, [jumpToLocation]);
      return null;
    };

    render(
      <MapContext.Provider value={map}>
        <Component />
      </MapContext.Provider>
    );

    await waitFor(() => {
      expect(map.easeTo).toHaveBeenCalledTimes(1);
      expect(map.easeTo).toHaveBeenCalledWith({
        center: [-104.19557197413907, 20.75709101172957],
        padding: { left: 512 },
        speed: 200,
        zoom: 12,
      });
    });
  });

  test('sets the right padding if a sidebar tab is open in detail view', async () => {
    useRouterLocationMock = jest.fn(() => ({ pathname: '/reports/123' }),);
    useRouterLocation.mockImplementation(useRouterLocationMock);

    const coordinates = [-104.19557197413907, 20.75709101172957];

    const Component = () => {
      const jumpToLocation = useJumpToLocation();
      useEffect(() => { jumpToLocation(coordinates, 12); }, [jumpToLocation]);
      return null;
    };

    render(
      <MapContext.Provider value={map}>
        <Component />
      </MapContext.Provider>
    );

    await waitFor(() => {
      expect(map.easeTo).toHaveBeenCalledTimes(1);
      expect(map.easeTo).toHaveBeenCalledWith({
        center: [-104.19557197413907, 20.75709101172957],
        padding: { left: 736 },
        speed: 200,
        zoom: 12,
      });
    });
  });

  test('does not set padding with the sidebar open if it is a small device', async () => {
    useRouterLocationMock = jest.fn(() => ({ pathname: '/reports/123' }),);
    useRouterLocation.mockImplementation(useRouterLocationMock);
    useMatchMediaMock = jest.fn(() => false);
    useMatchMedia.mockImplementation(useMatchMediaMock);

    const coordinates = [-104.19557197413907, 20.75709101172957];

    const Component = () => {
      const jumpToLocation = useJumpToLocation();
      useEffect(() => { jumpToLocation(coordinates, 12); }, [jumpToLocation]);
      return null;
    };

    render(
      <MapContext.Provider value={map}>
        <Component />
      </MapContext.Provider>
    );

    await waitFor(() => {
      expect(map.easeTo).toHaveBeenCalledTimes(1);
      expect(map.easeTo).toHaveBeenCalledWith({
        center: [-104.19557197413907, 20.75709101172957],
        padding: {},
        speed: 200,
        zoom: 12,
      });
    });
  });
});