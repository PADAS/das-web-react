import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../MapContext';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';

import MapRulerControl from './';

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Popup: class {
    addTo() {}
    on() {}
    remove() {}
    setDOMContent() {}
    setLngLat() {}
    setOffset() {}
  },
}));

describe('MapRulerControl', () => {
  let map, setMapDrawingData;

  beforeEach(() => {
    map = createMapMock();
    map.queryRenderedFeatures.mockReturnValue([]);
    setMapDrawingData = jest.fn();
  });

  test('keeps its drawing data out of the surrounding map drawing tools context', async () => {
    render(
      <Provider store={mockStore({ data: {}, view: {} })}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
            <MapRulerControl />
          </MapDrawingToolsContext.Provider>
        </MapContext.Provider>
      </Provider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Map ruler' }));

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
    expect(setMapDrawingData).not.toHaveBeenCalled();
  });
});
