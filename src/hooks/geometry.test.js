import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { useEventGeoMeasurementDisplayStrings } from './geometry';

const mockGeometry = {
  'type': 'Feature',
  'properties': {
    area: 377480,
    perimeter: 62900,
  },
  'geometry': {
    'type': 'Polygon',
    'coordinates': [
      [
        [
          0,
          0.1
        ],
        [
          0.1,
          0.2
        ],
        [
          0.2,
          0.3
        ],
        [
          0,
          0.1
        ]
      ]
    ]
  }
};

const wrapper = ({ children }) => <div>{children}</div>;

describe('#useEventGeoMeasurementDisplayStrings', () => {
  test('returning the area and perimeter values of of an un-edited report geometry', async () => {
    const event = { id: 'hello', geometry: mockGeometry };
    const originalEvent = { ...event };

    const { result: { current: [perimeterDisplayString, areaDisplayString] } } = renderHook(() => useEventGeoMeasurementDisplayStrings(event, originalEvent), { wrapper });

    expect(perimeterDisplayString).toBe('62.89km');
    expect(areaDisplayString).toBe('0.37km²');
  });

  test('returning the area and perimeter values of an edited report geometry, with tildes prefixed', () => {
    const event = { id: 'hello', geometry: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [

        ],
      },
    } };
    const originalEvent = { id: 'hello', geometry: mockGeometry };

    event.geometry = {
      ...event.geometry,
      geometry: {
        ...event.geometry.geometry,
        coordinates: [
          [
            [
              0,
              0.1
            ],
            [
              0.1,
              0.2
            ],
            [
              0.21,
              0.22
            ],
            [
              0,
              0.1
            ]
          ]
        ]
      }
    };

    const { result: { current: [perimeterDisplayString, areaDisplayString] } } = renderHook(() => useEventGeoMeasurementDisplayStrings(event, originalEvent), { wrapper });

    expect(areaDisplayString).toBe('~55.76km²');
    expect(perimeterDisplayString).toBe('~55.05km');
  });

  test('returning 0 when there is no report geometry to render', () => {
    const withNoGeo = { id: 'hello', geometry: null };

    const { result: { current: [perimeterDisplayString, areaDisplayString] } } = renderHook(() => useEventGeoMeasurementDisplayStrings(withNoGeo, withNoGeo), { wrapper });

    expect(perimeterDisplayString).toBe('0km');
    expect(areaDisplayString).toBe('0km²');
  });

  test('using meters as the unit for small areas and lengths', () => {
    let geometry = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [
              -104.08357165065672,
              20.49214874439909
            ],
            [
              -104.08357120256102,
              20.49220937141014
            ],
            [
              -104.08322023208088,
              20.492247999370306
            ],
            [
              -104.08316697643782,
              20.492134600378463
            ],
            [
              -104.08357165065672,
              20.49214874439909
            ]
          ]
        ]
      }
    };

    const originalEvent = { id: 'hello', geometry: null };
    const updatedEvent = { ...originalEvent, geometry };

    const { result: { current: [perimeterDisplayString, areaDisplayString] } } = renderHook(() => useEventGeoMeasurementDisplayStrings(updatedEvent, originalEvent), { wrapper });

    expect(perimeterDisplayString).toBe('~99.5m');
    expect(areaDisplayString).toBe('~385.36m²');
  });
});