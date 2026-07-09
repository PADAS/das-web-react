import React from 'react';
import { render } from '@testing-library/react';

import EventsTileLayers from './';

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

describe('EventsTileLayers', () => {
  beforeEach(() => {
    vectorLayerRendered = undefined;
    realtimeLayerRendered = undefined;
    clusterSymbolsRendered = undefined;
    jest.clearAllMocks();
  });

  it('renders the vector, realtime overlay, and cluster symbol layers, threading the click handler', () => {
    const onEventClick = jest.fn();

    render(<EventsTileLayers onEventClick={onEventClick} />);

    expect(vectorLayerRendered.onEventClick).toBe(onEventClick);
    expect(realtimeLayerRendered.onEventClick).toBe(onEventClick);
    expect(clusterSymbolsRendered.onEventClick).toBe(onEventClick);
  });
});
