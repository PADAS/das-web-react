import React from 'react';
import { Provider } from 'react-redux';

import { render, act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../__test-helpers/MockStore';
import { createMapMock } from '../__test-helpers/mocks';

import LocationSearch from '../LocationSearchControl';
import SearchBar from '../SearchBar';
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

test('input value should update on change', async() => {
  const { getByPlaceholderText } = render(
    <Provider store={store}>
      <SearchBar />
    </Provider>
  );
  const searchInput = getByPlaceholderText('Search...');
  userEvent.type(searchInput, 'Seatle');
  expect(searchInput.value).toBe('Seatle');
});

// test('marker popup should show on map on click query result', () => {
//   render(
//     <Provider store={store}>
//       <MapContext.Provider value={map}>
//         <LocationSearch />
//       </MapContext.Provider>
//     </Provider>
//   );

//   act(() => {
//     map.__test__.fireHandlers('dropped-marker', { location: { lng: 36.81667, lat: -1.28333 } });
//   });

//   const listItem = screen.getByRole('listitem');
//   userEvent.click(listItem);

//   const actions = store.getActions();
//   expect(actions.length).toBe(1);

//   const [ popupCall ] = actions;
//   expect(popupCall).toEqual(
//     { type: 'SHOW_POPUP', payload: {
//       type: 'dropped-marker',
//       data: {
//         location: {
//           lng: 36.81667, lat: -1.28333
//         },
//         coordinates: [36.81667, -1.28333],
//       }
//     }
//     }
//   );
// });

// describe('fetchLocation', () => {
//   it('should return data on a successful request', () => {});

//   it('should return error if api error', () => {});
// });