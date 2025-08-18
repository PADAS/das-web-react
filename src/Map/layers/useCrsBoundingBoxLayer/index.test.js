import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { renderHook } from '../../../test-utils';
import { createMapMock } from '../../../__test-helpers/mocks';
import { GPS_FORMATS } from '../../../utils/location';
import { hidePopup, showPopup } from '../../../ducks/popup';
import { MapContext } from '../../../App';
import { mockStore } from '../../../__test-helpers/MockStore';

import useCrsBoundingBoxLayer from './';

const mapMarkers = [];
let markerRemoved = false;

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Marker: class {
    constructor(marker) { this.marker = marker; }
    addTo() { mapMarkers.push(this.marker); }
    remove() { markerRemoved = true; }
    setLngLat() { return this; }
  },
}));

jest.mock('../../../ducks/popup', () => ({
  ...jest.requireActual('../../../ducks/popup'),
  hidePopup: jest.fn(),
  showPopup: jest.fn(),
}));

describe('useCrsBoundingBoxLayer', () => {
  let map, store;
  beforeEach(() => {
    markerRemoved = false;

    hidePopup.mockImplementation(() => () => {});
    showPopup.mockImplementation(() => () => {});

    map = createMapMock();

    store = {
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        popup: null,
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  afterEach(() => {
    mapMarkers.length = 0;
  });

  const Wrapper = ({ children }) => <Provider store={mockStore(store)}>
    <MapContext value={map}>{children}</MapContext>
  </Provider>;

  it('does not add the coordinate reference system bbox source, layer and control marker if the selected GPS format is not a CRS', async () => {
    map.getSource.mockImplementation(() => false);
    map.getLayer.mockImplementation(() => false);
    renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
    expect(mapMarkers).toHaveLength(0);
  });

  it('does not add the coordinate reference system bbox source, layer and control marker if the selected GPS format is a CRS that covers most of the world', async () => {
    map.getSource.mockImplementation(() => false);
    map.getLayer.mockImplementation(() => false);
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'World.',
      bbox: [-180, -90, 180, 90],
      code: '4326',
      name: 'WGS 84',
      proj4: '+proj=longlat +datum=WGS84 +no_defs +type=crs',
    }];
    store.view.userPreferences.gpsFormat = '4326';
    renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
    expect(mapMarkers).toHaveLength(0);
  });

  it('adds the coordinate reference system bbox source and layer', async () => {
    map.getSource.mockImplementation(() => false);
    map.getLayer.mockImplementation(() => false);
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 2.21, -81.43, 11.77],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.userPreferences.gpsFormat = '5367';
    renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(map.addSource).toHaveBeenCalledTimes(1);
    expect(map.addSource).toHaveBeenCalledWith('coordinate-reference-system-bbox-source', {
      data: {
        bbox: [-86.5, 2.21, -81.43, 11.77],
        geometry: {
          coordinates: [
            [
              [-86.5, 2.21],
              [-81.43, 2.21],
              [-81.43, 11.77],
              [-86.5, 11.77],
              [-86.5, 2.21]
            ]
          ],
          type: 'Polygon',
        },
        properties: {},
        type: 'Feature',
      },
      type: 'geojson',
    });
    expect(map.addLayer).toHaveBeenCalledTimes(1);
    expect(map.addLayer).toHaveBeenCalledWith({
      id: 'coordinate-reference-system-bbox-layer',
      paint: {
        'line-color': '#006cd9',
        'line-width': 4,
      },
      source: 'coordinate-reference-system-bbox-source',
      type: 'line',
    });
  });

  it('updates the coordinate reference system bbox source data if the source is already defined', async () => {
    const crsBboxSource = { setData: jest.fn() };
    map.getSource.mockImplementation(() => crsBboxSource);
    map.getLayer.mockImplementation(() => false);
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 2.21, -81.43, 11.77],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.userPreferences.gpsFormat = '5367';
    renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(crsBboxSource.setData).toHaveBeenCalledTimes(1);
    expect(crsBboxSource.setData).toHaveBeenCalledWith({
      bbox: [-86.5, 2.21, -81.43, 11.77],
      geometry: {
        coordinates: [
          [
            [-86.5, 2.21],
            [-81.43, 2.21],
            [-81.43, 11.77],
            [-86.5, 11.77],
            [-86.5, 2.21]
          ]
        ],
        type: 'Polygon',
      },
      properties: {},
      type: 'Feature',
    });
  });

  it('does not add the layer again if it is already defined', async () => {
    const crsBboxLayer = {};
    map.getSource.mockImplementation(() => false);
    map.getLayer.mockImplementation(() => crsBboxLayer);
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 2.21, -81.43, 11.77],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.userPreferences.gpsFormat = '5367';
    renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(map.addLayer).not.toHaveBeenCalled();
  });

  it('removes the coordinate reference system bbox source and layer when unmounting', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 2.21, -81.43, 11.77],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.userPreferences.gpsFormat = '5367';
    const { unmount } = renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    unmount();

    expect(map.removeLayer).toHaveBeenCalledTimes(1);
    expect(map.removeLayer).toHaveBeenCalledWith('coordinate-reference-system-bbox-layer');
    expect(map.removeSource).toHaveBeenCalledTimes(1);
    expect(map.removeSource).toHaveBeenCalledWith('coordinate-reference-system-bbox-source');
  });

  it('adds the coordinate reference system bbox control marker', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 2.21, -81.43, 11.77],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.userPreferences.gpsFormat = '5367';
    renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(mapMarkers).toHaveLength(1);
    expect(mapMarkers[0].element).toHaveTextContent('CR05 / CRTM05');
  });

  it('shows the gps format toggle popup when clicking the control marker', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 2.21, -81.43, 11.77],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.userPreferences.gpsFormat = '5367';
    renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(showPopup).not.toHaveBeenCalled();

    await userEvent.click(mapMarkers[0].element);

    expect(showPopup).toHaveBeenCalledTimes(1);
    expect(showPopup).toHaveBeenCalledWith('gps-format-toggle', {
      coordinates: [-86.5, 11.77],
      popupAttrsOverride: {
        offset: [0, 0],
      },
    });
  });

  it('hides the gps format toggle popup when clicking the control marker if the popup is open', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 2.21, -81.43, 11.77],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.popup = { type: 'gps-format-toggle' };
    store.view.userPreferences.gpsFormat = '5367';
    renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(hidePopup).not.toHaveBeenCalled();

    await userEvent.click(mapMarkers[0].element);

    expect(hidePopup).toHaveBeenCalledTimes(1);
  });

  it('removes the coordinate reference system bbox control marker when unmounting', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 2.21, -81.43, 11.77],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.userPreferences.gpsFormat = '5367';
    const { unmount } = renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(markerRemoved).toBe(false);

    unmount();

    expect(markerRemoved).toBe(true);
  });

  it('hides the gps format toggle popup when when removing the control marker if the popup is open', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [-86.5, 2.21, -81.43, 11.77],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }];
    store.view.popup = { type: 'gps-format-toggle' };
    store.view.userPreferences.gpsFormat = '5367';
    const { unmount } = renderHook(() => useCrsBoundingBoxLayer(), { wrapper: Wrapper });

    expect(hidePopup).not.toHaveBeenCalled();

    unmount();

    expect(hidePopup).toHaveBeenCalledTimes(1);
  });
});
