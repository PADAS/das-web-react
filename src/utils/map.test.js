import { calcImgIdFromUrlForMapImages, imgElFromSrc } from './img';
import { createMapMock } from '../__test-helpers/mocks';

import {
  addFeatureCollectionImagesToMap,
  buildGeoSpanFilter,
  calcSidebarPaddingLeft,
  calculatePopoverPlacement,
  safeRemoveMapLayer,
  safeRemoveMapSource,
  safeRemoveMapSourceAndItsLayers,
  waitForMapBounds,
} from './map';

jest.mock('./img', () => ({
  ...jest.requireActual('./img'),
  imgElFromSrc: jest.fn(),
}));

let map;
const errorObj = new Error('invalid LngLat');

describe('waitForMapBounds', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    map = null;
  });

  it('tries to get the map bounds immediately', () => {
    const getBoundsMock = jest.fn().mockImplementation(() => {
      throw errorObj;
    });

    map = createMapMock({ getBounds: getBoundsMock });

    waitForMapBounds(map);

    expect(map.getBounds).toHaveBeenCalledTimes(1);
  });

  it('polls at a specified interval (default 125ms) if no good value is returned initially', () => {
    const getBoundsMock = jest.fn().mockImplementation(() => {
      throw errorObj;
    });

    map = createMapMock({ getBounds: getBoundsMock });

    waitForMapBounds(map);
    expect(map.getBounds).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(125);

    expect(map.getBounds).toHaveBeenCalledTimes(2);
  });

  // the below tests will work once this jest bug is fixed:
  // https://stackoverflow.com/questions/51126786/jest-fake-timers-with-promises

/*   it('polls and resolves when `getBounds` returns a good value', () => {
    const getBoundsMock = jest.fn().mockImplementation(() => successValue);
    
    map = createMapMock({ getBounds: getBoundsMock });
    jest.advanceTimersByTime(500);
    return waitForMapBounds(map).then((val) => {
      expect(val).toEqual(successValue);
    });
  });
  it('polls and rejects if no bounds are returned', async () => {
    const getBoundsMock = jest.fn().mockImplementation(() => {
      throw errorObj;
    });
    
    map = createMapMock({ getBounds: getBoundsMock });
    jest.advanceTimersByTime(2000);
    await expect(waitForMapBounds(map)).rejects.toEqual(errorObj);
  }); */
});

describe('calculatePopoverPlacement', () => {
  beforeEach(() => {
    map = createMapMock();
  });

  test('returns "left" if coordinates are more than 80% to the right of the map', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.5, lng: 38.8 })).toBe('left');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -3, lng: 37.9 })).toBe('left');
  });

  test('returns "right" if coordinates are less than 20% to the left of the map', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.5, lng: 37.3 })).toBe('right');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.8, lng: 37.1 })).toBe('right');
  });

  test('returns "top" if coordinates are more than 80% to the bottom of the map', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.85, lng: 37.5 })).toBe('top');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.91, lng: 37.7 })).toBe('top');
  });

  test('returns "bottom" if coordinates are less than 20% to the top of the map', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.1, lng: 37.8 })).toBe('bottom');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.55, lng: 37.6 })).toBe('bottom');
  });

  test('returns "bottom" by default', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));
    expect(await calculatePopoverPlacement(map, { lat: -2.5, lng: 38 })).toBe('bottom');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.7, lng: 37.5 })).toBe('bottom');
  });
});

describe('buildGeoSpanFilter', () => {
  test('returns null when geoSpan is null', () => {
    expect(buildGeoSpanFilter(null)).toBeNull();
  });

  test('returns null when geoSpan is undefined', () => {
    expect(buildGeoSpanFilter(undefined)).toBeNull();
  });

  test('returns [minLon, minLat, maxLon, maxLat] for a valid geoSpan', () => {
    const geoSpan = { lon: [-10, 10], lat: [-5, 5] };
    expect(buildGeoSpanFilter(geoSpan)).toEqual([-10, -5, 10, 5]);
  });

  test('handles negative coordinate ranges', () => {
    const geoSpan = { lon: [-180, -90], lat: [-90, -45] };
    expect(buildGeoSpanFilter(geoSpan)).toEqual([-180, -90, -90, -45]);
  });

  test('handles a geoSpan that spans the antimeridian', () => {
    const geoSpan = { lon: [170, -170], lat: [-10, 10] };
    expect(buildGeoSpanFilter(geoSpan)).toEqual([170, -10, -170, 10]);
  });

  test('normalizes a reverse-order non-antimeridian span', () => {
    const geoSpan = { lon: [10, -10], lat: [-5, 5] };
    expect(buildGeoSpanFilter(geoSpan)).toEqual([-10, -5, 10, 5]);
  });

  test('preserves an antimeridian span drawn in the other direction', () => {
    const geoSpan = { lon: [-170, 170], lat: [-10, 10] };
    expect(buildGeoSpanFilter(geoSpan)).toEqual([170, -10, -170, 10]);
  });
});

