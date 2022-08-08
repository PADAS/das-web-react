import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import MapAreaPicker from './';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { setPickingMapLocationState } from '../ducks/map-ui';

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setPickingMapLocationState: jest.fn(),
}));

describe('MapAreaPicker', () => {
  const onAreaSelectStart = jest.fn();
  let map, setPickingMapLocationStateMock, store;
  beforeEach(() => {
    setPickingMapLocationStateMock = jest.fn(() => () => {});
    setPickingMapLocationState.mockImplementation(setPickingMapLocationStateMock);

    map = createMapMock();

    store = mockStore({
      view: { showUserLocation: true, userLocation: { coords: { latitude: 123, longitude: 456 } } },
    });

    render(
      <Provider store={store}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <MapAreaPicker onAreaSelectStart={onAreaSelectStart}>
              Map Area Picker
            </MapAreaPicker>
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers onAreaSelectStart and setPickingMapLocationState if clicking the picker', async () => {
    expect(onAreaSelectStart).toHaveBeenCalledTimes(0);
    expect(setPickingMapLocationState).toHaveBeenCalledTimes(0);

    const mapAreaPickerButton = await screen.findByTitle('Place geometry on map');
    userEvent.click(mapAreaPickerButton);

    expect(onAreaSelectStart).toHaveBeenCalledTimes(1);
    expect(setPickingMapLocationState).toHaveBeenCalledTimes(1);
    expect(setPickingMapLocationState).toHaveBeenCalledWith(true);
  });
});
