import React from 'react';
import { Provider } from 'react-redux';
import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';
import { render } from '@testing-library/react';

import MapTerrain, { DEFAULT_TERRAIN_CONFIG } from './';

let store = mockStore({ view: { userPreferences: { enable3D: true } } });
let map;


beforeEach(() => {
  map = createMapMock();
});

test('setting 3D terrain if enabled in user preferences', () => {
  map.getSource = jest.fn().mockImplementation(() => false);

  render(<Provider store={store}>
    <MapTerrain map={map} />
  </Provider>);

  expect(map.addSource).toHaveBeenCalledTimes(1);
  expect(map.setTerrain).toHaveBeenCalledWith(DEFAULT_TERRAIN_CONFIG);

});

test('setting 2D terrain if disabled in user preferences', () => {
  store = mockStore({ view: { userPreferences: { enable3D: false } } });

  map.getSource = jest.fn().mockImplementation(() => false);

  render(<Provider store={store}>
    <MapTerrain map={map} />
  </Provider>);

  expect(map.addSource).toHaveBeenCalledTimes(1);
  expect(map.setTerrain).toHaveBeenCalledWith() /* expect it to be an empty call, which clears the style value */;
});
