

import React from 'react';
import { Provider } from 'react-redux';


import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import {within} from '@testing-library/dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RightClickMarkerDropper from '../RightClickMarkerDropper';
import { MapContext } from '../App';

let map;
let store;

beforeEach(() => {
  jest.useFakeTimers();
  map = createMapMock();
  store = mockStore();
});

test('rendering without crashing', () => {
  render(
    <Provider store={store}>
      <MapContext.Provider value={map}>
        <RightClickMarkerDropper />
      </MapContext.Provider>
    </Provider>);
});

test('showing a popup on map right click', () => {
  render(
    <Provider store={store}>
      <MapContext.Provider value={map}>
        <RightClickMarkerDropper />
      </MapContext.Provider>
    </Provider>);

  act(() => {
    map.__test__.fireHandlers('contextmenu', { lngLat: { lng: 10.012, lat: 11.666 } });
  });

  const actions = store.getActions();
  expect(actions.length).toBe(1);

  const [popupCall] = actions;

  expect(popupCall).toEqual({ type: 'SHOW_POPUP', payload: {
    type: 'dropped-marker',
    data: {
      location: { 
        lng: 10.012, lat: 11.666 
      }, 
      coordinates: [10.012, 11.666], 
      popupAttrs: {
        offset: [0, 0],
      } 
    }
  }
  });

});