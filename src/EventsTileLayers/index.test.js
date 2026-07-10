import React from 'react';
import { featureCollection, point } from '@turf/turf';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

import EventsTileLayers from './';
import { mockStore } from '../__test-helpers/MockStore';
import { primeEventIconParams } from '../utils/eventMapIcons';
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import useTileEventFeatures from '../hooks/useTileEventFeatures';

let vectorLayerRendered;
let realtimeLayerRendered;
let clusterSymbolsRendered;

jest.mock('../EventsVectorLayer', () => (props) => {
  vectorLayerRendered = props;
  return null;
});
jest.mock('../EventsRealtimeOverlayLayer', () => (props) => {
  realtimeLayerRendered = props;
  return null;
});
jest.mock('../EventsClusterSymbolsLayer', () => (props) => {
  clusterSymbolsRendered = props;
  return null;
});
jest.mock('../hooks/useTileEventFeatures', () => jest.fn());
jest.mock('../selectors/events-realtime-overlay', () => ({
  selectRealtimeOverlayFeatureCollection: jest.fn(),
}));
jest.mock('../utils/eventMapIcons', () => ({
  primeEventIconParams: jest.fn(),
}));

const store = mockStore({ data: {}, view: {} });

const renderEventsTileLayers = (onEventClick) => render(
  <Provider store={store}>
    <EventsTileLayers onEventClick={onEventClick} />
  </Provider>
);

describe('EventsTileLayers', () => {
  beforeEach(() => {
    vectorLayerRendered = undefined;
    realtimeLayerRendered = undefined;
    clusterSymbolsRendered = undefined;
    jest.clearAllMocks();

    useTileEventFeatures.mockReturnValue(featureCollection([]));
    selectRealtimeOverlayFeatureCollection.mockReturnValue(featureCollection([]));
  });

  it('renders the vector, realtime overlay, and cluster symbol layers, threading the click handler', () => {
    const onEventClick = jest.fn();

    renderEventsTileLayers(onEventClick);

    expect(vectorLayerRendered.onEventClick).toBe(onEventClick);
    expect(realtimeLayerRendered.onEventClick).toBe(onEventClick);
    expect(clusterSymbolsRendered.onEventClick).toBe(onEventClick);
  });

  it('primes icon params for the combined tile and realtime overlay features', () => {
    const tileFeature = point([1, 1], { id: 'tile-evt-1', icon_id: 'fire', priority: 200 });
    const overlayFeature = point([2, 2], { id: 'overlay-evt-1', icon_id: 'snare', priority: 100 });
    useTileEventFeatures.mockReturnValue(featureCollection([tileFeature]));
    selectRealtimeOverlayFeatureCollection.mockReturnValue(featureCollection([overlayFeature]));

    renderEventsTileLayers(jest.fn());

    expect(primeEventIconParams).toHaveBeenCalledWith(expect.arrayContaining([tileFeature, overlayFeature]));
  });
});
