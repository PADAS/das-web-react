import React from 'react';
import { createMapMock } from '../__test-helpers/mocks';
import { render } from '@testing-library/react';

import SkyLayer, { DEFAULT_SKY_LAYER_CONFIG } from './';

let map;


beforeEach(() => {
  map = createMapMock({ getLayer: jest.fn().mockImplementation(() => null) });
});


test('adding a sky layer to the map', () => {
  render( <SkyLayer map={map} />);

  expect(map.addLayer).toHaveBeenCalledWith(DEFAULT_SKY_LAYER_CONFIG);
  
});