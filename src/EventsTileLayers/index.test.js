import React from 'react';
import { render } from '@testing-library/react';
import { featureCollection, point } from '@turf/turf';
import { useSelector } from 'react-redux';

import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import useTileEventFeatures from '../hooks/useTileEventFeatures';

import EventsTileLayers from './';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../hooks/useTileEventFeatures', () => jest.fn());
jest.mock('../selectors/events-realtime-overlay', () => ({ selectRealtimeOverlayFeatureCollection: jest.fn() }));

jest.mock('../EventsVectorLayer', () => () => null);
jest.mock('../EventsRealtimeOverlayLayer', () => () => null);
jest.mock('../EventsClusterSymbolsLayer', () => () => null);

let spriteProps;
jest.mock('../MapImageFromSvgSpriteRenderer', () => (props) => {
  spriteProps = props;
  return null;
});

const setup = ({ tileFC = featureCollection([]), overlayFC = featureCollection([]) } = {}) => {
  useTileEventFeatures.mockReturnValue(tileFC);
  useSelector.mockImplementation((selector) =>
    (selector === selectRealtimeOverlayFeatureCollection ? overlayFC : undefined));

  return render(<EventsTileLayers onEventClick={jest.fn()} />);
};

describe('EventsTileLayers', () => {
  beforeEach(() => {
    spriteProps = undefined;
    jest.clearAllMocks();
  });

  it('preloads sprites from the tile + overlay features', () => {
    setup({
      tileFC: featureCollection([point([1, 1], { id: 'tile-1', icon_id: 'fire', priority: 200 })]),
      overlayFC: featureCollection([point([2, 2], { id: 'overlay-1', icon_id: 'snare', priority: 300 })]),
    });

    const ids = spriteProps.eventFeatureCollection.features.map((f) => f.properties.id);
    expect(ids).toEqual(expect.arrayContaining(['tile-1', 'overlay-1']));
  });

  it('does not render the sprite preloader when there are no features', () => {
    setup();

    expect(spriteProps).toBeUndefined();
  });
});
