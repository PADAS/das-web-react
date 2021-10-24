import React from 'react';
import { Provider } from 'react-redux';

import { render, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../__test-helpers/MockStore';
import { createMapMock } from '../__test-helpers/mocks';

import LocationSearch from '../LocationSearchControl';
import { MapContext } from '../App';

let store;
let map;

beforeEach(() => {
  store = mockStore();
  map = createMapMock();
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

describe('input value', () => {
  it('updates on change', () => {
    const { queryByPlaceholderText } = render(
      <Provider store={store}>
        <LocationSearch />
      </Provider>
    );
    const searchInput = queryByPlaceholderText('Search Location ...');
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Seatle' } } );
    });
    expect(searchInput.value).toBe('Seatle');
  });

});

// describe('api call', () => {
//   test('fetch request', () => {});
// });