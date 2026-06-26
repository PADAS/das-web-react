import React from 'react';
import { render } from '@testing-library/react';

import useTileEventFeatures, { EMPTY_TILE_EVENT_FEATURES, TileEventFeaturesContext } from './';

describe('useTileEventFeatures', () => {
  const Capture = ({ onValue }) => {
    onValue(useTileEventFeatures());
    return null;
  };

  it('returns the empty collection when there is no provider', () => {
    let value;
    render(<Capture onValue={(v) => { value = v; }} />);

    expect(value).toBe(EMPTY_TILE_EVENT_FEATURES);
  });

  it('returns the collection supplied by the context provider', () => {
    const featureCollection = { type: 'FeatureCollection', features: [{ properties: { id: 'x' } }] };
    let value;

    render(
      <TileEventFeaturesContext.Provider value={featureCollection}>
        <Capture onValue={(v) => { value = v; }} />
      </TileEventFeaturesContext.Provider>
    );

    expect(value).toBe(featureCollection);
  });
});
