import React from 'react';
import { Provider } from 'react-redux';

import { GPS_FORMATS } from '../utils/location';
import { MapContext } from '../MapContext';
import { mockStore } from '../__test-helpers/MockStore';
import { createMapMock } from '../__test-helpers/mocks';
import { render } from '../test-utils';

import PointPopup from './PointPopup';

const popupDomContent = [];

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Popup: class {
    addTo() {}
    on() {}
    remove() {}
    setDOMContent(domContent) { popupDomContent.push(domContent); }
    setLngLat() {}
    setOffset() {}
  },
}));

jest.mock('../AddItemButton', () => () => null);

const store = {
  data: {},
  view: {
    coordinateReferenceSystems: {
      selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
      storedSystems: [],
    },
    userPreferences: { gpsFormat: GPS_FORMATS.DEG },
  },
};

const renderComponent = (points, { drawing = false, pointIndex = points.length - 1 } = {}) => {
  render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={createMapMock()}>
        <PointPopup drawing={drawing} points={points} pointIndex={pointIndex} onClickFinish={jest.fn()} />
      </MapContext.Provider>
    </Provider>
  );

  return popupDomContent[popupDomContent.length - 1];
};

describe('MapRulerControl - PointPopup', () => {
  beforeEach(() => {
    popupDomContent.length = 0;
  });

  test('does not show the area with fewer than three points', () => {
    const popup = renderComponent([[0, 0], [1, 0]]);

    expect(popup).toHaveTextContent('Distance from start:');
    expect(popup).not.toHaveTextContent('Area:');
  });

  test('shows the area of the closed ring with three points', () => {
    const popup = renderComponent([[0, 0], [1, 0], [1, 1]]);

    expect(popup).toHaveTextContent('Area: 6181.86km²');
  });

  test('shows a small area in square meters', () => {
    const popup = renderComponent([[0, 0], [0.00063, 0], [0.00063, 0.00063], [0, 0.00063]]);

    expect(popup).toHaveTextContent('Area: 4907.41m²');
  });

  test('does not show the area of a self-crossing ring', () => {
    const popup = renderComponent([[0, 0], [1, 1], [1, 0], [0, 1]]);

    expect(popup).toHaveTextContent('Distance from start:');
    expect(popup).not.toHaveTextContent('Area:');
  });

  test('shows the area on a popup for a point other than the last one', () => {
    const popup = renderComponent([[0, 0], [1, 0], [1, 1]], { pointIndex: 1 });

    expect(popup).toHaveTextContent('Area: 6181.86km²');
  });

  test('while drawing, shows only the finish button', () => {
    const popup = renderComponent([[0, 0], [1, 0], [1, 1]], { drawing: true });

    expect(popup).toHaveTextContent('click here to finish');
    expect(popup).not.toHaveTextContent('Area:');
  });
});
