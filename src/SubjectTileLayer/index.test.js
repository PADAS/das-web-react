import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import SubjectTileLayer from './';
import { MapContext } from '../App';
import { createMapMock } from '../__test-helpers/mocks';

jest.mock('../App', () => {
  const React = require('react');
  return { MapContext: React.createContext(null) };
});

// Minimal replica of addPropsToGeoJsonByKey for non-collection features.
const mockAddPropsToGeoJsonByKey = (item, key) => {
  if (!item[key]) return item;
  const clone = { ...item };
  ['geojson', 'location', 'geometry', key].forEach((k) => delete clone[k]);
  return {
    ...item,
    [key]: {
      ...item[key],
      properties: { ...clone, ...item[key].properties, id: clone.id ?? item[key]?.properties?.id },
    },
  };
};

jest.mock('../utils/map', () => ({
  addPropsToGeoJsonByKey: (...args) => mockAddPropsToGeoJsonByKey(...args),
  safeRemoveMapLayer: jest.fn(),
  safeRemoveMapSource: jest.fn(),
}));

jest.mock('../constants', () => ({
  API_URL: 'http://test-api.com/',
  LAYER_IDS: { SKY_LAYER: 'sky-layer' },
  SYMBOL_TEXT_SIZE_EXPRESSION: ['interpolate', ['linear'], ['zoom'], 0, 10, 22, 14],
}));

jest.mock('../utils/tracks', () => ({
  getVtRangeParam: (days) => {
    const steps = [30, 45, 60, 90, 150, 210, 365, 500];
    const step = steps.find((s) => days <= s);
    return step !== undefined ? String(step) : 'all';
  },
  buildVtTileUrl: (rangeParam) => `http://test-api.com/observations/segments/tiles/{z}/{x}/{y}.pbf?range=${rangeParam}`,
}));

jest.mock('../selectors/tracks', () => ({
  selectTrackLengthInDays: () => 21,
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../selectors/subjects', () => ({
  selectFreshSubjectIds: (state) => state?.freshSubjectIds ?? [],
}));

// Bypass the multi-layer guard so the inner handler always fires.
jest.mock('../utils/map-handlers', () => ({
  withMultiLayerHandlerAwareness: (_map, fn) => fn,
}));

const STORE_SUBJECT = {
  id: 'subject-aaa',
  name: 'Elephant Alpha',
  subject_type: 'wildlife',
  subject_subtype: 'elephant',
  tracks_available: true,
  device_status_properties: [{ label: 'battery', value: 80, units: '%' }],
  last_position: {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [36.5, -1.3] },
    properties: {
      id: 'subject-aaa',
      image: 'https://example.com/static/elephant-green-male.svg',
      coordinateProperties: { time: '2026-02-09T10:00:00Z' },
    },
  },
};

const buildMockState = (overrides = {}) => ({
  view: {
    showInactiveRadios: true,
  },
  data: {
    subjectStore: { [STORE_SUBJECT.id]: STORE_SUBJECT, ...overrides.subjectStore },
  },
  freshSubjectIds: [],
  ...overrides,
});

describe('SubjectTileLayer', () => {
  let mockMap;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMap = createMapMock();
    mockMap.getFilter = jest.fn().mockReturnValue(null);

    const state = buildMockState();
    useSelector.mockImplementation((selector) => selector(state));
  });

  // ── click handler: store hydration ────────────────────────────────

  describe('click handler hydrates from Redux store', () => {
    test('uses addPropsToGeoJsonByKey when subject exists in store', () => {
      const onSubjectClick = jest.fn();
      mockMap.getSource.mockReturnValue({ type: 'vector' });
      mockMap.getLayer.mockReturnValue({ id: 'exists' });

      // queryRenderedFeatures returns a tile feature with subject id
      const tileFeature = {
        geometry: { type: 'Point', coordinates: [36.5, -1.3] },
        properties: {
          id: STORE_SUBJECT.id,
          name: 'Elephant Alpha',
          image_url: '/static/sprite-src/elephant-green-male.svg',
          recorded_at: '2026-02-09T10:00:00Z',
        },
      };
      mockMap.queryRenderedFeatures.mockReturnValue([tileFeature]);

      render(
        <MapContext.Provider value={mockMap}>
          <SubjectTileLayer onSubjectClick={onSubjectClick} />
        </MapContext.Provider>
      );

      // Simulate a click on the tile layer
      const clickHandler = mockMap.on.mock.calls.find(
        ([event, layerId]) => event === 'click' && layerId === 'subject-tile-layer'
      )?.[2];

      expect(clickHandler).toBeDefined();
      clickHandler({ point: { x: 100, y: 100 } });

      expect(onSubjectClick).toHaveBeenCalledTimes(1);

      const { layer } = onSubjectClick.mock.calls[0][0];
      // The enriched layer should carry store-level properties merged into
      // last_position.properties, matching the GeoJSON SubjectsLayer contract.
      expect(layer.properties.tracks_available).toBe(true);
      expect(layer.properties.coordinateProperties).toEqual({ time: '2026-02-09T10:00:00Z' });
      expect(layer.properties.image).toBe('https://example.com/static/elephant-green-male.svg');
      expect(layer.properties.id).toBe(STORE_SUBJECT.id);
    });

    test('falls back to transformed tile properties when subject not in store', () => {
      // Empty subject store
      const state = buildMockState({ data: { subjectStore: {} } });
      useSelector.mockImplementation((selector) => selector(state));

      const onSubjectClick = jest.fn();
      mockMap.getSource.mockReturnValue({ type: 'vector' });
      mockMap.getLayer.mockReturnValue({ id: 'exists' });

      const tileFeature = {
        geometry: { type: 'Point', coordinates: [36.5, -1.3] },
        properties: {
          id: 'unknown-subject',
          name: 'Unknown',
          image_url: '/static/sprite-src/pin-black-male.svg',
          recorded_at: '2026-02-08T05:00:00Z',
        },
      };
      mockMap.queryRenderedFeatures.mockReturnValue([tileFeature]);

      render(
        <MapContext.Provider value={mockMap}>
          <SubjectTileLayer onSubjectClick={onSubjectClick} />
        </MapContext.Provider>
      );

      const clickHandler = mockMap.on.mock.calls.find(
        ([event, layerId]) => event === 'click' && layerId === 'subject-tile-layer'
      )?.[2];

      clickHandler({ point: { x: 100, y: 100 } });

      expect(onSubjectClick).toHaveBeenCalledTimes(1);
      const { layer } = onSubjectClick.mock.calls[0][0];

      // Fallback layer should have transformed properties
      expect(layer.properties.image).toBe('/static/sprite-src/pin-black-male.svg');
      expect(layer.properties.coordinateProperties).toEqual({ time: '2026-02-08T05:00:00Z' });
      expect(layer.geometry).toEqual(tileFeature.geometry);
    });

    test('does nothing when no feature is clicked', () => {
      const onSubjectClick = jest.fn();
      mockMap.getSource.mockReturnValue({ type: 'vector' });
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
      mockMap.queryRenderedFeatures.mockReturnValue([]);

      render(
        <MapContext.Provider value={mockMap}>
          <SubjectTileLayer onSubjectClick={onSubjectClick} />
        </MapContext.Provider>
      );

      const clickHandler = mockMap.on.mock.calls.find(
        ([event, layerId]) => event === 'click' && layerId === 'subject-tile-layer'
      )?.[2];

      clickHandler({ point: { x: 100, y: 100 } });

      expect(onSubjectClick).not.toHaveBeenCalled();
    });
  });
});
