import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { useEventGeoMeasurementDisplayStrings } from './geometry';

console.log({ renderHook });

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

    const { result: { current } } = renderHook(() => useEventGeoMeasurementDisplayStrings(event, originalEvent), { wrapper });

    const [perimeterDisplayString, areaDisplayString] = current;

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

    const { result: { current } } = renderHook(() => useEventGeoMeasurementDisplayStrings(event, originalEvent), { wrapper });

    const [perimeterDisplayString, areaDisplayString] = current;
    expect(areaDisplayString).toBe('~55763.97km²');
    expect(perimeterDisplayString).toBe('~55.05km');
  });

  test('returning 0 when there is no report geometry to render', () => {
    const withNoGeo = { id: 'hello', geometry: null };

    const { result: { current } } = renderHook(() => useEventGeoMeasurementDisplayStrings(withNoGeo, withNoGeo), { wrapper });

    const [perimeterDisplayString, areaDisplayString] = current;

    expect(perimeterDisplayString).toBe('0km');
    expect(areaDisplayString).toBe('0km²');
  });
});