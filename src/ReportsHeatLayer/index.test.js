import React from 'react';
import { featureCollection, point } from '@turf/turf';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import { LAYER_IDS } from '../constants';
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import { useFeatureFlag } from '../hooks';
import useTileEventFeatures from '../hooks/useTileEventFeatures';

import ReportsHeatLayer from './';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../hooks', () => ({ useFeatureFlag: jest.fn() }));
jest.mock('../hooks/useTileEventFeatures', () => jest.fn());
jest.mock('../selectors/events', () => ({ getMapEventSymbolPointsWithVirtualDate: jest.fn() }));
jest.mock('../selectors/events-realtime-overlay', () => ({ selectRealtimeOverlayFeatureCollection: jest.fn() }));

let heatLayerProps;
jest.mock('../HeatLayer', () => (props) => {
  heatLayerProps = props;
  return null;
});

const GEOJSON_FC = featureCollection([point([0, 0], { id: 'geojson-1' })]);

const setup = ({
  flagOn,
  tileFC = featureCollection([]),
  overlayFC = featureCollection([]),
  timeSliderState = { active: false },
} = {}) => {
  useFeatureFlag.mockReturnValue(flagOn);
  useTileEventFeatures.mockReturnValue(tileFC);

  const state = {
    data: { eventFilter: { filter: { date_range: { lower: '2026-06-01T00:00:00.000Z' } } } },
    view: { timeSliderState },
  };
  useSelector.mockImplementation((selector) => {
    if (selector === getMapEventSymbolPointsWithVirtualDate) return GEOJSON_FC;
    if (selector === selectRealtimeOverlayFeatureCollection) return overlayFC;
    return selector(state);
  });

  return render(<ReportsHeatLayer />);
};

describe('ReportsHeatLayer', () => {
  beforeEach(() => {
    heatLayerProps = undefined;
    jest.clearAllMocks();
  });

  describe('flag OFF', () => {
    it('sources from the GeoJSON selector and orders under the legacy event symbols', () => {
      setup({ flagOn: false });

      expect(heatLayerProps.points).toBe(GEOJSON_FC);
      expect(heatLayerProps.beforeLayerId).toBe(LAYER_IDS.EVENT_SYMBOLS);
    });
  });

  describe('flag ON', () => {
    it('merges tile + overlay features and orders under the vector symbols', () => {
      setup({
        flagOn: true,
        tileFC: featureCollection([point([1, 1], { id: 'tile-1' })]),
        overlayFC: featureCollection([point([2, 2], { id: 'overlay-1' })]),
      });

      const ids = heatLayerProps.points.features.map((f) => f.properties.id);
      expect(ids).toEqual(expect.arrayContaining(['tile-1', 'overlay-1']));
      expect(ids).not.toContain('geojson-1');
      expect(heatLayerProps.beforeLayerId).toBe(LAYER_IDS.EVENTS_VECTOR_SYMBOLS);
    });

    it('applies the time-slider hide to overlay features', () => {
      setup({
        flagOn: true,
        tileFC: featureCollection([]),
        overlayFC: featureCollection([
          point([1, 1], { id: 'past', event_time_iso: '2026-06-05T00:00:00.000Z' }),
          point([2, 2], { id: 'future', event_time_iso: '2026-06-30T00:00:00.000Z' }),
        ]),
        timeSliderState: { active: true, virtualDate: '2026-06-10T00:00:00.000Z' },
      });

      const ids = heatLayerProps.points.features.map((f) => f.properties.id);
      expect(ids).toContain('past');
      expect(ids).not.toContain('future');
    });

    it('renders nothing when there are no features', () => {
      setup({ flagOn: true });

      expect(heatLayerProps).toBeUndefined();
    });
  });
});