describe('safeRemoveMapLayer / safeRemoveMapSource', () => {
  test('removeLayer is only called when getLayer finds the id', () => {
    const map = {
      getLayer: jest.fn(() => undefined),
      removeLayer: jest.fn(),
    };
    safeRemoveMapLayer(map, 'layer-a');
    expect(map.removeLayer).not.toHaveBeenCalled();
    map.getLayer.mockReturnValue({});
    safeRemoveMapLayer(map, 'layer-a');
    expect(map.removeLayer).toHaveBeenCalledWith('layer-a');
  });

  test('removeSource is only called when getSource finds the id', () => {
    const map = {
      getSource: jest.fn(() => undefined),
      removeSource: jest.fn(),
    };
    safeRemoveMapSource(map, 'source-a');
    expect(map.removeSource).not.toHaveBeenCalled();
    map.getSource.mockReturnValue({});
    safeRemoveMapSource(map, 'source-a');
    expect(map.removeSource).toHaveBeenCalledWith('source-a');
  });
});

describe('safeRemoveMapSourceAndItsLayers', () => {
  const mapWith = (layers) => {
    const style = { layers };
    return {
      getLayer: jest.fn((layerId) => style.layers.find((layer) => layer.id === layerId)),
      getSource: jest.fn(() => ({})),
      getStyle: jest.fn(() => style),
      removeLayer: jest.fn((layerId) => {
        style.layers = style.layers.filter((layer) => layer.id !== layerId);
      }),
      removeSource: jest.fn(),
    };
  };

  test('takes every layer reading from the source off the map', () => {
    const map = mapWith([
      { id: 'layer-a', source: 'source-a' },
      { id: 'layer-b', source: 'source-b' },
      { id: 'layer-c', source: 'source-a' },
    ]);

    safeRemoveMapSourceAndItsLayers(map, 'source-a');

    expect(map.removeLayer).toHaveBeenCalledWith('layer-a');
    expect(map.removeLayer).toHaveBeenCalledWith('layer-c');
    expect(map.removeLayer).not.toHaveBeenCalledWith('layer-b');
  });

  test('takes those layers off before the source they read from', () => {
    const map = mapWith([{ id: 'layer-a', source: 'source-a' }]);

    safeRemoveMapSourceAndItsLayers(map, 'source-a');

    expect(map.removeLayer.mock.invocationCallOrder[0])
      .toBeLessThan(map.removeSource.mock.invocationCallOrder[0]);
  });

  test('removes the source of a style that carries no layers at all', () => {
    const map = mapWith([]);

    safeRemoveMapSourceAndItsLayers(map, 'source-a');

    expect(map.removeSource).toHaveBeenCalledWith('source-a');
  });

  test('leaves a map without a style alone', () => {
    expect(() => safeRemoveMapSourceAndItsLayers(undefined, 'source-a')).not.toThrow();
  });
});

describe('addFeatureCollectionImagesToMap', () => {
  const collectionOf = (...images) => ({
    features: images.map((image) => ({ properties: { image } })),
    type: 'FeatureCollection',
  });

  let imagesMap;
  beforeEach(() => {
    imagesMap = createMapMock();

    imgElFromSrc.mockImplementation((src) => Promise.resolve(`image element for ${src}`));
  });

  test('loads each distinct image of a collection once', async () => {
    const images = await addFeatureCollectionImagesToMap(collectionOf('icon-one', 'icon-two', 'icon-one'));

    expect(images.map((image) => image.icon_id))
      .toEqual([calcImgIdFromUrlForMapImages('icon-one'), calcImgIdFromUrlForMapImages('icon-two')]);
  });

  test('leaves out the images the style it is given already carries', async () => {
    imagesMap.hasImage.mockImplementation((iconId) => iconId === calcImgIdFromUrlForMapImages('icon-one'));

    const images = await addFeatureCollectionImagesToMap(collectionOf('icon-one', 'icon-two'), {}, imagesMap);

    expect(images.map((image) => image.icon_id)).toEqual([calcImgIdFromUrlForMapImages('icon-two')]);
  });
});

describe('calcSidebarPaddingLeft', () => {
  test('returns undefined below the medium layout breakpoint, regardless of the URL', () => {
    expect(calcSidebarPaddingLeft({ pathname: '/events', isMediumLayoutOrLarger: false })).toBeUndefined();
    expect(calcSidebarPaddingLeft({ pathname: '/events/some-id', isMediumLayoutOrLarger: false })).toBeUndefined();
  });

  test('returns undefined when no sidebar tab is open', () => {
    expect(calcSidebarPaddingLeft({ pathname: '/', isMediumLayoutOrLarger: true })).toBeUndefined();
  });

  test('pads for the sidebar width, plus the vertical nav rail, when a tab is open', () => {
    expect(calcSidebarPaddingLeft({ pathname: '/events', isMediumLayoutOrLarger: true })).toBe(582);
  });

  test('pads for the wider detail view when an item is open', () => {
    expect(calcSidebarPaddingLeft({ pathname: '/events/some-event-id', isMediumLayoutOrLarger: true })).toBe(736);
  });

  test('prioritizes the detail-view width over the tab width when both are present', () => {
    expect(calcSidebarPaddingLeft({ pathname: '/patrols/some-patrol-id', isMediumLayoutOrLarger: true })).toBe(736);
  });
});
