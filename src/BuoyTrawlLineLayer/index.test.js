import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import BuoyLineLayer from './';
import useMapLayers from '../hooks/useMapLayers';
import useMapSources from '../hooks/useMapSources';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../hooks/useMapLayers', () => jest.fn());
jest.mock('../hooks/useMapSources', () => jest.fn());

const createMockSubject = (name, subtype, devices, coordinates) => ({
  type: 'Feature',
  properties: {
    name,
    subject_subtype: subtype,
    additional: { devices },
  },
  geometry: {
    type: 'Point',
    coordinates,
  },
});

describe('BuoyLineLayer', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should not render any lines when no buoy subjects are present', () => {
    useSelector.mockReturnValue({
      features: [],
    });

    render(<BuoyLineLayer />);

    expect(useMapSources).toHaveBeenCalledWith([
      {
        id: 'trawl-lines-source',
        data: { type: 'FeatureCollection', features: [] },
      },
    ]);
    expect(useMapLayers).toHaveBeenCalled();
  });

  test('should filter out non-buoy subjects', () => {
    const mockFeatures = [
      createMockSubject('buoy1', 'other_type', [], [10, 20]),
      createMockSubject('buoy2', 'ropeless_buoy_device', [{ device_id: 'device1' }], [30, 40]),
    ];

    useSelector.mockReturnValue({
      features: mockFeatures,
    });

    render(<BuoyLineLayer />);

    expect(useMapSources).toHaveBeenCalledWith([
      {
        id: 'trawl-lines-source',
        data: { type: 'FeatureCollection', features: [] },
      },
    ]);
  });

  test('should create trawl lines for valid buoy subjects', () => {
    const device1 = createMockSubject('device1', 'ropeless_buoy_device', [{ device_id: 'device1' }, { device_id: 'device2' }], [10, 20]);
    const device2 = createMockSubject('device2', 'ropeless_buoy_device', [{ device_id: 'device1' }, { device_id: 'device2' }], [30, 40]);

    const mockFeatures = [
      device1,
      device2,
    ];

    useSelector.mockReturnValue({
      features: mockFeatures,
    });

    render(<BuoyLineLayer />);

    expect(useMapSources).toHaveBeenCalledWith([
      {
        id: 'trawl-lines-source',
        data: {
          type: 'FeatureCollection',
          features: expect.arrayContaining([
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [[10, 20], [30, 40]]
              }
            }
          ])
        }
      }
    ]);
  });

  test('should handle invalid device references', () => {
    const mockFeatures = [
      createMockSubject('device1', 'ropeless_buoy_device', [], [10, 20]),
      createMockSubject('buoy1', 'ropeless_buoy_device', [
        { device_id: 'device1' },
        { device_id: 'device2' }, // invalid reference
      ], [50, 60]),
    ];

    useSelector.mockReturnValue({
      features: mockFeatures,
    });

    render(<BuoyLineLayer />);

    expect(useMapSources).toHaveBeenCalledWith([
      {
        id: 'trawl-lines-source',
        data: { type: 'FeatureCollection', features: [] },
      },
    ]);
  });
});