import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import MapAreaPicker from './';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { report } from '../__test-helpers/fixtures/reports';
import { setPickingMapAreaState } from '../ducks/map-ui';

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setPickingMapAreaState: jest.fn(),
}));

describe('MapAreaPicker', () => {
  const onAreaSelectStart = jest.fn();
  let map, setPickingMapAreaStateMock, store;
  beforeEach(() => {
    setPickingMapAreaStateMock = jest.fn(() => () => {});
    setPickingMapAreaState.mockImplementation(setPickingMapAreaStateMock);

    map = createMapMock();

    store = mockStore({
      view: { showUserLocation: true, userLocation: { coords: { latitude: 123, longitude: 456 } } },
    });

    render(
      <Provider store={store}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <MapAreaPicker areaFor={report} onAreaSelectStart={onAreaSelectStart}>
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

  test('triggers onAreaSelectStart and setPickingMapAreaState if clicking the picker', async () => {
    expect(onAreaSelectStart).toHaveBeenCalledTimes(0);
    expect(setPickingMapAreaState).toHaveBeenCalledTimes(0);

    const mapAreaPickerButton = await screen.findByTitle('Place geometry on map');
    userEvent.click(mapAreaPickerButton);

    expect(onAreaSelectStart).toHaveBeenCalledTimes(1);
    expect(setPickingMapAreaState).toHaveBeenCalledTimes(1);
    expect(setPickingMapAreaState).toHaveBeenCalledWith(true, report);
  });

  test('jumps to user location if it is available when clicking the picker', async () => {
    expect(map.easeTo).toHaveBeenCalledTimes(0);

    const mapAreaPickerButton = await screen.findByTitle('Place geometry on map');
    userEvent.click(mapAreaPickerButton);

    expect(map.easeTo).toHaveBeenCalledTimes(1);
    expect(map.easeTo).toHaveBeenCalledWith({ center: [456, 123], padding: {}, speed: 200, zoom: 15 });
  });
});
