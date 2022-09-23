import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import { MapContext } from '../App';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import EventGeometryLayer from './';

describe('The EventGeometry layer', () => {
  let clickMock = jest.fn();
  let map, store;

  beforeEach(() => {
    map = createMapMock();
    store = mockStore({ view: { } });

    render(<Provider store={store}>
      <MapContext.Provider value={map}>
        <EventGeometryLayer onClick={clickMock} />
      </MapContext.Provider>
    </Provider>);
  });

  test('adding the source', () => {
    expect(true).toBe(true);
  });

  // test('handling layer clicks', () => {

  // });

  // test('adding the layer', () => {

  // });

  // test('only adding polygons', () => {

  // });

  // test('filtering out the current event geometry being drawn/edited', () => {

  // });
});