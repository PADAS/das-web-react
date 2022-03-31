import React from 'react';
import { Provider } from 'react-redux';

import { render } from '@testing-library/react';

import { mockStore } from '../__test-helpers/MockStore';
import { createMapMock } from '../__test-helpers/mocks';

import LocationSearch from '../LocationSearchControl';
import { MapContext } from '../App';

let store;
let map;

beforeEach(() => {
  map = createMapMock();
  store = mockStore();
}
);

test('component renders without crashing', () => {
  render(
    <Provider store={store}>
      <MapContext.Provider value={map} >
        <LocationSearch />
      </MapContext.Provider>
    </Provider>
  );
});
